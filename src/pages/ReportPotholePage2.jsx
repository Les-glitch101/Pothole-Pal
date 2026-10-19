import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import FlowHeader from "../components/FlowHeader";
import LeafletMap from "../components/LeafletMap";
import { SearchIcon, LocateIcon, LayersIcon, MapPinIcon, PencilIcon } from "../lib/icons";
import { SEED_REPORTS } from "../lib/data";
import { useFlow } from "../context/flow";

function nearestArea(lat, lng) {
  let best = null;
  let bestDist = Infinity;
  for (const r of SEED_REPORTS) {
    const d = (r.lat - lat) ** 2 + (r.lng - lng) ** 2;
    if (d < bestDist) {
      bestDist = d;
      best = r;
    }
  }
  return best ? best.area : "Vereeniging";
}

function ReportPotholePage2() {
  const navigate = useNavigate();
  const { draft, setDraft } = useFlow();
  const [pinned, setPinned] = useState({ lat: draft.lat, lng: draft.lng });
  const [address, setAddress] = useState(draft.address);
  const [search, setSearch] = useState("");
  const searchRef = useMemo(() => ({ current: null }), []);

  const onPinMove = (ll) => {
    setPinned({ lat: ll.lat, lng: ll.lng });
    setAddress(`${nearestArea(ll.lat, ll.lng)}, Gauteng, South Africa`);
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => onPinMove({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {
        /* permission denied or unavailable — keep current pin */
      },
      { timeout: 5000 },
    );
  };

  const confirm = () => {
    const value = search.trim() || address;
    setDraft({ lat: pinned.lat, lng: pinned.lng, address: value });
    navigate("/report3");
  };

  return (
    <div className="flex min-h-screen flex-col bg-white pb-8">
      <FlowHeader step={2} onBack={() => navigate("/report1")} />

      <div className="mt-5 px-5">
        <h2 className="text-lg font-extrabold">Where is the pothole?</h2>
        <p className="mt-1 text-sm text-muted">
          Drag the pin to the exact location or search for an address.
        </p>

        {/* Address search */}
        <div className="mt-4 flex items-center gap-2 rounded-2xl border border-line bg-white px-3 py-2.5 shadow-sm">
          <SearchIcon className="h-5 w-5 shrink-0 text-muted" />
          <input
            ref={searchRef}
            type="text"
            placeholder="Search for an address"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Map with draggable pin */}
      <div className="relative mx-4 mt-4 h-72 overflow-hidden rounded-3xl border border-line shadow-sm">
        <LeafletMap
          dragPin
          onPinMove={onPinMove}
          center={[pinned.lat, pinned.lng]}
          zoom={15}
          className="h-full"
        />

        {/* Map controls */}
        <div className="absolute right-3 top-3 z-[600] flex flex-col gap-2">
          <button
            type="button"
            aria-label="Use my location"
            onClick={useMyLocation}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-ink shadow-md ring-1 ring-slate-200 transition-colors hover:text-primary"
          >
            <LocateIcon className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label="Map layers"
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-ink shadow-md ring-1 ring-slate-200 transition-colors hover:text-primary"
          >
            <LayersIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Address card */}
      <div className="mx-4 mt-4 flex items-center gap-3 rounded-2xl border border-line bg-white p-3.5 shadow-sm">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
          <MapPinIcon className="h-6 w-6" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-muted">Pothole location</p>
          <p className="truncate text-[15px] font-bold">{search.trim() || address}</p>
        </div>
        <button
          type="button"
          aria-label="Edit address"
          onClick={() => searchRef.current?.focus()}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-primary hover:bg-primary-soft"
        >
          <PencilIcon className="h-4 w-4" />
        </button>
      </div>

      {/* Confirm */}
      <div className="mt-5 px-5">
        <button
          type="button"
          onClick={confirm}
          className="w-full rounded-2xl bg-primary py-3.5 text-[15px] font-bold text-white shadow-lg shadow-primary/25 transition-colors hover:bg-primary-dark"
        >
          Confirm Location
        </button>
      </div>
    </div>
  );
}

export default ReportPotholePage2;
