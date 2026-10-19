import { useNavigate } from "react-router-dom";
import NavBar from "../components/navbar";
import { ChevronLeft, SettingsIcon, CheckCircleIcon, WrenchIcon, AwardIcon, MessageIcon, AlertIcon } from "../lib/icons";
import { NOTIFICATIONS } from "../lib/data";

const ICONS = {
  check: CheckCircleIcon,
  wrench: WrenchIcon,
  award: AwardIcon,
  message: MessageIcon,
  alert: AlertIcon,
};

function Notifications() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* Header */}
      <header className="relative flex h-14 items-center px-3">
        <button
          type="button"
          aria-label="Go back"
          onClick={() => navigate("/")}
          className="flex h-10 w-10 items-center justify-center rounded-full text-ink hover:bg-slate-100"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
        <h1 className="absolute left-1/2 -translate-x-1/2 text-lg font-bold">Notifications</h1>
        <button
          type="button"
          aria-label="Settings"
          className="ml-auto flex h-10 w-10 items-center justify-center rounded-full text-ink hover:bg-slate-100"
        >
          <SettingsIcon className="h-5 w-5" />
        </button>
      </header>

      <div className="flex-1 px-4 pb-28">
        {NOTIFICATIONS.map((group) => (
          <section key={group.group}>
            <h2 className="mb-2 mt-4 text-[15px] font-extrabold">{group.group}</h2>
            <ul className="space-y-2.5">
              {group.items.map((n) => {
                const Icon = ICONS[n.icon] || CheckCircleIcon;
                return (
                  <li
                    key={n.id}
                    className="flex items-start gap-3 rounded-2xl border border-line bg-white p-3.5 shadow-sm"
                  >
                    <span
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                      style={{ background: `${n.tone}1a`, color: n.tone }}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-bold">{n.title}</p>
                      <p className="mt-0.5 text-xs leading-relaxed text-muted">{n.body}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>

      <NavBar />
    </div>
  );
}

export default Notifications;
