// PotholePal API server: Express + SQL Server.
// Start: npm start  (reads .env, listens on :3001, serves dist/ when built)
import crypto from "node:crypto";
import fs from "node:fs";
import https from "node:https";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import multer from "multer";
import bcrypt from "bcryptjs";
import { db, sql } from "./db/db.js";
import {
  STAGE_ORDER,
  CENTROID,
  nearestArea,
  scoreReport,
  severityOf,
  distanceKm,
  relativeTime,
  formatStamp,
  rankOf,
  BADGES,
} from "./lib/domain.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(here, "uploads");
const distDir = path.join(here, "..", "dist");
const HAS_DIST = fs.existsSync(distDir);
fs.mkdirSync(uploadsDir, { recursive: true });

const pool = await db();
const app = express();
app.use(express.json());

// ---------------------------------------------------------------- uploads
const EXT = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/svg+xml": ".svg",
  "image/heic": ".heic",
  "image/heif": ".heif",
  "image/gif": ".gif",
};

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => cb(null, crypto.randomUUID() + (EXT[file.mimetype] || ".jpg")),
  }),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype && file.mimetype.startsWith("image/")) return cb(null, true);
    cb(Object.assign(new Error("Only image files can be uploaded."), { status: 400, code: "invalid_photo" }));
  },
});

// ---------------------------------------------------------------- sessions
// Token -> user. In memory: a server restart signs everyone out, and the
// front end reacts to the next 401 by showing the login screen again.
const sessions = new Map();

function tokenOf(req) {
  return (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
}

function requireAuth(req, res, next) {
  const user = sessions.get(tokenOf(req));
  if (!user) return res.status(401).json({ error: { code: "unauthorized", message: "Please sign in." } });
  req.user = user;
  next();
}

// The municipal dashboard and the field-team portal share the report list
// and the stats; only the staff-only endpoints stay staff-only.
function requireStaffOrTeam(req, res, next) {
  requireAuth(req, res, () => {
    if (req.user.role !== "staff" && req.user.role !== "team") {
      return res.status(403).json({ error: { code: "forbidden", message: "Staff or team access only." } });
    }
    next();
  });
}

function requireTeam(req, res, next) {
  requireAuth(req, res, () => {
    if (req.user.role !== "team") {
      return res.status(403).json({ error: { code: "forbidden", message: "Field team access only." } });
    }
    next();
  });
}

// ---------------------------------------------------------------- helpers
async function loadTimeline(ids) {
  const map = new Map();
  if (!ids.length) return map;
  const { recordset } = await pool.request().query(
    `SELECT report_id, status, created_at FROM dbo.report_status_history
     WHERE report_id IN (${ids.join(",")}) ORDER BY created_at ASC`,
  );
  for (const row of recordset) {
    if (!map.has(row.report_id)) map.set(row.report_id, []);
    map.get(row.report_id).push(row);
  }
  return map;
}

function timelineSlots(rows) {
  const slots = Array(5).fill(null);
  for (const row of rows || []) {
    const i = STAGE_ORDER.indexOf(row.status);
    if (i >= 0 && slots[i] === null) slots[i] = formatStamp(row.created_at);
  }
  return slots;
}

function mapReport(row, history, userId) {
  const { severity, severityNote } = severityOf(row.size);
  const reporterPoints = Number(row.reporter_points ?? 0);
  return {
    id: row.id,
    ref: row.ref,
    area: row.area,
    address: row.address,
    lat: parseFloat(row.lat),
    lng: parseFloat(row.lng),
    issueType: row.issue_type,
    size: row.size,
    depth: row.depth,
    severity,
    severityNote,
    traffic: row.traffic,
    damage: row.damage,
    description: row.description,
    status: row.status,
    priority: row.priority,
    score: row.score,
    duplicateCount: row.duplicate_count,
    photo: row.photo_url,
    evidence: row.evidence_url,
    // Proof-of-repair photo the crew attached when closing the report.
    fixedPhoto: row.fixed_photo_url,
    reportedAt: relativeTime(row.created_at),
    createdAt: new Date(row.created_at).toISOString(),
    reporter: row.reporter_name || null,
    // The rank title beside the reporter's name on the details page comes
    // from their points, so it matches what their own profile shows.
    reporterTitle: row.reporter_name ? rankOf(reporterPoints).title : null,
    isMine: userId != null && row.reporter_id === userId,
    timeline: timelineSlots(history),
  };
}

async function loadReports({ userId = null, order = "recent" } = {}) {
  const orderBy = order === "priority" ? "r.score DESC, r.created_at DESC" : "r.created_at DESC";
  const { recordset } = await pool.request().query(
    `SELECT r.*, u.name AS reporter_name, u.points AS reporter_points FROM dbo.reports r
     JOIN dbo.users u ON u.id = r.reporter_id ORDER BY ${orderBy}`,
  );
  const timelines = await loadTimeline(recordset.map((r) => r.id));
  return recordset.map((r) => mapReport(r, timelines.get(r.id), userId));
}

async function loadReport(id, userId) {
  const { recordset } = await pool.request().input("id", sql.Int, id).query(
    `SELECT r.*, u.name AS reporter_name, u.points AS reporter_points FROM dbo.reports r
     JOIN dbo.users u ON u.id = r.reporter_id WHERE r.id = @id`,
  );
  if (!recordset[0]) return null;
  const timelines = await loadTimeline([id]);
  return mapReport(recordset[0], timelines.get(id), userId);
}

function badId(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    res.status(400).json({ error: { code: "invalid_id", message: "Report id must be a number." } });
    return null;
  }
  return id;
}

