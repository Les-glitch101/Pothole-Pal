import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import LeafletMap from "../components/LeafletMap";
import {
  MenuIcon,
  LogoutIcon,
  AlertIcon,
  CheckCircleIcon,
  TrendingIcon,
  MapPinIcon,
  NavigationIcon,
  ChevronRight,
} from "../lib/icons";
import { STATUS } from "../lib/data";
import { useFlow } from "../context/flow";
import { api } from "../lib/api";

const TABS = ["Overview", "Reports", "Teams", "Analytics"];

const STATUS_KEYS = ["new", "review", "scheduled", "repairing", "fixed"];

const TEAM_TONES = {
  onsite: { bg: "#dbe4ff", color: "#1d5beb", label: "On site" },
  dispatched: { bg: "#fef3c7", color: "#d97706", label: "Dispatched" },
  available: { bg: "#dcfce7", color: "#16a34a", label: "Available" },
};

function severityTone(sev) {
  if (sev === "High" || sev === "Severe") return { bg: "#fee2e2", color: "#dc2626" };
  if (sev === "Medium") return { bg: "#fef3c7", color: "#d97706" };
  return { bg: "#dcfce7", color: "#16a34a" };
}

function Dashboard() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("Overview");
  const [stats, setStats] = useState(null);
  const [teams, setTeams] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const { reports, staff, signOut } = useFlow();

  const loadStats = useCallback(() => {
    api("/staff/stats", { role: "staff" })
      .then(setStats)
      .catch(() => setStats(null));
  }, []);

  const loadTeams = useCallback(() => {
    api("/teams", { role: "staff" })
      .then(setTeams)
      .catch(() => setTeams([]));
  }, []);

  useEffect(() => {
    loadStats();
    loadTeams();
    // The team list and the stats move without a reload: when a crew marks a
    // report fixed the tiles and the Teams tab update within ten seconds.
    const timer = setInterval(() => {
      loadStats();
      loadTeams();
    }, 10000);
    return () => clearInterval(timer);
  }, [loadStats, loadTeams]);

  // Work order: report number ascending, so #1 is the first line and the
  // numbers only climb as you scroll (the seed ages reports to match, so the
  // date and the number tell the same story). Finished (fixed) reports are
  // pinned to the bottom where they no longer need attention.
  const queue = useMemo(
    () =>
      [...reports].sort((a, b) => {
        const aFixed = a.status === "fixed" ? 1 : 0;
        const bFixed = b.status === "fixed" ? 1 : 0;
        if (aFixed !== bFixed) return aFixed - bFixed;
        return a.id - b.id;
      }),
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

  const monthly = stats?.monthly || [];
  const maxMonth = Math.max(...monthly.map((m) => m.count), 0);
  const byStatus = stats?.byStatus || {};
  const maxStatus = Math.max(...STATUS_KEYS.map((k) => byStatus[k] || 0), 1);
  const byPriority = stats?.byPriority || {};

  return (
    <div className="flex min-h-screen flex-col bg-navy text-white">
      {/* Header */}
      <header className="relative flex items-center justify-between px-4 pt-5">
        <button
          type="button"
          aria-label="Menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((o) => !o)}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 hover:bg-white/20"
        >
          <MenuIcon className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-extrabold">Staff Portal</h1>
        <span className="w-10" aria-hidden="true" />
      </header>

      {/* Hamburger dropdown: account + log out */}
      {menuOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} aria-hidden="true" />
          <div className="absolute left-4 top-16 z-50 w-60 overflow-hidden rounded-2xl bg-white text-ink shadow-xl ring-1 ring-black/5">
            <div className="border-b border-line px-4 py-3">
              <p className="truncate text-sm font-bold">{staff?.user?.name || "Staff member"}</p>
              <p className="truncate text-xs text-muted">{staff?.user?.email}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                signOut("staff");
              }}
              className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-bold text-red-600 hover:bg-red-50"
            >
              <LogoutIcon className="h-4 w-4" /> Log out
            </button>
          </div>
        </>
      )}

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
            {teams.map((t) => {
              const tone = TEAM_TONES[t.status] || TEAM_TONES.available;
              const Icon = t.status === "onsite" ? AlertIcon : t.status === "dispatched" ? NavigationIcon : CheckCircleIcon;
              return (
                <li key={t.id} className="flex items-center gap-3 rounded-2xl bg-white p-3.5">
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                    style={{ background: tone.bg, color: tone.color }}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-ink">{t.name}</p>
                    <p className="truncate text-xs text-muted">
                      {t.status === "available" || !t.reportRef
                        ? "Ready for the next job"
                        : `${t.status === "onsite" ? "On site at" : "Heading to"} ${t.reportRef} · ${t.area}`}
                    </p>
                  </div>
                  <span
                    className="shrink-0 rounded-md px-2 py-1 text-[11px] font-bold"
                    style={{ background: tone.bg, color: tone.color }}
                  >
                    {tone.label}
                  </span>
                </li>
              );
            })}
            {teams.length === 0 && (
              <p className="mt-6 text-center text-sm font-semibold text-white/60">No teams registered.</p>
            )}
          </ul>
        )}

        {tab === "Analytics" && (
          <div className="mt-4 space-y-4">
            {/* Reports per month (real counts from created_at) */}
            <div className="rounded-3xl bg-white p-4">
              <div className="flex items-center gap-2">
                <TrendingIcon className="h-5 w-5 text-primary" />
                <h2 className="text-sm font-extrabold text-ink">Reports per month</h2>
              </div>
              {maxMonth > 0 ? (
                <div className="mt-4 flex h-44 items-end gap-3">
                  {monthly.map((m) => (
                    <div key={m.month} className="flex flex-1 flex-col items-center gap-1.5">
                      <span className="text-[10px] font-bold text-muted">{m.count}</span>
                      <div
                        className="w-full rounded-t-lg"
                        style={{
                          height: `${Math.max(6, Math.round((m.count / maxMonth) * 128))}px`,
                          background: "#1d5beb",
                        }}
                        title={`${m.count} reports`}
                      />
                      <span className="text-[10px] font-bold text-muted">{m.month}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-sm font-semibold text-muted">No reports yet.</p>
              )}
              <p className="mt-3 text-xs text-muted">Real figures from the database, newest month last.</p>
            </div>

            {/* By status */}
            <div className="rounded-3xl bg-white p-4">
              <h2 className="text-sm font-extrabold text-ink">By status</h2>
              <ul className="mt-3 space-y-2.5">
                {STATUS_KEYS.map((k) => {
                  const s = STATUS[k] || STATUS.new;
                  const count = byStatus[k] || 0;
                  return (
                    <li key={k} className="flex items-center gap-3">
                      <span className="w-24 shrink-0 text-xs font-bold text-ink">{s.label}</span>
                      <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                        <span
                          className="block h-full rounded-full"
                          style={{ width: `${Math.round((count / maxStatus) * 100)}%`, background: s.color }}
                        />
                      </span>
                      <span className="w-8 shrink-0 text-right text-xs font-bold text-muted">{count}</span>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* By priority */}
            <div className="rounded-3xl bg-white p-4">
              <h2 className="text-sm font-extrabold text-ink">By priority</h2>
              <div className="mt-3 grid grid-cols-3 gap-3">
                {[
                  ["P1", "#fee2e2", "#dc2626"],
                  ["P2", "#fef3c7", "#d97706"],
                  ["P3", "#dcfce7", "#16a34a"],
                ].map(([p, bg, color]) => (
                  <div key={p} className="rounded-2xl p-3 text-center" style={{ background: bg }}>
                    <p className="text-xl font-extrabold" style={{ color }}>
                      {byPriority[p] || 0}
                    </p>
                    <p className="mt-0.5 text-[11px] font-bold text-slate-600">{p}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
