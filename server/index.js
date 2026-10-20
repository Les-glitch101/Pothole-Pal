// PotholePal API server: Express + SQL Server.
// Start: npm start  (reads .env, listens on :3001, serves dist/ when built)
import crypto from "node:crypto";
import fs from "node:fs";
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

function requireStaff(req, res, next) {
  requireAuth(req, res, () => {
    if (req.user.role !== "staff") {
      return res.status(403).json({ error: { code: "forbidden", message: "Staff access only." } });
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
    reportedAt: relativeTime(row.created_at),
    reporter: row.reporter_name || null,
    isMine: userId != null && row.reporter_id === userId,
    timeline: timelineSlots(history),
  };
}

async function loadReports({ userId = null, order = "recent" } = {}) {
  const orderBy = order === "priority" ? "r.score DESC, r.created_at DESC" : "r.created_at DESC";
  const { recordset } = await pool.request().query(
    `SELECT r.*, u.name AS reporter_name FROM dbo.reports r
     JOIN dbo.users u ON u.id = r.reporter_id ORDER BY ${orderBy}`,
  );
  const timelines = await loadTimeline(recordset.map((r) => r.id));
  return recordset.map((r) => mapReport(r, timelines.get(r.id), userId));
}

async function loadReport(id, userId) {
  const { recordset } = await pool.request().input("id", sql.Int, id).query(
    `SELECT r.*, u.name AS reporter_name FROM dbo.reports r
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
  const token = crypto.randomUUID();
  const user = { id: u.id, name: u.name, email: u.email, role: u.role, points: u.points, level: u.level };
  sessions.set(token, user);
  res.json({ token, user });
});

app.post("/api/v1/auth/logout", (req, res) => {
  sessions.delete(tokenOf(req));
  res.json({ ok: true });
});

app.get("/api/v1/auth/me", requireAuth, async (req, res) => {
  const { recordset } = await pool.request().input("id", sql.Int, req.user.id)
    .query("SELECT id, name, email, role, points, level FROM dbo.users WHERE id = @id");
  if (!recordset[0]) return res.status(401).json({ error: { code: "unauthorized", message: "Please sign in." } });
  res.json(recordset[0]);
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
    address: String(b.address || "Vereeniging, Gauteng, South Africa"),
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

app.patch("/api/v1/reports/:id", requireStaff, async (req, res) => {
  const id = badId(req, res);
  if (id === null) return;
  const status = String(req.body?.status || "");
  if (!STAGE_ORDER.includes(status)) {
    return res.status(400).json({ error: { code: "invalid_status", message: `Status must be one of: ${STAGE_ORDER.join(", ")}.` } });
  }
  const { recordset } = await pool.request().input("id", sql.Int, id)
    .query("SELECT id, ref, reporter_id, status FROM dbo.reports WHERE id = @id");
  const report = recordset[0];
  if (!report) return res.status(404).json({ error: { code: "not_found", message: `Report #${id} could not be found.` } });

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
  if (status === "fixed" && report.reporter_id) {
    await pool.request().input("uid", sql.Int, report.reporter_id)
      .query("UPDATE dbo.users SET points = points + 50 WHERE id = @uid");
    await insertRow(pool.request(), "dbo.notifications", {
      user_id: report.reporter_id,
      report_id: id,
      type: "points",
      title: "You earned 50 points",
      body: "+50 points for reporting issues in your area.",
    });
  }

  res.json(await loadReport(id, req.user.id));
});

app.get("/api/v1/staff/queue", requireStaff, async (req, res) => {
  res.json(await loadReports({ userId: req.user.id, order: "priority" }));
});

app.get("/api/v1/staff/stats", requireStaff, async (req, res) => {
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

  const all = await loadReports({ userId: req.user.id });
  res.json({
    total,
    newCount,
    fixedCount,
    resolutionRate: total ? Math.round((fixedCount / total) * 100) : 0,
    heat,
    recent: all.slice(0, 5),
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

app.get("/api/v1/notifications", requireAuth, async (req, res) => {
  const { recordset } = await pool.request().input("uid", sql.Int, req.user.id)
    .query("SELECT id, report_id, type, title, body, created_at FROM dbo.notifications WHERE user_id = @uid ORDER BY created_at DESC");
  const cutoff = Date.now() - 24 * 3600 * 1000;
  const toItem = (n) => ({
    id: n.id,
    ...(NOTIFICATION_UI[n.type] || NOTIFICATION_UI.verified),
    title: n.title,
    body: n.body,
    reportId: n.report_id,
  });
  const today = recordset.filter((n) => new Date(n.created_at).getTime() >= cutoff).map(toItem);
  const earlier = recordset.filter((n) => new Date(n.created_at).getTime() < cutoff).map(toItem);
  const groups = [];
  if (today.length) groups.push({ group: "Today", items: today });
  if (earlier.length) groups.push({ group: "Earlier", items: earlier });
  res.json(groups);
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
  console.log(`PotholePal API on http://localhost:${server.address().port} (db: ${process.env.DB_NAME})`);
});