// ---------------------------------------------------------------- auth
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const STAFF_EMAIL_DOMAIN = "@municipalstaff.com";

function newSession(res, u, status = 200) {
  const token = crypto.randomUUID();
  const user = { id: u.id, name: u.name, email: u.email, role: u.role, points: u.points, level: u.level };
  sessions.set(token, user);
  res.status(status).json({ token, user });
}

// One login for both sides: the role in the database decides where the front
// end sends you, so staff accounts land on the municipal dashboard.
app.post("/api/v1/auth/login", async (req, res) => {
  const email = String(req.body?.email || "").trim().toLowerCase();
  const password = String(req.body?.password || "");
  if (!email || !password) {
    return res.status(400).json({ error: { code: "missing_credentials", message: "Email and password are required." } });
  }
  const { recordset } = await pool.request().input("email", sql.NVarChar(200), email)
    .query("SELECT TOP 1 * FROM dbo.users WHERE email = @email");
  const u = recordset[0];
  const ok = u && (await bcrypt.compare(password, u.password_hash));
  if (!ok) {
    return res.status(401).json({ error: { code: "invalid_credentials", message: "Email or password is incorrect." } });
  }
  newSession(res, u);
});

// Resident sign-up. Role is always resident here, and the staff email domain
// is reserved, so nobody can register their way into the municipal portal.
app.post("/api/v1/auth/register", async (req, res) => {
  const name = String(req.body?.name || "").trim();
  const email = String(req.body?.email || "").trim().toLowerCase();
  const password = String(req.body?.password || "");
  if (!name || !email || !password) {
    return res.status(400).json({ error: { code: "missing_fields", message: "Name, email and password are required." } });
  }
  if (email.length > 200 || !EMAIL_RE.test(email)) {
    return res.status(400).json({ error: { code: "invalid_email", message: "Enter a valid email address." } });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: { code: "weak_password", message: "Password must be at least 8 characters." } });
  }
  if (email.endsWith(STAFF_EMAIL_DOMAIN)) {
    return res.status(400).json({ error: { code: "staff_domain", message: "That email domain is reserved for municipal staff accounts." } });
  }
  const { recordset } = await pool.request().input("email", sql.NVarChar(200), email)
    .query("SELECT id FROM dbo.users WHERE email = @email");
  if (recordset[0]) {
    return res.status(409).json({ error: { code: "email_exists", message: "An account with that email already exists. Sign in instead." } });
  }
  const hash = await bcrypt.hash(password, 10);
  const inserted = await pool.request()
    .input("name", sql.NVarChar(120), name.slice(0, 120))
    .input("email", sql.NVarChar(200), email)
    .input("hash", sql.NVarChar(200), hash)
    .query("INSERT INTO dbo.users (name, email, password_hash, role) OUTPUT INSERTED.id VALUES (@name, @email, @hash, 'resident')");
  newSession(res, { id: inserted.recordset[0].id, name, email, role: "resident", points: 0, level: 1 }, 201);
});

// Password reset. There is no mail service in this demo, so the code is
// returned in the response and the page shows it in a labelled panel; a real
// deployment would email it instead. The code is stored hashed, lives 15
// minutes, and can be used once.
app.post("/api/v1/auth/forgot", async (req, res) => {
  const email = String(req.body?.email || "").trim().toLowerCase();
  if (!email) {
    return res.status(400).json({ error: { code: "missing_email", message: "Email is required." } });
  }
  const { recordset } = await pool.request().input("email", sql.NVarChar(200), email)
    .query("SELECT TOP 1 id FROM dbo.users WHERE email = @email");
  const u = recordset[0];
  if (!u) {
    return res.status(404).json({ error: { code: "no_account", message: "No account with that email address." } });
  }
  const code = String(crypto.randomInt(100000, 1000000));
  const codeHash = await bcrypt.hash(code, 8);
  const expires = new Date(Date.now() + 15 * 60 * 1000);
  await pool.request()
    .input("uid", sql.Int, u.id)
    .input("codeHash", sql.NVarChar(200), codeHash)
    .input("expires", sql.DateTime2, expires)
    .query(`MERGE dbo.password_resets AS target
            USING (SELECT @uid AS user_id) AS src ON target.user_id = src.user_id
            WHEN MATCHED THEN UPDATE SET code_hash = @codeHash, expires_at = @expires, created_at = SYSUTCDATETIME()
            WHEN NOT MATCHED THEN INSERT (user_id, code_hash, expires_at) VALUES (@uid, @codeHash, @expires);`);
  res.json({ ok: true, demoCode: code, expiresInMinutes: 15 });
});

