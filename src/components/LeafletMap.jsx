import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

/**
 * Leaflet map used by Home, Map, the location step and the dashboard.
 *
 * - markers: [{ id?, lat, lng, color, label?, cluster? }] → styled dot pins;
 *   when onMarkerSelect is given, clicking a dot calls it with the marker
 * - dragPin: single draggable primary pin (report flow step 2), calls onPinMove(latlng)
 * - heat: [{ lat, lng, weight }] → soft red blobs (dashboard heatmap)
 */
function LeafletMap({
  markers = [],
  heat = [],
  dragPin = false,
  onPinMove,
  onMarkerSelect,
  center = [-26.6736, 27.9319],
  zoom = 14,
  className = "h-80",
  onMapClick,
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const layerRef = useRef(null);
  const pinRef = useRef(null);
  // Bumped whenever the map instance is (re)created so marker sync re-runs
  // even under StrictMode's mount→cleanup→mount double-invocation.
  const [mapVersion, setMapVersion] = useState(0);

  // Create map once.
  useEffect(() => {
    const map = L.map(containerRef.current, {
      center,
      zoom,
      zoomControl: false,
      attributionControl: true,
      scrollWheelZoom: true,
    });
    mapRef.current = map;

    // Carto's basemaps now require an API key (renders a "KEY REQUIRED" watermark),
    // so use Esri's light-gray canvas — same look, no key needed.
    L.tileLayer(
      "https://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}",
      {
        maxZoom: 16,
        attribution: "&copy; Esri, HERE, Garmin, OpenStreetMap contributors",
      },
    ).addTo(map);

    map.attributionControl.setPrefix(false);

    layerRef.current = L.layerGroup().addTo(map);
    setMapVersion((v) => v + 1);

    if (onMapClick) map.on("click", (e) => onMapClick(e.latlng));

    return () => {
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
      pinRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Marker / cluster / heat updates.
  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer) return;
    layer.clearLayers();

    const bounds = [];

    for (const m of markers) {
      bounds.push([m.lat, m.lng]);
      const icon = L.divIcon({
        className: "",
        html: `<div class="${m.cluster ? "pp-cluster" : "pp-marker"}" style="${
          m.cluster ? "" : `background:${m.color || "#1d5beb"}`
        }">${m.label || ""}</div>`,
        iconSize: m.cluster ? [34, 34] : [26, 26],
        iconAnchor: m.cluster ? [17, 17] : [13, 13],
      });
      const marker = L.marker([m.lat, m.lng], { icon, keyboard: false }).addTo(layer);
      if (onMarkerSelect && m.id != null) {
        marker.on("click", () => onMarkerSelect(m));
      }
    }

    for (const h of heat) {
      bounds.push([h.lat, h.lng]);
      L.circleMarker([h.lat, h.lng], {
        radius: h.weight || 14,
        color: "#ef4444",
        weight: 1,
        fillColor: "#ef4444",
        fillOpacity: 0.28,
      }).addTo(layer);
    }

    if (bounds.length > 1) {
      map.invalidateSize({ pan: false });
      map.fitBounds(L.latLngBounds(bounds), { padding: [40, 40], maxZoom: 15 });
    } else if (bounds.length === 1) {
      map.setView(bounds[0], zoom);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(markers), JSON.stringify(heat), mapVersion]);

  // Keep an existing pin in step with the center prop (geolocation moves,
  // map taps) without recreating it. Pans only when the new point falls
  // outside the view, so tapping inside the map never jumps the camera.
  useEffect(() => {
    if (!dragPin) return;
    const map = mapRef.current;
    const pin = pinRef.current;
    if (!map || !pin) return;
    const target = L.latLng(center);
    if (!pin.getLatLng().equals(target)) pin.setLatLng(target);
    if (!map.getBounds().contains(target)) {
      map.setView(target, Math.max(map.getZoom(), 15));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dragPin, mapVersion, center.lat, center.lng]);

  // Draggable pin.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !dragPin) return;

    const pinHtml = `<svg class="pp-pin" width="34" height="34" viewBox="0 0 24 24" fill="currentColor" stroke="#fff" stroke-width="1.4">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/>
      <circle cx="12" cy="10" r="3" fill="#fff" stroke="none"/>
    </svg>`;

    const pin = L.marker(center, {
      icon: L.divIcon({ className: "", html: pinHtml, iconSize: [34, 34], iconAnchor: [17, 32] }),
      draggable: true,
      keyboard: false,
    }).addTo(map);

    pin.on("dragend", () => {
      const ll = pin.getLatLng();
      if (onPinMove) onPinMove(ll);
    });
    pinRef.current = pin;

    return () => {
      map.removeLayer(pin);
      pinRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dragPin, mapVersion]);

  return <div ref={containerRef} className={className} />;
}

export default LeafletMap;
