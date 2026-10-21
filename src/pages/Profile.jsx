import { useNavigate } from "react-router-dom";
import NavBar from "../components/navbar";
import { ChevronRight, ClipboardIcon, TrophyIcon, UserIcon, ShieldIcon } from "../lib/icons";
import { useFlow } from "../context/flow";

const BADGES = [
  { label: "First Report", color: "#1d5beb", Icon: ClipboardIcon },
  { label: "Road Warrior", color: "#ea580c", Icon: ShieldIcon },
  { label: "Community Hero", color: "#16a34a", Icon: UserIcon },
  { label: "Top Reporter", color: "#eab308", Icon: TrophyIcon },
];

// Every row must lead somewhere: dead entries were removed on review.
const MENU = [{ label: "My Reports", Icon: ClipboardIcon, to: "/reports" }];

function Profile() {
  const navigate = useNavigate();
  const { myReports, resident, signOut } = useFlow();

  const name = resident?.user?.name || "Resident";
  const points = resident?.user?.points ?? 0;
  const level = resident?.user?.level ?? 1;
  const reports = myReports.length;
  const fixedCount = myReports.filter((r) => r.status === "fixed").length;

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
        <p className="text-sm font-bold text-primary">Road Guardian</p>
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

      <button
        type="button"
        onClick={() => {
          signOut("resident");
          navigate("/login");
        }}
        className="mx-4 mt-3 flex items-center justify-center gap-2 rounded-2xl border border-line py-3 text-sm font-bold text-red-600 transition-colors hover:bg-red-50"
      >
        Sign out
      </button>

      <div className="pb-8" />
      <NavBar />
    </div>
  );
}

export default Profile;