app.post("/api/v1/auth/reset", async (req, res) => {
  const email = String(req.body?.email || "").trim().toLowerCase();
  const code = String(req.body?.code || "").trim();
  const password = String(req.body?.password || "");
  if (!email || !code || !password) {
    return res.status(400).json({ error: { code: "missing_fields", message: "Email, code and new password are required." } });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: { code: "weak_password", message: "Password must be at least 8 characters." } });
  }
  const { recordset } = await pool.request().input("email", sql.NVarChar(200), email)
    .query("SELECT TOP 1 id, name, email, role, points, level FROM dbo.users WHERE email = @email");
  const u = recordset[0];
  const { recordset: resets } = await pool.request()
    .input("uid", sql.Int, u ? u.id : -1)
    .query("SELECT TOP 1 code_hash, expires_at FROM dbo.password_resets WHERE user_id = @uid");
  const row = resets[0];
  const codeOk = row && (await bcrypt.compare(code, row.code_hash));
  const expired = row && new Date(row.expires_at).getTime() < Date.now();
  if (!u || !codeOk || expired) {
    return res.status(400).json({ error: { code: "invalid_code", message: "That code is invalid or has expired. Request a new one." } });
  }
  const hash = await bcrypt.hash(password, 10);
  await pool.request().input("hash", sql.NVarChar(200), hash).input("uid", sql.Int, u.id)
    .query("UPDATE dbo.users SET password_hash = @hash WHERE id = @uid");
  await pool.request().input("uid", sql.Int, u.id)
    .query("DELETE FROM dbo.password_resets WHERE user_id = @uid");
  // A changed password signs out every other session for this account.
  for (const [token, sessionUser] of sessions) {
    if (sessionUser.id === u.id) sessions.delete(token);
  }
  newSession(res, u);
});

app.post("/api/v1/auth/logout", (req, res) => {
  sessions.delete(tokenOf(req));
  res.json({ ok: true });
});

app.get("/api/v1/auth/me", requireAuth, async (req, res) => {
  const { recordset } = await pool.request().input("id", sql.Int, req.user.id)
    .query("SELECT id, name, email, role, points, level FROM dbo.users WHERE id = @id");
  if (!recordset[0]) return res.status(401).json({ error: { code: "unauthorized", message: "Please sign in." } });
  const u = recordset[0];

  // The profile reads this: live report counts feed the badge rules, and the
  // rank title comes from points so it always matches the level chip.
  const { recordset: counts } = await pool.request().input("uid", sql.Int, u.id).query(`
    SELECT COUNT(*) AS reports,
           SUM(CASE WHEN status = 'fixed' THEN 1 ELSE 0 END) AS fixed
    FROM dbo.reports WHERE reporter_id = @uid`);
  const stats = {
    points: Number(u.points),
    reports: Number(counts[0].reports || 0),
    fixed: Number(counts[0].fixed || 0),
  };
  const rank = rankOf(stats.points);
  res.json({
    ...u,
    level: rank.level,
    rank: { title: rank.title, level: rank.level },
    stats,
    badges: BADGES.map((b) => ({ key: b.key, label: b.label, hint: b.hint, earned: b.test(stats) })),
  });
});

// Residents ranked against each other: position, name, rank title, points and
// how much of it they have actually reported. Staff and teams are excluded.
app.get("/api/v1/leaderboard", requireAuth, async (req, res) => {
  const { recordset } = await pool.request().query(`
    SELECT TOP 10 u.id, u.name, u.points,
           (SELECT COUNT(*) FROM dbo.reports r WHERE r.reporter_id = u.id) AS reports,
           (SELECT COUNT(*) FROM dbo.reports r WHERE r.reporter_id = u.id AND r.status = 'fixed') AS fixed
    FROM dbo.users u
    WHERE u.role = 'resident'
    ORDER BY u.points DESC, u.id ASC`);
  const top = recordset.map((r, i) => {
    const rank = rankOf(Number(r.points));
    return {
      position: i + 1,
      id: r.id,
      name: r.name,
      points: Number(r.points),
      level: rank.level,
      title: rank.title,
      reports: Number(r.reports),
      fixed: Number(r.fixed),
    };
  });

  // Where does the signed-in resident sit, even outside the top ten? Ties go
  // to whoever got there first (lower id).
  const { recordset: mine } = await pool.request().input("uid", sql.Int, req.user.id)
    .query("SELECT points FROM dbo.users WHERE id = @uid");
  const myPoints = Number(mine[0]?.points || 0);
  const { recordset: ahead } = await pool.request()
    .input("uid", sql.Int, req.user.id)
    .input("pts", sql.Int, myPoints)
    .query(`SELECT COUNT(*) AS n FROM dbo.users
            WHERE role = 'resident' AND id <> @uid AND (points > @pts OR (points = @pts AND id < @uid))`);
  const { recordset: totalRows } = await pool.request()
    .query("SELECT COUNT(*) AS n FROM dbo.users WHERE role = 'resident'");

  res.json({
    top,
    me: { position: Number(ahead[0].n) + 1, total: Number(totalRows[0].n), points: myPoints },
  });
});

