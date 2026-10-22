// Domain rules shared by the API and the seed script.
// Area centroids come straight from the front end's seed data, so both sides
// agree on what "nearest area" means without duplicating coordinates.
import { SEED_REPORTS } from "../../src/lib/data.js";

export const STAGE_ORDER = ["new", "review", "scheduled", "repairing", "fixed"];

// Resident ranks: points buy the title and the level together so both always
// tell the same story. The stored level column is kept in step whenever a
// report reaches fixed and the +50 points land.
export const RANKS = [
  { min: 0, level: 1, title: "Newcomer" },
  { min: 300, level: 2, title: "Road Spotter" },
  { min: 700, level: 3, title: "Road Warrior" },
  { min: 1500, level: 4, title: "Road Guardian" },
  { min: 3000, level: 5, title: "Road Legend" },
];

export function rankOf(points) {
  let current = RANKS[0];
  for (const rank of RANKS) {
    if (points >= rank.min) current = rank;
  }
  return current;
}

// Badges are earned by real counts, never shown as decoration. The hints are
// what the profile page tells the resident is still missing.
export const BADGES = [
  { key: "first_report", label: "First Report", hint: "Submit your first report", test: (s) => s.reports >= 1 },
  { key: "veteran", label: "Veteran Reporter", hint: "Submit 5 reports", test: (s) => s.reports >= 5 },
  { key: "community_hero", label: "Community Hero", hint: "Get 3 reports fixed", test: (s) => s.fixed >= 3 },
  { key: "top_reporter", label: "Top Reporter", hint: "Reach 1,000 points", test: (s) => s.points >= 1000 },
];

export const CENTROID = { lat: -26.6736, lng: 27.9319 };

export const AREAS = SEED_REPORTS.map((r) => ({ area: r.area, lat: r.lat, lng: r.lng }));

export function nearestArea(lat, lng) {
  let best = AREAS[0];
  let bestDist = Infinity;
  for (const a of AREAS) {
    const d = (a.lat - lat) ** 2 + (a.lng - lng) ** 2;
    if (d < bestDist) {
      bestDist = d;
      best = a;
    }
  }
  return best.area;
}

// Priority rule from the handover doc: size + depth + traffic + damage,
// then P1 at 9+ (or damage on a high traffic road), P2 at 6-8, P3 below.
export function scoreReport({ size, depth, traffic, damage }) {
  const sizePts = { Small: 1, Medium: 2, Large: 3 }[size] ?? 1;
  const depthPts = { Shallow: 1, Moderate: 2, Deep: 3 }[depth] ?? 1;
  const trafficPts = { Low: 1, Medium: 2, High: 3 }[traffic] ?? 1;
  const damagePts = damage === "Yes" ? 2 : 0;
  const score = sizePts + depthPts + trafficPts + damagePts;
  const priority =
    score >= 9 || (damage === "Yes" && traffic === "High") ? "P1" : score >= 6 ? "P2" : "P3";
  return { score, priority };
}

export function severityOf(size) {
  return {
    severity: { Small: "Low", Medium: "Medium", Large: "High" }[size] || "Medium",
    severityNote: { Small: "Low", Medium: "Medium", Large: "Severe" }[size] || "Medium",
  };
}

export function distanceKm(lat1, lng1, lat2, lng2) {
  const toRad = (d) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export function relativeTime(value) {
  const then = new Date(value).getTime();
  const s = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (s < 60) return "Just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} minute${m === 1 ? "" : "s"} ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hour${h === 1 ? "" : "s"} ago`;
  const d = Math.floor(h / 24);
  if (d === 1) return "yesterday";
  if (d < 7) return `${d} days ago`;
  const w = Math.floor(d / 7);
  if (w < 5) return `${w} week${w === 1 ? "" : "s"} ago`;
  const mo = Math.floor(d / 30);
  return `${mo} month${mo === 1 ? "" : "s"} ago`;
}

export function formatStamp(value) {
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
