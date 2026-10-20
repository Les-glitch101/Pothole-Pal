import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import LeafletMap from "../components/LeafletMap";
import {
  MenuIcon,
  BellIcon,
  AlertIcon,
  CheckCircleIcon,
  TrendingIcon,
  MapPinIcon,
  ChevronRight,
} from "../lib/icons";
import { STATUS } from "../lib/data";
import { useFlow } from "../context/flow";
import { api } from "../lib/api";

const TABS = ["Overview", "Reports", "Teams", "Analytics"];

const CREWS = [
  { name: "Team A — Three Rivers", area: "3 active jobs", status: "On site" },
  { name: "Team B — Sonland Park", area: "1 active job", status: "Dispatched" },
  { name: "Team C — Duncanville", area: "0 active jobs", status: "Available" },
];

function severityTone(sev) {
  if (sev === "High" || sev === "Severe") return { bg: "#fee2e2", color: "#dc2626" };
  if (sev === "Medium") return { bg: "#fef3c7", color: "#d97706" };
  return { bg: "#dcfce7", color: "#16a34a" };
}

function Dashboard() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("Overview");
  const [stats, setStats] = useState(null);
  const { reports, signOut } = useFlow();

  useEffect(() => {
    api("/staff/stats", { role: "staff" })
      .then(setStats)
      .catch(() => setStats(null));
  }, []);

  // The queue is the same live list the resident app sees, ordered by the
  // priority score so triage starts with the worst reports.
  const queue = useMemo(
    () => [...reports].sort((a, b) => b.score - a.score || b.id - a.id),
    [reports],
  );

  const tiles = stats
    ? [
        { label: stats.total.toLocaleString(), sub: "Total Reports", tone: "#fee2e2", color: "#ef4444" },
        { label: String(stats.newCount), sub: "New Reports", tone: "#fef3c7", color: "#d97706" },
        { label: String(stats.fixedCount), sub: "Fixed Issues", tone: "#dcfce7", color: "#16a34a" },
        { label: `${stats.resolutionRate}%`, sub: "Resolution Rate", tone: "#dbe4ff", color: "#1d5beb" },
      ]
    : [];

  return (
    <div className="flex min-h-screen flex-col bg-navy text-white">
      {/* Header */}
      <header className="flex items-center justify-between px-4 pt-5">
        <button
          type="button"
          aria-label="Exit portal"
          onClick={() => signOut("staff")}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 hover:bg-white/20"
        >
          <MenuIcon className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-extrabold">Pothole Portal</h1>
        <button
          type="button"
          aria-label="Alerts"
          className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white/10"
        >
          <BellIcon className="h-5 w-5" />
          <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-amber-400" />
        </button>
      </header>

      {/* Tabs */}
      <div className="mt-4 flex gap-2 overflow-x-auto px-4">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold transition-colors ${
              tab === t ? "bg-primary text-white shadow-md shadow-primary/40" : "bg-white/10 text-white/70"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="flex-1 px-4 pb-8">
        {tab === "Overview" && (
          <>
            {/* Stat tiles (real numbers from the database) */}
            <div className="mt-4 grid grid-cols-2 gap-3">
              {tiles.map((s) => (
                <div key={s.sub} className="rounded-3xl p-4" style={{ background: s.tone }}>
                  <p className="text-2xl font-extrabold" style={{ color: s.color }}>
                    {s.label}
                  </p>
                  <p className="mt-0.5 text-xs font-semibold text-slate-600">{s.sub}</p>
                </div>
              ))}
            </div>

            {/* Heatmap */}
            <div className="mt-4 overflow-hidden rounded-3xl bg-white">
              <div className="flex items-center justify-between px-4 pt-3.5">
                <h2 className="text-sm font-extrabold text-ink">Report Heatmap</h2>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-500">
                  All open reports
                </span>
              </div>
              <div className="mt-3 h-52">
                <LeafletMap heat={stats?.heat || []} zoom={13} className="h-full" />
              </div>
            </div>

            {/* Recent reports */}
            <div className="mt-4 rounded-3xl bg-white p-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-extrabold text-ink">Recent Reports</h2>
                <button
                  type="button"
                  onClick={() => setTab("Reports")}
                  className="flex items-center gap-0.5 text-xs font-bold text-primary"
                >
                  View all <ChevronRight className="h-4 w-4" />
                </button>
              </div>
              <ul className="mt-3 space-y-2.5">
                {(stats?.recent || []).map((r) => {
                  const tone = severityTone(r.severityNote);
                  const status = STATUS[r.status] || STATUS.new;
                  return (
                    <li key={r.id} className="flex items-center gap-3">
                      <span
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                        style={{ background: tone.bg, color: tone.color }}
                      >
                        <AlertIcon className="h-5 w-5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-ink">{r.reporter || "Resident"}</p>
                        <p className="truncate text-xs text-muted">{r.area}</p>
                      </div>
                      <span
                        className="shrink-0 rounded-md px-2 py-1 text-[11px] font-bold"
                        style={{ background: status.bg, color: status.color }}
                      >
                        {status.label}
                      </span>
                    </li>
                  );
                })}
                {stats && (stats.recent || []).length === 0 && (
                  <p className="text-xs font-semibold text-muted">No reports yet.</p>
                )}
              </ul>
            </div>
          </>
        )}

        {tab === "Reports" && (
          <ul className="mt-4 space-y-2.5">
            {queue.map((r) => {
              const status = STATUS[r.status] || STATUS.new;
              const tone = severityTone(r.severityNote);
              return (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => navigate(`/report-details/${r.id}`)}
                    className="flex w-full items-center gap-3 rounded-2xl bg-white p-3 text-left"
                  >
                    <span
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                      style={{ background: tone.bg, color: tone.color }}
                    >
                      <MapPinIcon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-ink">
                        #{r.id} · {r.area}
                      </p>
                      <p className="truncate text-xs text-muted">
                        {r.priority} · {r.severityNote} severity · {r.reportedAt}
                      </p>
                    </div>
                    <span
                      className="shrink-0 rounded-md px-2 py-1 text-[11px] font-bold"
                      style={{ background: status.bg, color: status.color }}
                    >
                      {status.label}
                    </span>
                  </button>
                </li>
              );
            })}
            {queue.length === 0 && (
              <p className="mt-6 text-center text-sm font-semibold text-white/60">No reports in the queue.</p>
            )}
          </ul>
        )}

        {tab === "Teams" && (
          <ul className="mt-4 space-y-2.5">
            {CREWS.map((c) => (
              <li key={c.name} className="flex items-center gap-3 rounded-2xl bg-white p-3.5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
                  <CheckCircleIcon className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-ink">{c.name}</p>
                  <p className="text-xs text-muted">{c.area}</p>
                </div>
                <span className="shrink-0 rounded-md bg-slate-100 px-2 py-1 text-[11px] font-bold text-slate-600">
                  {c.status}
                </span>
              </li>
            ))}
          </ul>
        )}

        {tab === "Analytics" && (
          <div className="mt-4 rounded-3xl bg-white p-4">
            <div className="flex items-center gap-2">
              <TrendingIcon className="h-5 w-5 text-primary" />
              <h2 className="text-sm font-extrabold text-ink">Reports per month</h2>
            </div>
            {/* Static mock bar chart */}
            <div className="mt-4 flex h-44 items-end gap-3">
              {[
                ["May", 46],
                ["Jun", 58],
                ["Jul", 72],
                ["Aug", 64],
                ["Sep", 88],
                ["Oct", 76],
              ].map(([month, h]) => (
                <div key={month} className="flex flex-1 flex-col items-center gap-1.5">
                  <div
                    className="w-full rounded-t-lg bg-primary/85"
                    style={{ height: `${h}%` }}
                    title={`${h} reports`}
                  />
                  <span className="text-[10px] font-bold text-muted">{month}</span>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted">
              Sample figures. The seeded dataset only covers the last 30 days, so there
              is no real history to plot yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