// ---------------------------------------------------------------- reports
app.get("/api/v1/reports", requireAuth, async (req, res) => {
  res.json(await loadReports({ userId: req.user.id }));
});

app.get("/api/v1/reports/:id", requireAuth, async (req, res) => {
  const id = badId(req, res);
  if (id === null) return;
  const report = await loadReport(id, req.user.id);
  if (!report) return res.status(404).json({ error: { code: "not_found", message: `Report #${id} could not be found.` } });
  res.json(report);
});

app.get("/api/v1/reports/:id/history", requireAuth, async (req, res) => {
  const id = badId(req, res);
  if (id === null) return;
  const { recordset } = await pool.request().input("id", sql.Int, id)
    .query("SELECT status, note, created_at FROM dbo.report_status_history WHERE report_id = @id ORDER BY created_at ASC");
  res.json(recordset.map((h) => ({ status: h.status, note: h.note, at: new Date(h.created_at).toISOString() })));
});

app.post("/api/v1/reports", requireAuth, upload.single("photo"), async (req, res) => {
  const b = req.body || {};
  const lat = Number(b.lat);
  const lng = Number(b.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return res.status(400).json({ error: { code: "invalid_location", message: "A location is required." } });
  }
  if (!req.file) {
    return res.status(400).json({ error: { code: "photo_required", message: "A photo is required." } });
  }

  const fields = {
    size: b.size || "Medium",
    depth: b.depth || "Moderate",
    traffic: b.traffic || "Low",
    damage: b.damage === "Yes" ? "Yes" : "No",
  };

  // Duplicate matching (FR-03): not fixed, within 50 m, created in the last
  // 7 days. Bounding box first, then exact haversine on the small set.
  const dLat = 0.0005;
  const dLng = 0.00056;
  const { recordset: candidates } = await pool.request()
    .input("la", sql.Decimal(9, 6), lat - dLat)
    .input("lb", sql.Decimal(9, 6), lat + dLat)
    .input("ga", sql.Decimal(9, 6), lng - dLng)
    .input("gb", sql.Decimal(9, 6), lng + dLng)
    .input("cutoff", sql.DateTime2, new Date(Date.now() - 7 * 24 * 3600 * 1000))
    .query(
      `SELECT id, ref, lat, lng FROM dbo.reports
       WHERE status <> 'fixed' AND created_at >= @cutoff
         AND lat BETWEEN @la AND @lb AND lng BETWEEN @ga AND @gb`,
    );
  const duplicate = candidates.find(
    (c) => distanceKm(lat, lng, parseFloat(c.lat), parseFloat(c.lng)) <= 0.05,
  );
  if (duplicate) {
    await pool.request().input("id", sql.Int, duplicate.id)
      .query("UPDATE dbo.reports SET duplicate_count = duplicate_count + 1, updated_at = SYSUTCDATETIME() WHERE id = @id");
    return res.status(409).json({
      error: {
        code: "duplicate_report",
        message: `This pothole was already reported, reference ${duplicate.ref}.`,
        ref: duplicate.ref,
      },
    });
  }

  const { score, priority } = scoreReport(fields);
  const area = nearestArea(lat, lng);
  const photoUrl = "/uploads/" + req.file.filename;
  const row = await insertReport({
    reporter_id: req.user.id,
    lat,
    lng,
    address: String(b.address || "Vereeniging, Emphuleni District, Gauteng"),
    area,
    issue_type: String(b.issueType || "Pothole"),
    description: String(b.description || ""),
    status: "new",
    priority,
    score,
    photo_url: photoUrl,
    ...fields,
  });

  await insertRow(pool.request(), "dbo.report_status_history", {
    report_id: row.id,
    status: "new",
    changed_by: req.user.id,
  });
  await insertRow(pool.request(), "dbo.notifications", {
    user_id: req.user.id,
    report_id: row.id,
    type: "verified",
    title: `Report ${row.ref} received`,
    body: "Your report is in the queue. Our team will review it shortly.",
  });

  res.status(201).json(await loadReport(row.id, req.user.id));
});

async function insertReport(params) {
  const request = pool.request();
  const cols = [];
  const vars = [];
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) continue;
    cols.push(key);
    vars.push(`@${key}`);
    if (typeof value === "string") request.input(key, sql.NVarChar(Math.max(value.length, 1)), value);
    else if (Number.isInteger(value)) request.input(key, sql.Int, value);
    else request.input(key, sql.Float, value);
  }
  const result = await request.query(
    `INSERT INTO dbo.reports (${cols.join(", ")}) OUTPUT INSERTED.id, INSERTED.ref VALUES (${vars.join(", ")})`,
  );
  return result.recordset[0];
}

