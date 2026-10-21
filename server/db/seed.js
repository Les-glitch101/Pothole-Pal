// Seeds the PotholePal database: users, the seven designed reports from the
// front end's seed data, 90 synthetic older reports so the portal looks alive,
// and the resident's notifications. Run: npm run db:seed
// Each block guards itself, so a partial run can be repeated safely.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import bcrypt from "bcryptjs";
import sql from "mssql";
import { db } from "./db.js";
import { SEED_REPORTS, NOTIFICATIONS, POTHOLE_IMG } from "../../src/lib/data.js";
import { STAGE_ORDER, AREAS, scoreReport } from "../lib/domain.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(here, "..", "uploads");

const USERS = [
  { key: "alex", name: "Alex R.", email: "alex@potholepal.test", password: "resident123", role: "resident", points: 1250, level: 3 },
  { key: "john", name: "John Smith", email: "john@potholepal.test", password: "resident123", role: "resident", points: 640, level: 2 },
  { key: "thabo", name: "Thabo Nkosi", email: "thabo@potholepal.test", password: "resident123", role: "resident", points: 320, level: 1 },
  { key: "sarah", name: "Sarah Patel", email: "sarah@potholepal.test", password: "resident123", role: "resident", points: 480, level: 2 },
  { key: "staff", name: "P. Mokoena", email: "staff@potholepal.test", password: "staff123", role: "staff", points: 0, level: 1 },
  { key: "nkosi", name: "Nkosi", email: "nkosi@municipalstaff.com", password: "staff123", role: "staff", points: 0, level: 1 },
];

const REPORTER_KEY_BY_ID = { 1018: "john", 1019: "sarah", 1020: "thabo", 1021: "john", 1022: "sarah", 1023: "thabo", 1024: "john" };
const CREATED_HOURS_AGO = { 1018: 6, 1019: 96, 1020: 3, 1021: 48, 1022: 30, 1023: 5, 1024: 2 };

// The six notifications from src/lib/data.js, flattened in order.
const NOTIF_TYPE_BY_ICON = { check: "verified", wrench: "scheduled", award: "points", message: "comment", alert: "alert" };
const NOTIF_HOURS_AGO = [2, 4, 6, 11, 70, 110];
const NOTIF_REPORT_ID = [1024, 1024, 1019, null, 1019, null];

const SYN_COUNT = 90;
const SYN_ISSUE = ["Pothole", "Pothole", "Pothole", "Pothole", "Damaged shoulder", "Cracked surface"];
const SYN_SIZE = ["Small", "Medium", "Medium", "Large"];
const SYN_DEPTH = ["Shallow", "Moderate", "Moderate", "Deep"];
const SYN_TRAFFIC = ["Low", "Medium", "Medium", "High"];
const SYN_DESC = [
  "Pothole forming in the middle of the lane.",
  "Road surface broken after the heavy rain.",
  "Deep hole where the kerb meets the road.",
  "Several small potholes clustered together.",
  "Edge of the road is crumbling away.",
  "Sunken patch where a utility trench was cut.",
  "Wide pothole on the approach to the intersection.",
  "Broken tarmac scattering loose stones.",
];

function addInput(request, key, value) {
  if (value === null) return request.input(key, sql.NVarChar(500), null);
  if (value instanceof Date) return request.input(key, sql.DateTime2, value);
  if (typeof value === "string") return request.input(key, sql.NVarChar(Math.max(value.length, 1)), value);
  if (typeof value === "boolean") return request.input(key, sql.Bit, value);
  if (Number.isInteger(value)) return request.input(key, sql.Int, value);
  return request.input(key, sql.Float, value);
}

async function insertRow(request, table, params, { output } = {}) {
  const cols = [];
  const vars = [];
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) continue;
    cols.push(key);
    vars.push(`@${key}`);
    addInput(request, key, value);
  }
  const out = output ? ` OUTPUT ${output}` : "";
  const result = await request.query(`INSERT INTO ${table} (${cols.join(", ")})${out} VALUES (${vars.join(", ")})`);
  return output ? result.recordset[0] : null;
}

