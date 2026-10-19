import { useNavigate } from "react-router-dom";
import NavBar from "../components/navbar";
import {
  SettingsIcon,
  ChevronRight,
  ClipboardIcon,
  TrendingIcon,
  TrophyIcon,
  HelpIcon,
  UserIcon,
  ShieldIcon,
} from "../lib/icons";
import { useFlow } from "../context/flow";

const BADGES = [
  { label: "First Report", color: "#1d5beb", Icon: ClipboardIcon },
  { label: "Road Warrior", color: "#ea580c", Icon: ShieldIcon },
  { label: "Community Hero", color: "#16a34a", Icon: UserIcon },
  { label: "Top Reporter", color: "#eab308", Icon: TrophyIcon },
];

const MENU = [
  { label: "My Reports", Icon: ClipboardIcon, to: "/reports" },
  { label: "My Impact", Icon: TrendingIcon, to: null },
  { label: "Leaderboard", Icon: TrophyIcon, to: null },
  { label: "Settings", Icon: SettingsIcon, to: null },
  { label: "Help & Support", Icon: HelpIcon, to: null },
];

function Profile() {
  const navigate = useNavigate();
  const { myReports } = useFlow();

  const reports = 48 + myReports.length;

  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* Header */}
      <header className="flex items-center justify-between px-4 pt-4">
        <h1 className="text-2xl font-extrabold">Profile</h1>
        <button
          type="button"
          aria-label="Settings"
          className="flex h-10 w-10 items-center justify-center rounded-full text-ink hover:bg-slate-100"
        >
          <SettingsIcon className="h-5 w-5" />
        </button>
      </header>

      {/* Identity */}
      <div className="mt-4 flex flex-col items-center">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary-soft ring-4 ring-primary/15">
          <UserIcon className="h-12 w-12 text-primary" strokeWidth={1.6} />
        </div>
        <h2 className="mt-3 text-xl font-extrabold">Alex R.</h2>
        <p className="text-sm font-bold text-primary">Road Guardian</p>
        <span className="mt-2 rounded-full bg-primary-soft px-3 py-1 text-xs font-bold text-primary">
          Level 3
        </span>
      </div>

      {/* Stats */}
      <div className="mt-5 grid grid-cols-3 px-4">
        <div className="flex flex-col items-center">
          <p className="text-xl font-extrabold">1,250</p>
          <p className="text-xs text-muted">Points</p>
        </div>
        <div className="flex flex-col items-center border-x border-line">
          <p className="text-xl font-extrabold">{reports}</p>
          <p className="text-xs text-muted">Reports</p>
        </div>
        <div className="flex flex-col items-center">
          <p className="text-xl font-extrabold">12</p>
          <p className="text-xs text-muted">Issues Fixed</p>
        </div>
      </div>

      {/* Badges */}
      <div className="mt-6 grid grid-cols-4 gap-2 px-4">
        {BADGES.map(({ label, color, Icon }) => (
          <div key={label} className="flex flex-col items-center gap-1.5">
            <span
              className="flex h-14 w-14 items-center justify-center text-white"
              style={{
                background: color,
                clipPath: "polygon(25% 6.7%, 75% 6.7%, 100% 50%, 75% 93.3%, 25% 93.3%, 0% 50%)",
              }}
            >
              <Icon className="h-6 w-6" strokeWidth={2} />
            </span>
            <span className="text-center text-[11px] font-semibold leading-tight text-slate-600">
              {label}
            </span>
          </div>
        ))}
      </div>

      {/* Menu */}
      <div className="mx-4 mt-6 overflow-hidden rounded-3xl border border-line">
        {MENU.map(({ label, Icon, to }, i) => (
          <button
            key={label}
            type="button"
            onClick={() => to && navigate(to)}
            className={`flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-slate-50 ${
              i > 0 ? "border-t border-line" : ""
            }`}
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-soft text-primary">
              <Icon className="h-5 w-5" />
            </span>
            <span className="flex-1 text-[15px] font-semibold">{label}</span>
            <ChevronRight className="h-5 w-5 text-slate-400" />
          </button>
        ))}
      </div>

      {/* Demo entry to the municipality portal (separate persona, no auth yet) */}
      <button
        type="button"
        onClick={() => navigate("/dashboard")}
        className="mx-4 mt-3 flex items-center gap-3 rounded-2xl bg-navy px-4 py-3 text-left text-white transition-opacity hover:opacity-90"
      >
        <ShieldIcon className="h-5 w-5 text-white/80" />
        <span className="flex-1 text-sm font-bold">
          Municipality portal
          <span className="ml-2 rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide">
            demo
          </span>
        </span>
        <ChevronRight className="h-5 w-5 text-white/60" />
      </button>

      <div className="pb-8" />
      <NavBar />
    </div>
  );
}

export default Profile;