async function insertRow(request, table, params) {
  const cols = [];
  const vars = [];
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) continue;
    cols.push(key);
    vars.push(`@${key}`);
    if (value === null) request.input(key, sql.NVarChar(500), null);
    else if (value instanceof Date) request.input(key, sql.DateTime2, value);
    else if (typeof value === "string") request.input(key, sql.NVarChar(Math.max(value.length, 1)), value);
    else if (Number.isInteger(value)) request.input(key, sql.Int, value);
    else request.input(key, sql.Float, value);
  }
  await request.query(`INSERT INTO ${table} (${cols.join(", ")}) VALUES (${vars.join(", ")})`);
}

// Supporting evidence on a duplicate (FR-03 step 3): attach the new photo to
// the existing report instead of creating a second work item.
app.post("/api/v1/reports/:id/evidence", requireAuth, upload.single("photo"), async (req, res) => {
  const id = badId(req, res);
  if (id === null) return;
  if (!req.file) return res.status(400).json({ error: { code: "photo_required", message: "A photo is required." } });
  const { recordset } = await pool.request().input("id", sql.Int, id).query("SELECT id, status FROM dbo.reports WHERE id = @id");
  if (!recordset[0]) return res.status(404).json({ error: { code: "not_found", message: `Report #${id} could not be found.` } });

  const url = "/uploads/" + req.file.filename;
  await pool.request().input("id", sql.Int, id).input("url", sql.NVarChar(400), url)
    .query("UPDATE dbo.reports SET evidence_url = @url, updated_at = SYSUTCDATETIME() WHERE id = @id");
  await insertRow(pool.request(), "dbo.report_status_history", {
    report_id: id,
    status: recordset[0].status,
    note: "Supporting photo added by a resident.",
    changed_by: req.user.id,
  });
  res.json({ ok: true, evidence: url });
});

// ---------------------------------------------------------------- staff
const STATUS_NOTIFICATIONS = {
  review: { type: "verified", title: (r) => `Report ${r.ref} verified`, body: () => "Your pothole report has been reviewed by our team." },
  scheduled: { type: "scheduled", title: () => "Repair scheduled", body: (r) => `Crews will begin work on your report ${r.ref} tomorrow.` },
  repairing: { type: "scheduled", title: () => "Repair started", body: (r) => `A crew is now on site for report ${r.ref}.` },
  fixed: { type: "fixed", title: (r) => `Report ${r.ref} fixed`, body: () => "The pothole has been repaired. Thanks for helping keep the roads safe." },
};

app.patch("/api/v1/reports/:id", requireStaffOrTeam, async (req, res) => {
  const id = badId(req, res);
  if (id === null) return;
  const status = String(req.body?.status || "");
  if (!STAGE_ORDER.includes(status)) {
    return res.status(400).json({ error: { code: "invalid_status", message: `Status must be one of: ${STAGE_ORDER.join(", ")}.` } });
  }
  // Closing needs proof: the photo path below is the only way to fixed.
  if (status === "fixed") {
    return res.status(400).json({
      error: { code: "repair_photo_required", message: "Closing a repair needs a photo: send it to /reports/:id/complete." },
    });
  }
  const { recordset } = await pool.request().input("id", sql.Int, id)
    .query("SELECT id, ref, reporter_id, status FROM dbo.reports WHERE id = @id");
  const report = recordset[0];
  if (!report) return res.status(404).json({ error: { code: "not_found", message: `Report #${id} could not be found.` } });

  // Field crews move the progress only of the report they are standing on:
  // anything else (available, dispatched, or on site elsewhere) is a 403.
  if (req.user.role === "team") {
    const { recordset: mine } = await pool.request().input("uid", sql.Int, req.user.id)
      .query("SELECT status, report_id FROM dbo.teams WHERE user_id = @uid");
    const assignment = mine[0];
    if (!assignment || assignment.status !== "onsite" || Number(assignment.report_id) !== id) {
      return res.status(403).json({
        error: { code: "not_on_site", message: "Your crew must be marked on site at this report to move its progress." },
      });
    }
  }

  let update = "UPDATE dbo.reports SET status = @status, updated_at = SYSUTCDATETIME()";
  if (status === "scheduled") update += ", scheduled_at = SYSUTCDATETIME()";
  if (status === "fixed") update += ", fixed_at = SYSUTCDATETIME()";
  update += " WHERE id = @id";
  await pool.request().input("id", sql.Int, id).input("status", sql.NVarChar(20), status).query(update);

  await insertRow(pool.request(), "dbo.report_status_history", {
    report_id: id,
    status,
    note: req.body?.note ? String(req.body.note).slice(0, 500) : null,
    changed_by: req.user.id,
  });

  const notify = STATUS_NOTIFICATIONS[status];
  if (notify && report.reporter_id) {
    await insertRow(pool.request(), "dbo.notifications", {
      user_id: report.reporter_id,
      report_id: id,
      type: notify.type,
      title: notify.title(report),
      body: notify.body(report),
    });
  }
  if (status === "fixed") await payFixBonus(report);

  res.json(await loadReport(id, req.user.id));
});

