import sql from "mssql";

export const pool = new sql.ConnectionPool({
  server: process.env.DB_SERVER || "localhost",
  database: process.env.DB_NAME || "PotholePal",
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT || 1433),
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true,
  },
  pool: { max: 10, min: 0, idleTimeoutMillis: 30000 },
});

export async function db() {
  await pool.connect();
  return pool;
}

export { sql };
