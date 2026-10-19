import { Link, useLocation } from "react-router-dom";
import { HomeIcon, MapIcon, ClipboardIcon, BellIcon, UserIcon } from "../lib/icons";

const TABS = [
  { to: "/", label: "Home", Icon: HomeIcon, match: (p) => p === "/" },
  { to: "/map", label: "Map", Icon: MapIcon, match: (p) => p === "/map" },
  { to: "/reports", label: "Reports", Icon: ClipboardIcon, match: (p) => p === "/reports" },
  { to: "/notifications", label: "Notifications", Icon: BellIcon, match: (p) => p === "/notifications" },
  { to: "/profile", label: "Profile", Icon: UserIcon, match: (p) => p === "/profile" },
];

function NavBar() {
  const { pathname } = useLocation();

  return (
    <nav className="fixed bottom-0 left-1/2 z-[1000] w-full max-w-[430px] -translate-x-1/2 border-t border-line bg-white">
      <ul className="flex items-stretch justify-around px-1 py-1.5">
        {TABS.map(({ to, label, Icon, match }) => {
          const active = match(pathname);
          return (
            <li key={to} className="flex-1">
              <Link
                to={to}
                className={`flex flex-col items-center gap-0.5 rounded-lg py-1 transition-colors ${
                  active ? "text-primary" : "text-slate-400 hover:text-slate-600"
                }`}
              >
                <Icon className="h-6 w-6" strokeWidth={active ? 2.4 : 1.8} />
                <span className={`text-[11px] ${active ? "font-bold" : "font-medium"}`}>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export default NavBar;
