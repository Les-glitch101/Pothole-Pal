import { useCallback, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import FlowHeader from "../components/FlowHeader";
import LeafletMap from "../components/LeafletMap";
import { MapPinIcon, LocateIcon } from "../lib/icons";
import { useFlow } from "../context/flow";
import { SEED_REPORTS } from "../lib/data";

/**
 * Step 2: pick where the pothole is.
 *
 * - A draggable pin on a real map (tap the map or drag the pin).
 * - "Use my current location" drops the pin on the device's GPS position.
 * - The address string is always derived from the pin: a nearest-area
 *   fallback instantly, replaced by Nominatim's reverse geocode when it
 *   answers, so the label can no longer disagree with the pin.
 * - The pin (or your location) must sit inside the Emfuleni District;
 *   outside it, a message appears and Confirm Location stays off.
 */

// Rough bounding box of the Emfuleni District (Vereeniging, Three Rivers,
// Duncanville, Arcon Park, Sonland Park, Peacehaven...).
const DISTRICT = { minLat: -26.76, maxLat: -26.55, minLng: 27.8, maxLng: 28.03 };

function isInsideDistrict(lat, lng) {
  return lat >= DISTRICT.minLat && lat <= DISTRICT.maxLat && lng >= DISTRICT.minLng && lng <= DISTRICT.maxLng;
}

// Offline fallback label: the seed area whose marker sits closest to the pin.
function nearestAreaName(lat, lng) {
  let best = null;
  let bestDist = Infinity;
  for (const r of SEED_REPORTS) {
    const dLat = (r.lat - lat) * 111;
    const dLng = (r.lng - lng) * 111 * Math.cos((lat * Math.PI) / 180);
    const d = dLat * dLat + dLng * dLng;
    if (d < bestDist) {
      bestDist = d;
      best = r;
    }
  }
  return best?.area || "Vereeniging";
}

function fallbackAddress(lat, lng) {
  if (!isInsideDistrict(lat, lng)) {
    return `Outside Emfuleni District (${lat.toFixed(5)}, ${lng.toFixed(5)})`;
  }
  return `${nearestAreaName(lat, lng)}, Emfuleni District, Gauteng`;
}

// Free OpenStreetMap reverse geocode; returns null when offline or on error.
async function reverseGeocode(lat, lng) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=18&addressdetails=1&lat=${lat}&lon=${lng}`,
      { headers: { "Accept-Language": "en" } },
    );
    if (!res.ok) throw new Error("geocode failed");
    const data = await res.json();
    const a = data.address || {};
    const parts = [
      a.road || a.pedestrian,
      a.suburb || a.neighbourhood || a.village || a.hamlet || a.locality,
      a.city || a.town || a.municipality || a.county,
      a.state,
    ].filter(Boolean);
    if (parts.length) return parts.join(", ");
    return data.display_name || null;
  } catch {
    return null;
  }
}

function ReportPotholePage2() {
  const navigate = useNavigate();
  const { draft, setDraft } = useFlow();

  const [pin, setPin] = useState({ lat: draft.lat, lng: draft.lng });
  const [address, setAddress] = useState(draft.address);
  const [looking, setLooking] = useState(false);
  const [locating, setLocating] = useState(false);
  const [geoMsg, setGeoMsg] = useState(null);

  const pinRef = useRef(pin);
  const timerRef = useRef(null);
  const requestRef = useRef(0);

  const moveTo = useCallback((lat, lng) => {
    pinRef.current = { lat, lng };
    setPin({ lat, lng });

    // Label immediately so it always matches the pin, then upgrade it with
    // the reverse geocode when (if) that answers.
    const fallback = fallbackAddress(lat, lng);
    setAddress(fallback);

    if (timerRef.current) clearTimeout(timerRef.current);
    const myRequest = ++requestRef.current;
    setLooking(true);
    timerRef.current = setTimeout(async () => {
      const real = await reverseGeocode(lat, lng);
      const stillCurrent = requestRef.current === myRequest;
      if (stillCurrent) {
        if (real && pinRef.current && pinRef.current.lat === lat && pinRef.current.lng === lng) {
          setAddress(real);
        }
        setLooking(false);
      }
    }, 450);
  }, []);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setGeoMsg("Location is not available in this browser. Drag the pin instead.");
      return;
    }
    setLocating(true);
    setGeoMsg(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        moveTo(pos.coords.latitude, pos.coords.longitude);
      },
      (err) => {
        setLocating(false);
        setGeoMsg(
          err?.code === 1
            ? "Location permission denied. Drag the pin to the pothole instead."
            : "Could not get your location. Drag the pin to the pothole instead.",
        );
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 },
    );
  }, [moveTo]);

  const outside = !isInsideDistrict(pin.lat, pin.lng);

  const confirm = () => {
    if (outside) return;
    setDraft({ lat: pin.lat, lng: pin.lng, address });
    navigate("/report3");
  };

  return (
    <div className="flex min-h-screen flex-col bg-white pb-8">
      <FlowHeader step={2} onBack={() => navigate("/report1")} />

      {/* District gate: appears as soon as the pin (or your location) is outside */}
      {outside && (
        <div
          role="alert"
          className="mx-5 mt-4 rounded-2xl border border-amber-300 bg-amber-50 p-3.5 shadow-sm"
        >
          <p className="text-sm font-extrabold text-amber-800">Outside Emfuleni District</p>
          <p className="mt-1 text-sm leading-relaxed text-amber-800/90">
            We don't deal with issues outside of the Emfuleni District. Move the pin inside the
            district to continue.
          </p>
        </div>
      )}

      <div className="mt-4 px-5">
        <h2 className="text-lg font-extrabold">Confirm the location</h2>
        <p className="mt-1 text-sm text-muted">Drag the map so the pin sits on the pothole.</p>
      </div>

      {/* Map with a draggable pin */}
      <div className="mx-5 mt-3 h-[340px] overflow-hidden rounded-3xl border border-line shadow-sm">
        <LeafletMap
          dragPin
          center={pin}
          zoom={15}
          className="h-full"
          onPinMove={(ll) => moveTo(ll.lat, ll.lng)}
          onMapClick={(ll) => moveTo(ll.lat, ll.lng)}
        />
      </div>

      {/* Address resolved from the pin */}
      <div className="mx-5 mt-3 flex items-start gap-2 rounded-2xl border border-line bg-white p-3.5 shadow-sm">
        <MapPinIcon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-muted">Location</p>
          <p className="break-words text-sm font-bold text-ink">{address}</p>
          {looking && <p className="mt-0.5 text-xs text-muted">Checking the address...</p>}
          {geoMsg && <p className="mt-0.5 text-xs font-semibold text-amber-600">{geoMsg}</p>}
        </div>
      </div>

      <div className="mt-3 space-y-3 px-5">
        <button
          type="button"
          onClick={requestLocation}
          disabled={locating}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-line bg-white py-3 text-sm font-bold text-ink transition-colors hover:bg-slate-50 disabled:opacity-60"
        >
          <LocateIcon className="h-4 w-4 text-primary" />
          {locating ? "Finding you..." : "Use my current location"}
        </button>

        <button
          type="button"
          onClick={confirm}
          disabled={outside}
          className="w-full rounded-2xl bg-primary py-3.5 text-[15px] font-bold text-white shadow-lg shadow-primary/25 transition-colors hover:bg-primary-dark disabled:opacity-50"
        >
          Confirm Location
        </button>
      </div>
    </div>
  );
}

export default ReportPotholePage2;
