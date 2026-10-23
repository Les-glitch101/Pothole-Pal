import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import LeafletMap from "../components/LeafletMap";
import {
  MenuIcon,
  LogoutIcon,
  AlertIcon,
  CheckCircleIcon,
  TrendingIcon,
  MapPinIcon,
  NavigationIcon,
  ChevronLeft,
  ChevronRight,
} from "../lib/icons";
import { STATUS } from "../lib/data";
import { useFlow } from "../context/flow";
import { api } from "../lib/api";

const TABS = ["Overview", "Reports"];

// The staff action on each status: what clicking "advance" does next. Field
// teams move the progress; the staff portal only displays where it stands.
const NEXT_STEP = {
  new: { status: "review", label: "Start review" },
  review: { status: "scheduled", label: "Schedule repair" },
  scheduled: { status: "repairing", label: "Start repair" },
  repairing: { status: "fixed", label: "Mark as fixed" },
};

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

function TeamDashboard() {
  const [tab, setTab] = useState("Overview");
  const [stats, setStats] = useState(null);
  const [teams, setTeams] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [acting, setActing] = useState(false);
  // Closing a repair needs proof: the crew picks (or shoots) a photo here,
  // and one call to /reports/:id/complete moves the report to fixed.
  const [proving, setProving] = useState(false);
  const [proof, setProof] = useState(null);
  const [proofError, setProofError] = useState(null);
  const fileRef = useRef(null);
  const { reports, team, signOut, refresh } = useFlow();

  const loadStats = useCallback(() => {
    api("/staff/stats", { role: "team" })
      .then(setStats)
      .catch(() => setStats(null));
  }, []);

  const loadTeams = useCallback(() => {
    api("/teams", { role: "team" })
      .then(setTeams)
      .catch(() => setTeams([]));
  }, []);

  useEffect(() => {
    loadStats();
    loadTeams();
    const timer = setInterval(() => {
      loadStats();
      loadTeams();
    }, 10000);
    return () => clearInterval(timer);
  }, [loadStats, loadTeams]);

  // This team's own live state, mirrored from the shared teams list so the
  // staff portal and this portal always agree.
  const me = useMemo(
    () => teams.find((t) => t.id === team?.user?.id) || null,
    [teams, team],
  );
  const myStatus = me?.status || "available";
  const tone = TEAM_TONES[myStatus] || TEAM_TONES.available;
  const hasJob = myStatus !== "available" && me?.reportId != null;

  // Same work order as the staff portal: report number ascending with the
  // finished (fixed) reports pinned to the bottom.
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

  const selected = queue.find((r) => r.id === selectedId) || null;

  // One report, one crew: if another team is already on this report (on site
  // or heading there), the assignment buttons lock with a note saying who.
  const holder =
    (selected && teams.find((t) => t.id !== team?.user?.id && t.reportId === selected.id && t.status !== "available")) ||
    null;

  const setAssignment = async (status) => {
    if (!selected) return;
    setActing(true);
    try {
      await api("/teams/status", {
        method: "POST",
        body: { status, reportId: selected.id },
        role: "team",
      });
      await loadTeams();
    } catch (err) {
      console.error("team status change failed:", err);
    } finally {
      setActing(false);
    }
  };

  const standDown = async () => {
    setActing(true);
    try {
      await api("/teams/status", { method: "POST", body: { status: "available" }, role: "team" });
      await loadTeams();
    } catch (err) {
      console.error("team status change failed:", err);
    } finally {
      setActing(false);
    }
  };

  const advance = async () => {
    if (!selected || !NEXT_STEP[selected.status]) return;
    // The final step is not a plain status change: it needs the repair photo,
    // so open the capture panel instead of PATCHing straight away.
    if (NEXT_STEP[selected.status].status === "fixed") {
      setProving(true);
      setProof(null);
      setProofError(null);
      return;
    }
    setActing(true);
    try {
      await api(`/reports/${selected.id}`, {
        method: "PATCH",
        body: { status: NEXT_STEP[selected.status].status, note: `${team?.user?.name || "Team"} moved the progress.` },
        role: "team",
      });
      await refresh();
      await loadStats();
    } catch (err) {
      console.error("status change failed:", err);
    } finally {
      setActing(false);
    }
  };

  const pickProof = (e) => {
    const file = e.target.files?.[0] || null;
    setProofError(null);
    setProof(file ? { file, preview: URL.createObjectURL(file) } : null);
  };

  const cancelProof = () => {
    if (proof?.preview) URL.revokeObjectURL(proof.preview);
    setProof(null);
    setProving(false);
  };

  const confirmFixed = async () => {
    if (!selected || !proof) return;
    setActing(true);
    setProofError(null);
    try {
      const form = new FormData();
      form.append("photo", proof.file, "repair.jpg");
      await api(`/reports/${selected.id}/complete`, { method: "POST", form, role: "team" });
      if (proof.preview) URL.revokeObjectURL(proof.preview);
      setProof(null);
      setProving(false);
      await refresh();
      await loadStats();
    } catch (err) {
      setProofError(err.message);
    } finally {
      setActing(false);
    }
  };

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
        <h1 className="text-lg font-extrabold">{team?.user?.name || "Team"} Portal</h1>
        <span className="w-10" aria-hidden="true" />
      </header>

      {/* Hamburger dropdown: account + log out */}
      {menuOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} aria-hidden="true" />
          <div className="absolute left-4 top-16 z-50 w-60 overflow-hidden rounded-2xl bg-white text-ink shadow-xl ring-1 ring-black/5">
            <div className="border-b border-line px-4 py-3">
              <p className="truncate text-sm font-bold">{team?.user?.name || "Field team"}</p>
              <p className="truncate text-xs text-muted">{team?.user?.email}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                signOut("team");
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
            onClick={() => {
              setTab(t);
              if (t !== "Reports") setSelectedId(null);
            }}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold transition-colors ${
              tab === t ? "bg-primary text-white shadow-md shadow-primary/40" : "bg-white/10 text-white/70"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Live assignment banner: where this crew is right now. The status
          itself opens the report they are working on; Stand down releases it. */}
      <div className="mt-3 px-4">
        <div className="flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3">
          {hasJob ? (
            <button
              type="button"
              onClick={() => {
                setTab("Reports");
                setSelectedId(me.reportId);
              }}
              className="flex min-w-0 flex-1 items-center gap-3 text-left"
            >
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                style={{ background: tone.bg, color: tone.color }}
              >
                {myStatus === "onsite" ? <AlertIcon className="h-5 w-5" /> : <NavigationIcon className="h-5 w-5" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-extrabold">
                  {tone.label} · {me.reportRef}
                </span>
                <span className="block truncate text-xs text-white/60">
                  {me.area} · tap to open this report
                </span>
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 text-white/50" />
            </button>
          ) : (
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ background: tone.bg, color: tone.color }}>
                <CheckCircleIcon className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-extrabold">Available</span>
                <span className="block truncate text-xs text-white/60">Ready for the next job</span>
              </span>
            </div>
          )}
          {myStatus !== "available" && (
            <button
              type="button"
              disabled={acting}
              onClick={standDown}
              className="shrink-0 rounded-full bg-white/15 px-3 py-1.5 text-xs font-bold hover:bg-white/25 disabled:opacity-60"
            >
              Stand down
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 px-4 pb-8">
        {tab === "Overview" && (
          <>
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

            <div className="mt-4 rounded-3xl bg-white p-4">
              <div className="flex items-center gap-2">
                <TrendingIcon className="h-5 w-5 text-primary" />
                <h2 className="text-sm font-extrabold text-ink">Open work nearby</h2>
              </div>
              <ul className="mt-3 space-y-2.5">
                {(stats?.recent || []).map((r) => {
                  const s = STATUS[r.status] || STATUS.new;
                  return (
                    <li key={r.id} className="flex items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-500">
                        <AlertIcon className="h-5 w-5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-ink">
                          #{r.id} · {r.area}
                        </p>
                        <p className="truncate text-xs text-muted">
                          {r.priority} · {r.reportedAt}
                        </p>
                      </div>
                      <span
                        className="shrink-0 rounded-md px-2 py-1 text-[11px] font-bold"
                        style={{ background: s.bg, color: s.color }}
                      >
                        {s.label}
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

        {tab === "Reports" && !selected && (
          <ul className="mt-4 space-y-2.5">
            {queue.map((r) => {
              const status = STATUS[r.status] || STATUS.new;
              const sev = severityTone(r.severityNote);
              const workingHere = me?.reportId === r.id && myStatus !== "available";
              return (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(r.id)}
                    className="flex w-full items-center gap-3 rounded-2xl bg-white p-3 text-left"
                  >
                    <span
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                      style={{ background: sev.bg, color: sev.color }}
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
                    {workingHere ? (
                      <span
                        className="shrink-0 rounded-md px-2 py-1 text-[11px] font-bold"
                        style={{ background: tone.bg, color: tone.color }}
                      >
                        {tone.label}
                      </span>
                    ) : (
                      <span
                        className="shrink-0 rounded-md px-2 py-1 text-[11px] font-bold"
                        style={{ background: status.bg, color: status.color }}
                      >
                        {status.label}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
            {queue.length === 0 && (
              <p className="mt-6 text-center text-sm font-semibold text-white/60">No reports in the queue.</p>
            )}
          </ul>
        )}

        {tab === "Reports" && selected && (
          <div className="mt-4 rounded-3xl bg-white p-4 text-ink">
            <button
              type="button"
              onClick={() => setSelectedId(null)}
              className="flex items-center gap-1 text-xs font-bold text-primary"
            >
              <ChevronLeft className="h-4 w-4" /> All reports
            </button>

            <div className="mt-3 flex items-center justify-between">
              <h2 className="text-lg font-extrabold">
                #{selected.id} · {selected.area}
              </h2>
              <span
                className="rounded-full px-2.5 py-1 text-[11px] font-bold"
                style={{
                  background: (STATUS[selected.status] || STATUS.new).bg,
                  color: (STATUS[selected.status] || STATUS.new).color,
                }}
              >
                {(STATUS[selected.status] || STATUS.new).label}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-muted">
              {selected.priority} · {selected.severityNote} severity · {selected.traffic} traffic · reported{" "}
              {selected.reportedAt}
            </p>
            <p className="mt-1 text-xs text-muted">{selected.address}</p>

            {/* Assignment: where is this crew right now? */}
            <div className="mt-4 rounded-2xl bg-canvas p-3">
              <p className="text-xs font-extrabold uppercase tracking-wide text-muted">This crew</p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={acting || !!holder}
                  onClick={() => setAssignment("onsite")}
                  className={`rounded-xl px-3 py-2.5 text-sm font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                    myStatus === "onsite" && me?.reportId === selected.id
                      ? "bg-primary text-white"
                      : "bg-white border border-line text-ink hover:border-primary"
                  }`}
                >
                  On site
                </button>
                <button
                  type="button"
                  disabled={acting || !!holder}
                  onClick={() => setAssignment("dispatched")}
                  className={`rounded-xl px-3 py-2.5 text-sm font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                    myStatus === "dispatched" && me?.reportId === selected.id
                      ? "bg-amber-500 text-white"
                      : "bg-white border border-line text-ink hover:border-amber-400"
                  }`}
                >
                  Dispatched
                </button>
              </div>
              <p className="mt-2 text-[11px] text-muted">
                {holder
                  ? `This report is already assigned to ${holder.name}. Only one crew can work a report at a time.`
                  : myStatus === "available"
                    ? "You are available. Choose On site or Dispatched to tell the office where you are."
                    : myStatus === "onsite" && me?.reportId === selected.id
                      ? "Your crew is on site at this report."
                      : myStatus === "dispatched" && me?.reportId === selected.id
                        ? "Your crew is heading to this report."
                        : `Your crew is currently ${tone.label.toLowerCase()}${
                            me?.reportRef ? ` at ${me.reportRef}` : ""
                          }. Picking here moves you to this report.`}
              </p>
            </div>

            {/* Progress: only the crew standing on this report can move it */}
            <div className="mt-4 rounded-2xl bg-navy p-3 text-white">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold">Progress</h3>
                <span className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide">
                  {selected.priority}
                </span>
              </div>
              {NEXT_STEP[selected.status] ? (
                <>
                  <button
                    type="button"
                    disabled={acting || !(myStatus === "onsite" && me?.reportId === selected.id)}
                    onClick={advance}
                    className="mt-3 w-full rounded-2xl bg-primary py-3 text-sm font-bold text-white transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {acting ? "Saving..." : `Advance: ${NEXT_STEP[selected.status].label}`}
                  </button>
                  {!(myStatus === "onsite" && me?.reportId === selected.id) && (
                    <p className="mt-2 text-center text-[11px] text-white/60">
                      Mark your crew On site at this report to move the progress.
                    </p>
                  )}
                  {/* Proof of repair: one photo closes the job and the
                      residents see it on their report. */}
                  {proving && (
                    <div className="mt-3 rounded-2xl bg-white p-3 text-ink">
                      <p className="text-xs font-extrabold uppercase tracking-wide text-muted">Proof of repair</p>
                      <p className="mt-1 text-xs text-muted">
                        Take a photo of the finished work. Residents see it on the report.
                      </p>
                      <input
                        ref={fileRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={pickProof}
                      />
                      {proof ? (
                        <div className="mt-2 flex items-center gap-3">
                          <img
                            src={proof.preview}
                            alt="Repair proof"
                            className="h-16 w-16 shrink-0 rounded-xl border border-line object-cover"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-bold">{proof.file.name}</p>
                            {proofError && <p className="mt-0.5 text-xs font-semibold text-red-600">{proofError}</p>}
                          </div>
                          <button
                            type="button"
                            disabled={acting}
                            onClick={confirmFixed}
                            className="shrink-0 rounded-xl bg-primary px-3 py-2 text-xs font-bold text-white hover:bg-primary-dark disabled:opacity-60"
                          >
                            {acting ? "Closing..." : "Confirm fixed"}
                          </button>
                          <button
                            type="button"
                            disabled={acting}
                            onClick={cancelProof}
                            className="shrink-0 rounded-xl border border-line px-3 py-2 text-xs font-bold text-slate-500 hover:border-slate-300 disabled:opacity-60"
                          >
                            Retake
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => fileRef.current?.click()}
                          className="mt-2 w-full rounded-xl border border-dashed border-slate-300 py-3 text-xs font-bold text-slate-500 hover:border-primary hover:text-primary"
                        >
                          Take or choose the repair photo
                        </button>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <p className="mt-3 rounded-2xl bg-white/10 px-3 py-2.5 text-center text-sm font-semibold text-white/70">
                  Repair complete. This report is closed.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default TeamDashboard;
