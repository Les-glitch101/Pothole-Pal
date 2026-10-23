import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { db } from "./db.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const sqlText = fs.readFileSync(path.join(here, "schema.sql"), "utf8");

const pool = await db();
await pool.request().batch(sqlText);
console.log("schema applied:", process.env.DB_NAME);