async function insertHistory(requestFactory, reportId, stageIdx, createdAt, reporterId, staffId) {
  const elapsed = Date.now() - createdAt.getTime();
  const step = stageIdx > 0 ? (elapsed * 0.9) / stageIdx : 0;
  for (let i = 0; i <= stageIdx; i++) {
    await insertRow(requestFactory(), "dbo.report_status_history", {
      report_id: reportId,
      status: STAGE_ORDER[i],
      changed_by: i === 0 ? reporterId : staffId,
      created_at: new Date(createdAt.getTime() + step * i),
    });
  }
}

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

function weightedStatus() {
  const entries = [["new", 20], ["review", 18], ["scheduled", 15], ["repairing", 12], ["fixed", 35]];
  const total = entries.reduce((sum, [, w]) => sum + w, 0);
  let r = Math.random() * total;
  for (const [value, w] of entries) {
    r -= w;
    if (r <= 0) return value;
  }
  return "new";
}

const q = (s) => `'${String(s).replace(/'/g, "''")}'`;
const iso = (d) => `'${d.toISOString().slice(0, 19)}'`;

const pool = await db();

// ---------------------------------------------------------------- users
const userIdByEmail = new Map();
for (const u of USERS) {
  const existing = await pool.request().input("email", sql.NVarChar(200), u.email).query("SELECT id FROM dbo.users WHERE email = @email");
  if (existing.recordset[0]) {
    userIdByEmail.set(u.email, existing.recordset[0].id);
    continue;
  }
  const hash = await bcrypt.hash(u.password, 10);
  const row = await insertRow(pool.request(), "dbo.users", {
    name: u.name,
    email: u.email,
    password_hash: hash,
    role: u.role,
    points: u.points,
    level: u.level,
  }, { output: "INSERTED.id" });
  userIdByEmail.set(u.email, row.id);
}
const idOf = (key) => userIdByEmail.get(USERS.find((u) => u.key === key).email);
const staffId = idOf("staff");
const alexId = idOf("alex");

// ---------------------------------------------------------------- photo placeholder
fs.mkdirSync(uploadsDir, { recursive: true });
fs.writeFileSync(
  path.join(uploadsDir, "seed-pothole.svg"),
  decodeURIComponent(POTHOLE_IMG.slice(POTHOLE_IMG.indexOf(",") + 1)),
);

// ---------------------------------------------------------------- designed reports
// Identity starts at 1018, so these land on 1018-1024 in id order and the
// first report submitted in the app gets #1025.
const designedCount = await pool.request().query("SELECT COUNT(*) AS n FROM dbo.reports WHERE id BETWEEN 1018 AND 1024");
let reportsSeeded = 0;

if (designedCount.recordset[0].n === 0) {
  const ordered = [...SEED_REPORTS].sort((a, b) => a.id - b.id);
  for (const r of ordered) {
    const createdAt = new Date(Date.now() - CREATED_HOURS_AGO[r.id] * 3600 * 1000);
    const { score, priority } = scoreReport(r);
    const reporterId = idOf(REPORTER_KEY_BY_ID[r.id]);
    const row = await insertRow(pool.request(), "dbo.reports", {
      reporter_id: reporterId,
      lat: r.lat,
      lng: r.lng,
      address: r.address,
      area: r.area,
      issue_type: r.issueType,
      size: r.size,
      depth: r.depth,
      traffic: r.traffic,
      damage: r.damage,
      description: r.description,
      status: r.status,
      priority,
      score,
      photo_url: "/uploads/seed-pothole.svg",
      created_at: createdAt,
      updated_at: createdAt,
    }, { output: "INSERTED.id" });
    await insertHistory(() => pool.request(), row.id, STAGE_ORDER.indexOf(r.status), createdAt, reporterId, staffId);
    reportsSeeded++;
  }
} else {
  console.log(`designed reports already present: ${designedCount.recordset[0].n}`);
}

// ---------------------------------------------------------------- synthetic reports
// 90 older reports so the portal, heatmap and stats look alive. Explicit ids
// 1-90 sit below 1018 and do not move the identity counter, so the next report
// the app creates is still #1025. SET IDENTITY_INSERT plus the inserts run in
// one batch because a batch is a single session, which is what the SET applies to.
const syntheticCount = await pool.request().query(`SELECT COUNT(*) AS n FROM dbo.reports WHERE id BETWEEN 1 AND ${SYN_COUNT}`);

