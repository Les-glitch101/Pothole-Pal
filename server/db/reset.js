// Clears all demo data and lets db:seed rebuild it, so every practice run of
// the demo starts from the same place: seven designed reports (1018-1024) and
// the next submitted report numbered #1025.
// Run: npm run db:reset
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { db } from "./db.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(here, "..", "uploads");

const pool = await db();

// Children first: notifications and history reference reports, reports and
// history reference users.
await pool.request().batch(`
  DELETE FROM dbo.password_resets;
  DELETE FROM dbo.notifications;
  DELETE FROM dbo.report_status_history;
  DELETE FROM dbo.reports;
  DELETE FROM dbo.users;
  DBCC CHECKIDENT ('dbo.reports', RESEED, 1017);`);

// Uploaded photos are disposable; the shared placeholder stays.
if (fs.existsSync(uploadsDir)) {
  for (const file of fs.readdirSync(uploadsDir)) {
    if (file !== "seed-pothole.svg") fs.unlinkSync(path.join(uploadsDir, file));
  }
}

console.log("demo data cleared (reports reseeded to start at 1018 on next seed)");
