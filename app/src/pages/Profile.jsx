import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import NavBar from "../components/navbar";
import { ClipboardIcon, TrophyIcon, UserIcon, ShieldIcon } from "../lib/icons";
import { useFlow } from "../context/flow";
import { api } from "../lib/api";

// Artwork for the four badge keys the server scores (see server/lib/domain.js
// BADGES). Earned or locked is decided by the API, never by this file.
const BADGE_ART = [
  { key: "first_report", color: "#1d5beb", Icon: ClipboardIcon },
  { key: "veteran", color: "#ea580c", Icon: ShieldIcon },
  { key: "community_hero", color: "#16a34a", Icon: UserIcon },
  { key: "top_reporter", color: "#eab308", Icon: TrophyIcon },
];

function Profile() {
  const navigate = useNavigate();
  const { myReports, resident, signOut } = useFlow();
  const [me, setMe] = useState(null);
  const [board, setBoard] = useState(null);

  useEffect(() => {
    let alive = true;
    // Both calls are cheap and independent; a failed leaderboard load still
    // leaves the profile itself usable.
    api("/auth/me")
      .then((data) => alive && setMe(data))
      .catch(() => {});
    api("/leaderboard")
      .then((data) => alive && setBoard(data))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const name = me?.name || resident?.user?.name || "Resident";
  const points = me?.stats?.points ?? resident?.user?.points ?? 0;
  const level = me?.rank?.level ?? resident?.user?.level ?? 1;
  const title = me?.rank?.title || "Newcomer";
  const reports = me?.stats?.reports ?? myReports.length;
  const fixedCount = me?.stats?.fixed ?? myReports.filter((r) => r.status === "fixed").length;
  const badges = me?.badges || [];

  const nextBadge = badges.find((b) => !b.earned);
  const boardTop = board?.top || [];
  const myPosition = board?.me?.position;
  const myTotal = board?.me?.total;
  const iAmOnBoard = boardTop.some((r) => r.id === resident?.user?.id);

  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* Header */}
      <header className="flex items-center px-4 pt-4">
        <h1 className="text-2xl font-extrabold">Profile</h1>
      </header>

      {/* Identity */}
      <div className="mt-4 flex flex-col items-center">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary-soft ring-4 ring-primary/15">
          <UserIcon className="h-12 w-12 text-primary" strokeWidth={1.6} />
        </div>
        <h2 className="mt-3 text-xl font-extrabold">{name}</h2>
        <p className="text-sm font-bold text-primary">{title}</p>
        <span className="mt-2 rounded-full bg-primary-soft px-3 py-1 text-xs font-bold text-primary">
          Level {level}
        </span>
      </div>

      {/* Stats */}
      <div className="mt-5 grid grid-cols-3 px-4">
        <div className="flex flex-col items-center">
          <p className="text-xl font-extrabold">{points.toLocaleString()}</p>
          <p className="text-xs text-muted">Points</p>
        </div>
        <div className="flex flex-col items-center border-x border-line">
          <p className="text-xl font-extrabold">{reports}</p>
          <p className="text-xs text-muted">Reports</p>
        </div>
        <div className="flex flex-col items-center">
          <p className="text-xl font-extrabold">{fixedCount}</p>
          <p className="text-xs text-muted">Issues Fixed</p>
        </div>
      </div>

      {/* Badges: earned in colour, still locked in grey */}
      <div className="mt-6 grid grid-cols-4 gap-2 px-4">
        {BADGE_ART.map(({ key, color, Icon }) => {
          const badge = badges.find((b) => b.key === key);
          const earned = !!badge?.earned;
          return (
            <div key={key} className="flex flex-col items-center gap-1.5">
              <span
                className={`flex h-14 w-14 items-center justify-center text-white transition-opacity ${
                  earned ? "" : "opacity-35 grayscale"
                }`}
                style={{
                  background: earned ? color : "#94a3b8",
                  clipPath: "polygon(25% 6.7%, 75% 6.7%, 100% 50%, 75% 93.3%, 25% 93.3%, 0% 50%)",
                }}
                title={earned ? badge?.label : `Locked: ${badge?.hint || "not earned yet"}`}
              >
                <Icon className="h-6 w-6" strokeWidth={2} />
              </span>
              <span
                className={`text-center text-[11px] font-semibold leading-tight ${
                  earned ? "text-slate-600" : "text-slate-400"
                }`}
              >
                {badge?.label || key}
              </span>
            </div>
          );
        })}
      </div>
      <p className="mt-2 px-4 text-center text-xs text-muted">
        {badges.length === 0
          ? "Loading badges..."
          : nextBadge
            ? `Next badge: ${nextBadge.label} — ${nextBadge.hint}`
            : "All badges earned. Nice work."}
      </p>

      {/* Leaderboard */}
      <div className="mx-4 mt-6 rounded-3xl border border-line p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-[15px] font-extrabold">Top reporters</h3>
          <span className="text-xs font-bold text-muted">
            {myPosition ? `You: #${myPosition} of ${myTotal}` : ""}
          </span>
        </div>
        <ul className="mt-3 space-y-2">
          {boardTop.map((r) => {
            const isMe = r.id === resident?.user?.id;
            return (
              <li
                key={r.id}
                className={`flex items-center gap-3 rounded-2xl px-2.5 py-2 ${
                  isMe ? "bg-primary-soft" : ""
                }`}
              >
                <span
                  className={`w-6 shrink-0 text-center text-sm font-extrabold ${
                    r.position <= 3 ? "text-amber-500" : "text-slate-400"
                  }`}
                >
                  {r.position}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-ink">
                    {r.name}
                    {isMe ? " (you)" : ""}
                  </p>
                  <p className="truncate text-xs text-muted">
                    {r.title} · {r.reports} report{r.reports === 1 ? "" : "s"} · {r.fixed} fixed
                  </p>
                </div>
                <span className="shrink-0 text-sm font-extrabold text-primary">
                  {r.points.toLocaleString()}
                </span>
              </li>
            );
          })}
          {!board && <p className="text-xs font-semibold text-muted">Loading the board...</p>}
          {board && boardTop.length === 0 && (
            <p className="text-xs font-semibold text-muted">No residents yet.</p>
          )}
        </ul>
        {board && !iAmOnBoard && myPosition && (
          <p className="mt-2 text-center text-xs text-muted">
            You are #{myPosition} of {myTotal}. Keep reporting to climb.
          </p>
        )}
      </div>

      {/* Sign out — the only profile-level action left; report history
          lives in the Reports tab, so no menu row is needed here. */}
      <button
        type="button"
        onClick={() => {
          signOut("resident");
          navigate("/login");
        }}
        className="mx-4 mt-6 flex items-center justify-center gap-2 rounded-2xl border border-line py-3 text-sm font-bold text-red-600 transition-colors hover:bg-red-50"
      >
        Sign out
      </button>

      {/* Clear the fixed bottom nav: this page scrolls, so a short spacer
          would leave Sign out underneath the bar. */}
      <div className="pb-28" />
      <NavBar />
    </div>
  );
}

export default Profile;
