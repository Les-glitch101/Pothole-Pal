import { useState } from "react";
import { Link } from "react-router-dom";
import NavBar from "../components/navbar";
import LeafletMap from "../components/LeafletMap";
import { SearchIcon, SlidersIcon, ChevronRight } from "../lib/icons";
import { SEED_REPORTS, FILTERS, STATUS } from "../lib/data";
import { useFlow } from "../context/flow";

function severityChip(note) {
  if (note === "Severe" || note === "High") return { bg: "#fee2e2", color: "#dc2626" };
  if (note === "Medium") return { bg: "#fef3c7", color: "#d97706" };
  return { bg: "#dcfce7", color: "#16a34a" };
}

function MapScreen() {
  const [filter, setFilter] = useState("All");
  const [query, setQuery] = useState("");
  const { myReports } = useFlow();

  const all = [...myReports, ...SEED_REPORTS];
  const q = query.trim().toLowerCase();
  const byQuery = q ? all.filter((r) => r.area.toLowerCase().includes(q)) : all;
  const list = filter === "All" ? byQuery : byQuery.filter((r) => STATUS[r.status].label === filter);

  const markers = list.map((r) => ({ lat: r.lat, lng: r.lng, color: STATUS[r.status].color }));
  const featured = list[0];
  const chip = featured ? severityChip(featured.severityNote) : null;

  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* Title */}
      <header className="flex items-center justify-between px-4 pt-4">
        <h1 className="text-2xl font-extrabold">Map</h1>
        <button
          type="button"
          aria-label="Filters"
          className="flex h-10 w-10 items-center justify-center rounded-full text-ink hover:bg-slate-100"
        >
          <SlidersIcon className="h-5 w-5" />
        </button>
      </header>

      {/* Search */}
      <div className="mx-4 mt-3 flex items-center gap-2 rounded-2xl border border-line bg-white px-3 py-2.5 shadow-sm">
        <SearchIcon className="h-5 w-5 shrink-0 text-muted" />
        <input
          type="text"
          placeholder="Search street, area, or city..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
        />
      </div>

      {/* Filter chips */}
      <div className="mt-3 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              filter === f ? "bg-primary text-white shadow-md shadow-primary/30" : "bg-slate-100 text-slate-500"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Map + featured card */}
      <div className="relative mx-4 mt-3 h-[440px] overflow-hidden rounded-3xl border border-line shadow-sm">
        <LeafletMap markers={markers} className="h-full" zoom={14} />

        {featured ? (
          <Link
            to={`/report-details/${featured.id}`}
            className="absolute inset-x-3 bottom-3 z-[600] flex items-center gap-3 rounded-2xl bg-white p-3 shadow-xl ring-1 ring-slate-100"
          >
            <img src={featured.photo} alt="" className="h-14 w-14 shrink-0 rounded-xl object-cover" />
            <div className="min-w-0 flex-1 text-left">
              <p className="truncate text-[15px] font-bold">{featured.area}</p>
              <p className="truncate text-xs text-muted">Reported {featured.reportedAt}</p>
            </div>
            <span
              className="shrink-0 rounded-md px-2 py-1 text-xs font-bold"
              style={{ background: chip.bg, color: chip.color }}
            >
              {featured.severityNote}
            </span>
            <ChevronRight className="h-5 w-5 shrink-0 text-muted" />
          </Link>
        ) : (
          <div className="absolute inset-x-3 bottom-3 z-[600] rounded-2xl bg-white p-4 text-center text-sm font-semibold text-muted shadow-xl ring-1 ring-slate-100">
            No reports match this filter
          </div>
        )}
      </div>

      <div className="pb-28" />
      <NavBar />
    </div>
  );
}

export default MapScreen;
