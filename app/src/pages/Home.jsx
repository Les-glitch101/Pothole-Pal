import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import NavBar from "../components/navbar";
import LeafletMap from "../components/LeafletMap";
import { SearchIcon, BellIcon, MapPinIcon, PlusIcon } from "../lib/icons";
import { STATUS } from "../lib/data";
import { useFlow } from "../context/flow";
import { api } from "../lib/api";

function Home() {
  const [query, setQuery] = useState("");
  const [stats, setStats] = useState(null);
  const navigate = useNavigate();
  const { reports } = useFlow();

  useEffect(() => {
    api("/stats")
      .then(setStats)
      .catch(() => setStats(null));
  }, []);

  const all = reports;
  const q = query.trim().toLowerCase();
  const filtered = q ? all.filter((r) => r.area.toLowerCase().includes(q)) : all;

  const markers = filtered.map((r) => ({
    id: r.id,
    lat: r.lat,
    lng: r.lng,
    color: (STATUS[r.status] || STATUS.new).color,
  }));

  const nearby = stats?.nearby ?? 0;
  const total = stats?.total ?? 0;
  const fixedCount = stats?.fixed ?? 0;

  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* Brand header */}
      <header className="flex items-center justify-between px-4 pt-4">
        <div className="flex items-center gap-2">
          <img src="/logo-96.png" alt="" className="h-10 w-10 object-contain" />
          <h1 className="text-2xl font-extrabold tracking-tight">PotholePal</h1>
        </div>
        <button
          type="button"
          aria-label="Notifications"
          onClick={() => navigate("/notifications")}
          className="relative flex h-10 w-10 items-center justify-center rounded-full text-ink hover:bg-slate-100"
        >
          <BellIcon className="h-6 w-6" />
          <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full border-2 border-white bg-red-500" />
        </button>
      </header>

      {/* Location pill */}
      <div className="mx-4 mt-3 flex w-fit items-center gap-1 text-sm font-semibold text-ink">
        <MapPinIcon className="h-4 w-4 text-primary" />
        Emfuleni District
      </div>

      {/* Search */}
      <div className="mx-4 mt-3 flex items-center gap-2">
        <form
          className="flex flex-1 items-center gap-2 rounded-2xl border border-line bg-white px-3 py-2.5 shadow-sm"
          onSubmit={(e) => e.preventDefault()}
        >
          <SearchIcon className="h-5 w-5 shrink-0 text-muted" />
          <input
            type="text"
            placeholder="Search street, area, or city..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
          />
        </form>
      </div>

      {/* Map */}
      <div className="mx-4 mt-4 h-[380px] overflow-hidden rounded-3xl border border-line shadow-sm">
        <LeafletMap
          markers={markers}
          className="h-full"
          zoom={13}
          onMarkerSelect={(m) => navigate(`/report-details/${m.id}`)}
        />
      </div>

      {/* Report CTA */}
      <Link to="/report1" className="mx-4 mt-4 block">
        <button className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-[15px] font-bold text-white shadow-lg shadow-primary/25 transition-colors hover:bg-primary-dark">
          <PlusIcon className="h-5 w-5" strokeWidth={2.6} />
          Report a Pothole
        </button>
      </Link>

      {/* Stats */}
      <div className="mt-5 grid grid-cols-3 px-2 pb-28">
        <div className="flex flex-col items-center">
          <h2 className="text-2xl font-extrabold">{nearby}</h2>
          <p className="text-xs font-medium text-muted">Reports nearby</p>
        </div>
        <div className="flex flex-col items-center border-x border-line">
          <h2 className="text-2xl font-extrabold">{total}</h2>
          <p className="text-xs font-medium text-muted">Total reports</p>
        </div>
        <div className="flex flex-col items-center">
          <h2 className="text-2xl font-extrabold">{fixedCount}</h2>
          <p className="text-xs font-medium text-muted">Fixed</p>
        </div>
      </div>

      <NavBar />
    </div>
  );
}

export default Home;