// The +50 points that come with a closed report, and the level recompute so a
// rank-up lands at the same moment the points do. Shared by the staff PATCH
// path and the crew's photo-complete endpoint below.
async function payFixBonus(report) {
  if (!report.reporter_id) return;
  const { recordset: earned } = await pool.request().input("uid", sql.Int, report.reporter_id)
    .query("UPDATE dbo.users SET points = points + 50 OUTPUT INSERTED.points WHERE id = @uid");
  const newPoints = Number(earned[0].points);
  await pool.request().input("uid", sql.Int, report.reporter_id).input("level", sql.Int, rankOf(newPoints).level)
    .query("UPDATE dbo.users SET level = @level WHERE id = @uid");
  await insertRow(pool.request(), "dbo.notifications", {
    user_id: report.reporter_id,
    report_id: report.id,
    type: "points",
    title: "You earned 50 points",
    body: "+50 points for reporting issues in your area.",
  });
}

// Closing a repair (FR-12): crews finish the job with one photo that proves
// the work, and that single call moves the report to fixed and stores the
// picture for the residents to see. Teams must be standing on the report;
// staff may close on their behalf.
app.post("/api/v1/reports/:id/complete", requireStaffOrTeam, upload.single("photo"), async (req, res) => {
  const id = badId(req, res);
  if (id === null) return;
  if (!req.file) {
    return res.status(400).json({ error: { code: "photo_required", message: "A photo of the finished repair is required." } });
  }
  const { recordset } = await pool.request().input("id", sql.Int, id)
    .query("SELECT id, ref, reporter_id, status FROM dbo.reports WHERE id = @id");
  const report = recordset[0];
  if (!report) return res.status(404).json({ error: { code: "not_found", message: `Report #${id} could not be found.` } });
  if (report.status === "fixed") {
    return res.status(409).json({ error: { code: "already_fixed", message: `Report ${report.ref} is already marked fixed.` } });
  }

  if (req.user.role === "team") {
    const { recordset: mine } = await pool.request().input("uid", sql.Int, req.user.id)
      .query("SELECT status, report_id FROM dbo.teams WHERE user_id = @uid");
    const assignment = mine[0];
    if (!assignment || assignment.status !== "onsite" || Number(assignment.report_id) !== id) {
      return res.status(403).json({
        error: { code: "not_on_site", message: "Your crew must be marked on site at this report to close the repair." },
      });
    }
  }

  const photoUrl = "/uploads/" + req.file.filename;
  await pool.request().input("id", sql.Int, id).input("url", sql.NVarChar(400), photoUrl)
    .query("UPDATE dbo.reports SET status = 'fixed', fixed_at = SYSUTCDATETIME(), fixed_photo_url = @url, updated_at = SYSUTCDATETIME() WHERE id = @id");
  await insertRow(pool.request(), "dbo.report_status_history", {
    report_id: id,
    status: "fixed",
    note: `Repair finished — photo attached by ${req.user.name}.`,
    changed_by: req.user.id,
  });
  const notify = STATUS_NOTIFICATIONS.fixed;
  if (notify && report.reporter_id) {
    await insertRow(pool.request(), "dbo.notifications", {
      user_id: report.reporter_id,
      report_id: id,
      type: notify.type,
      title: notify.title(report),
      body: notify.body(report),
    });
  }
  await payFixBonus(report);
  res.json(await loadReport(id, req.user.id));
});

app.get("/api/v1/staff/queue", requireStaffOrTeam, async (req, res) => {
  res.json(await loadReports({ userId: req.user.id, order: "priority" }));
});

// -------------------------------------------------------------- field teams
// Live assignment state per team: available, dispatched (heading to site),
// or on site at a specific report. The staff Teams tab and the team portal
// both read this; only the signed-in team can change its own row.
app.get("/api/v1/teams", requireStaffOrTeam, async (req, res) => {
  const { recordset } = await pool.request().query(`
    SELECT u.id, u.name, t.status, t.report_id, t.updated_at, r.ref, r.area
    FROM dbo.users u
    LEFT JOIN dbo.teams t ON t.user_id = u.id
    LEFT JOIN dbo.reports r ON r.id = t.report_id
    WHERE u.role = 'team'
    ORDER BY u.name`);
  res.json(
    recordset.map((t) => ({
      id: t.id,
      name: t.name,
      status: t.status || "available",
      reportId: t.report_id || null,
      reportRef: t.ref || null,
      area: t.area || null,
    })),
  );
});