if (syntheticCount.recordset[0].n !== SYN_COUNT) {
  // Clear any partial previous run (history first: it references the rows).
  await pool.request().query(`
    DELETE FROM dbo.report_status_history WHERE report_id BETWEEN 1 AND ${SYN_COUNT};
    DELETE FROM dbo.reports WHERE id BETWEEN 1 AND ${SYN_COUNT};`);

  const synthetic = [];
  const stmts = ["SET IDENTITY_INSERT dbo.reports ON"];
  const COLS = "id, reporter_id, lat, lng, address, area, issue_type, size, depth, traffic, damage, description, status, priority, score, photo_url, created_at, updated_at";

  for (let n = 1; n <= SYN_COUNT; n++) {
    const area = pick(AREAS);
    const createdAt = new Date(Date.now() - Math.random() * 30 * 24 * 3600 * 1000);
    const status = weightedStatus();
    const fields = {
      size: pick(SYN_SIZE),
      depth: pick(SYN_DEPTH),
      traffic: pick(SYN_TRAFFIC),
      damage: Math.random() < 0.2 ? "Yes" : "No",
    };
    const { score, priority } = scoreReport(fields);
    const reporterId = idOf(pick(["john", "thabo", "sarah"]));
    const lat = Number((area.lat + (Math.random() - 0.5) * 0.012).toFixed(6));
    const lng = Number((area.lng + (Math.random() - 0.5) * 0.014).toFixed(6));

    stmts.push(
      `INSERT INTO dbo.reports (${COLS}) VALUES (` +
      [n, reporterId, lat.toFixed(6), lng.toFixed(6), q(`${area.area}, Emphuleni District, Gauteng`), q(area.area),
        q(pick(SYN_ISSUE)), q(fields.size), q(fields.depth), q(fields.traffic), q(fields.damage),
        q(pick(SYN_DESC)), q(status), q(priority), score, q("/uploads/seed-pothole.svg"),
        iso(createdAt), iso(createdAt)].join(", ") + ")",
    );
    synthetic.push({ id: n, status, createdAt, reporterId });
  }
  stmts.push("SET IDENTITY_INSERT dbo.reports OFF");

  await pool.request().batch(stmts.join(";\n"));
  for (const s of synthetic) {
    await insertHistory(() => pool.request(), s.id, STAGE_ORDER.indexOf(s.status), s.createdAt, s.reporterId, staffId);
  }
  reportsSeeded += synthetic.length;
} else {
  console.log(`synthetic reports already present: ${syntheticCount.recordset[0].n}`);
}

// ---------------------------------------------------------------- notifications (Alex)
const notifCount = await pool.request().input("uid", sql.Int, alexId).query("SELECT COUNT(*) AS n FROM dbo.notifications WHERE user_id = @uid");
let notifsSeeded = 0;
if (notifCount.recordset[0].n === 0) {
  let i = 0;
  for (const group of NOTIFICATIONS) {
    for (const item of group.items) {
      await insertRow(pool.request(), "dbo.notifications", {
        user_id: alexId,
        report_id: NOTIF_REPORT_ID[i] ?? null,
        type: NOTIF_TYPE_BY_ICON[item.icon] || "verified",
        title: item.title,
        body: item.body,
        created_at: new Date(Date.now() - NOTIF_HOURS_AGO[i] * 3600 * 1000),
      });
      i++;
      notifsSeeded++;
    }
  }
}

const stats = await pool.request().query(`
  SELECT
    (SELECT COUNT(*) FROM dbo.users) AS users,
    (SELECT COUNT(*) FROM dbo.reports) AS reports,
    (SELECT COUNT(*) FROM dbo.report_status_history) AS history_rows,
    (SELECT COUNT(*) FROM dbo.notifications) AS notifications`);
const s = stats.recordset[0];
console.log(
  `seed complete: ${s.users} users, ${s.reports} reports ` +
  `(${reportsSeeded} added this run), ${s.history_rows} history rows, ` +
  `${s.notifications} notifications (${notifsSeeded} added this run)`,
);
