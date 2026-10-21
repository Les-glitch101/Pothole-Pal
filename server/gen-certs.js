/**
 * Generate the self-signed certificate the API serves over https on :3443.
 *   npm run certs
 *
 * Phones need a secure context for the live camera and geolocation, and those
 * APIs stay off on plain http:// anywhere except localhost. The certificate
 * covers localhost, 127.0.0.1 and every current LAN IPv4 address, so the phone
 * shows a one-time "proceed anyway" warning instead of a hard certificate
 * error. Run it again whenever the laptop gets a new IP address.
 *
 * Requires openssl on PATH (Git Bash on Windows has it).
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const dir = path.join(here, "certs");
fs.mkdirSync(dir, { recursive: true });

const ips = new Set(["127.0.0.1"]);
for (const infos of Object.values(os.networkInterfaces())) {
  for (const info of infos || []) {
    if (info.family === "IPv4" && !info.internal) ips.add(info.address);
  }
}
const san = ["DNS:localhost", ...[...ips].map((ip) => `IP:${ip}`)].join(",");

try {
  execFileSync(
    "openssl",
    [
      "req",
      "-x509",
      "-newkey",
      "rsa:2048",
      "-sha256",
      "-days",
      "825",
      "-nodes",
      "-keyout",
      path.join(dir, "key.pem"),
      "-out",
      path.join(dir, "cert.pem"),
      "-subj",
      "/CN=PotholePal local dev",
      "-addext",
      `subjectAltName=${san}`,
    ],
    { stdio: ["ignore", "ignore", "inherit"] },
  );
} catch {
  console.error("openssl was not found on PATH. Run this from Git Bash (it ships openssl).");
  process.exit(1);
}

console.log(`server/certs written. SAN: ${san}`);
console.log("Restart the server to pick them up (npm start in server/).");