app.post("/api/v1/teams/status", requireTeam, async (req, res) => {
  const status = String(req.body?.status || "");
  if (!["available", "dispatched", "onsite"].includes(status)) {
    return res.status(400).json({ error: { code: "invalid_status", message: "Status must be available, dispatched or onsite." } });
  }
  let reportId = req.body?.reportId == null ? null : Number(req.body.reportId);
  if (status === "available") {
    reportId = null;
  } else {
    if (!Number.isInteger(reportId)) {
      return res.status(400).json({ error: { code: "report_required", message: "Pick the report your team is working on." } });
    }
    const { recordset } = await pool.request().input("id", sql.Int, reportId)
      .query("SELECT id FROM dbo.reports WHERE id = @id");
    if (!recordset[0]) {
      return res.status(404).json({ error: { code: "not_found", message: `Report #${reportId} could not be found.` } });
    }
    // One report, one crew: nobody else may already be dispatched there or
    // standing on it (picking your own row again is fine).
    const { recordset: held } = await pool.request()
      .input("reportId", sql.Int, reportId)
      .input("uid", sql.Int, req.user.id)
      .query(`SELECT u.name FROM dbo.teams t JOIN dbo.users u ON u.id = t.user_id
              WHERE t.report_id = @reportId AND t.status <> 'available' AND t.user_id <> @uid`);
    if (held[0]) {
      return res.status(409).json({
        error: {
          code: "report_claimed",
          message: `Report #${reportId} is already assigned to ${held[0].name}.`,
        },
      });
    }
  }
  await pool.request()
    .input("uid", sql.Int, req.user.id)
    .input("status", sql.NVarChar(20), status)
    .input("reportId", sql.Int, reportId)
    .query(`MERGE dbo.teams AS target
            USING (SELECT @uid AS user_id) AS src ON target.user_id = src.user_id
            WHEN MATCHED THEN UPDATE SET status = @status, report_id = @reportId, updated_at = SYSUTCDATETIME()
            WHEN NOT MATCHED THEN INSERT (user_id, status, report_id) VALUES (@uid, @status, @reportId);`);
  res.json({ ok: true, status, reportId });
});

app.get("/api/v1/staff/stats", requireStaffOrTeam, async (req, res) => {
  const { recordset } = await pool.request().query(`
    SELECT COUNT(*) AS total,
           SUM(CASE WHEN status = 'new' THEN 1 ELSE 0 END) AS new_count,
           SUM(CASE WHEN status = 'fixed' THEN 1 ELSE 0 END) AS fixed_count
    FROM dbo.reports`);
  const total = Number(recordset[0].total || 0);
  const newCount = Number(recordset[0].new_count || 0);
  const fixedCount = Number(recordset[0].fixed_count || 0);

  const heat = (await pool.request().query("SELECT lat, lng, duplicate_count FROM dbo.reports")).recordset.map((r) => ({
    lat: parseFloat(r.lat),
    lng: parseFloat(r.lng),
    weight: 1 + Number(r.duplicate_count || 0),
  }));

  // Analytics: real reports per month for the last six months, plus status
  // and priority breakdowns, all computed from the database.
  const { recordset: monthlyRows } = await pool.request().query(`
    SELECT FORMAT(created_at, 'yyyy-MM') AS ym, COUNT(*) AS n
    FROM dbo.reports
    WHERE created_at >= DATEADD(month, -5, DATEFROMPARTS(YEAR(SYSDATETIME()), MONTH(SYSDATETIME()), 1))
    GROUP BY FORMAT(created_at, 'yyyy-MM')`);
  const now = new Date();
  const monthly = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const row = monthlyRows.find((r) => r.ym === ym);
    monthly.push({ month: d.toLocaleString("en-US", { month: "short" }), count: Number(row?.n || 0) });
  }

  const byStatusRows = (await pool.request().query("SELECT status, COUNT(*) AS n FROM dbo.reports GROUP BY status")).recordset;
  const byStatus = Object.fromEntries(byStatusRows.map((r) => [r.status, Number(r.n)]));
  const byPriorityRows = (await pool.request().query("SELECT priority, COUNT(*) AS n FROM dbo.reports GROUP BY priority")).recordset;
  const byPriority = Object.fromEntries(byPriorityRows.map((r) => [r.priority, Number(r.n)]));

  const all = await loadReports({ userId: req.user.id });
  res.json({
    total,
    newCount,
    fixedCount,
    resolutionRate: total ? Math.round((fixedCount / total) * 100) : 0,
    heat,
    recent: all.slice(0, 5),
    monthly,
    byStatus,
    byPriority,
  });
});

// ---------------------------------------------------------------- resident stats
app.get("/api/v1/stats", requireAuth, async (req, res) => {
  const { recordset } = await pool.request()
    .input("la", sql.Decimal(9, 6), CENTROID.lat - 0.09)
    .input("lb", sql.Decimal(9, 6), CENTROID.lat + 0.09)
    .input("ga", sql.Decimal(9, 6), CENTROID.lng - 0.09)
    .input("gb", sql.Decimal(9, 6), CENTROID.lng + 0.09)
    .query(`
      SELECT COUNT(*) AS total,
             SUM(CASE WHEN status = 'fixed' THEN 1 ELSE 0 END) AS fixed_count,
             SUM(CASE WHEN lat BETWEEN @la AND @lb AND lng BETWEEN @ga AND @gb THEN 1 ELSE 0 END) AS nearby
      FROM dbo.reports`);
  res.json({
    total: Number(recordset[0].total || 0),
    fixed: Number(recordset[0].fixed_count || 0),
    nearby: Number(recordset[0].nearby || 0),
  });
});

// ---------------------------------------------------------------- notifications
const NOTIFICATION_UI = {
  verified: { icon: "check", tone: "#16a34a" },
  scheduled: { icon: "wrench", tone: "#1d5beb" },
  fixed: { icon: "check", tone: "#16a34a" },
  points: { icon: "award", tone: "#7c3aed" },
  comment: { icon: "message", tone: "#d97706" },
  alert: { icon: "alert", tone: "#ef4444" },
};

const NOTIF_MONTHS = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"];

app.get("/api/v1/notifications", requireAuth, async (req, res) => {
  const { recordset } = await pool.request().input("uid", sql.Int, req.user.id)
    .query("SELECT id, report_id, type, title, body, created_at FROM dbo.notifications WHERE user_id = @uid ORDER BY created_at DESC");
  const toItem = (n) => ({
    id: n.id,
    ...(NOTIFICATION_UI[n.type] || NOTIFICATION_UI.verified),
    title: n.title,
    body: n.body,
    reportId: n.report_id,
  });
  // Grouped by calendar day, not a rolling 24 h window: Today, Yesterday,
  // then the date itself (with the year only when it is not this year).
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);
  const labelOf = (d) =>
    `${d.getDate()} ${NOTIF_MONTHS[d.getMonth()]}${d.getFullYear() !== now.getFullYear() ? ` ${d.getFullYear()}` : ""}`;
  const groups = new Map();
  for (const n of recordset) {
    const when = new Date(n.created_at);
    const label = when >= todayStart ? "Today" : when >= yesterdayStart ? "Yesterday" : labelOf(when);
    if (!groups.has(label)) groups.set(label, []);
    groups.get(label).push(toItem(n));
  }
  res.json([...groups].map(([group, items]) => ({ group, items })));
});

app.post("/api/v1/notifications/:id/read", requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: { code: "invalid_id", message: "Notification id must be a number." } });
  const result = await pool.request().input("id", sql.Int, id).input("uid", sql.Int, req.user.id)
    .query("UPDATE dbo.notifications SET is_read = 1 WHERE id = @id AND user_id = @uid");
  if (result.rowsAffected[0] === 0) return res.status(404).json({ error: { code: "not_found", message: "Notification not found." } });
  res.json({ ok: true });
});

// ---------------------------------------------------------------- errors, static files
app.use((err, req, res, next) => {
  if (!err) return next();
  const status = err.status || err.statusCode || 500;
  if (status >= 500) console.error(err);
  res.status(status).json({
    error: {
      code: status >= 500 ? "server_error" : (typeof err.code === "string" ? err.code : "request_failed"),
      message: status >= 500 ? "Something went wrong on the server." : err.message,
    },
  });
});

app.use("/uploads", express.static(uploadsDir));

if (HAS_DIST) {
  app.use(express.static(distDir));
  app.use((req, res, next) => {
    if (req.method === "GET" && !req.path.startsWith("/api")) return res.sendFile(path.join(distDir, "index.html"));
    next();
  });
}

// PP_PORT, not PORT: some process runners inject PORT=0 for a random free
// port, which would silently move the API away from the Vite proxy target.
const PORT = Number(process.env.PP_PORT || 3001);
const server = app.listen(PORT, () => {
  // address() is null when this callback is reached through the error path
  // (port already taken), so the error handler below does the talking then.
  const addr = server.address();
  if (!addr) return;
  console.log(`PotholePal API on http://localhost:${addr.port} (db: ${process.env.DB_NAME})`);
});
server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(
      `Port ${PORT} is already in use: another PotholePal server is already running. ` +
        "Close that window (Ctrl+C) and start it again.",
    );
    process.exit(1);
  }
  console.error("Server failed to start:", err.message);
  process.exit(1);
});

// ------------------------------------------------------------------ https
// Phones need a secure context for the live camera and geolocation, and
// those APIs ignore plain http:// on anything but localhost. When a local
// certificate exists (npm run certs, gitignored) the same app is also
// served over https on :3443 for phone testing; the phone will warn about
// the self-signed certificate once, then remember the choice.
const certFile = path.join(here, "certs", "cert.pem");
const keyFile = path.join(here, "certs", "key.pem");
const HTTPS_PORT = Number(process.env.PP_HTTPS_PORT || 3443);

if (fs.existsSync(certFile) && fs.existsSync(keyFile)) {
  const httpsServer = https.createServer(
    { cert: fs.readFileSync(certFile), key: fs.readFileSync(keyFile) },
    app,
  );
  httpsServer.on("error", (err) => console.error(`HTTPS on :${HTTPS_PORT} failed:`, err.message));
  httpsServer.listen(HTTPS_PORT, "0.0.0.0", () => {
    console.log(`PotholePal HTTPS on https://localhost:${HTTPS_PORT} (for phones)`);
  });
} else {
  console.log("HTTPS off: server/certs missing — run `npm run certs` first.");
}
