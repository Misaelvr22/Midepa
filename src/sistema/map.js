// Mapa de zonas con Leaflet + OpenStreetMap (estilo claro de CARTO). Sin claves.
// Lejos: un marcador por ciudad. Cerca: zonas con precio, campus y la distancia entre ambos.
import { ZONES, ROOMS } from "./data.js";
import { selectZone, esc } from "./demo.js";

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const ZOOM_ZONAS = 11; // a partir de este zoom se ven las zonas en lugar de las ciudades

// Hacia dónde va la etiqueta de cada ciudad en la vista de todo México
const LABEL_SIDE = { "Ciudad de México": "left", Puebla: "bottom", Xalapa: "right" };
const LABEL_POS = {
  top: "bottom-4 left-1/2 -translate-x-1/2",
  bottom: "top-4 left-1/2 -translate-x-1/2",
  left: "right-4 top-1/2 -translate-y-1/2",
  right: "left-4 top-1/2 -translate-y-1/2",
};

const wrap = document.getElementById("demo-mapa-wrap");
const el = document.getElementById("demo-mapa");
const list = document.getElementById("demo-ciudades");
const toggles = document.querySelectorAll("[data-vista]");

const pesos = (n) => `$${Math.round(n).toLocaleString("es-MX")}`;
const roomsIn = (id) => ROOMS.filter((r) => r.zone === id);

// Distancia en línea recta (km) entre dos coordenadas
function km([lat1, lon1], [lat2, lon2]) {
  const R = 6371, rad = Math.PI / 180;
  const a = Math.sin(((lat2 - lat1) * rad) / 2) ** 2 + Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(((lon2 - lon1) * rad) / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

// ---------- Vista Mapa / Lista ----------
function setView(vista) {
  toggles.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.vista === vista)));
  wrap.hidden = vista !== "mapa";
  list.hidden = vista !== "lista";
  if (vista === "mapa") map ? map.invalidateSize() : init();
}
toggles.forEach((b) => b.addEventListener("click", () => setView(b.dataset.vista)));

// ---------- Mapa (se carga al acercarse a la sección) ----------
let L = null;
let map = null;
let initializing = null;
let activeZone = null;
const zoneMarkers = new Map();

new IntersectionObserver(
  ([entry], obs) => {
    if (entry.isIntersecting) {
      obs.disconnect();
      if (!wrap.hidden) init();
    }
  },
  { rootMargin: "300px" },
).observe(wrap);

function init() {
  initializing ??= build();
  return initializing;
}

async function build() {
  L = (await import("leaflet")).default;
  await import("leaflet/dist/leaflet.css");

  map = L.map(el, { scrollWheelZoom: false, zoomSnap: 0.5 });
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(map);

  // La rueda del mouse solo hace zoom después de hacer clic en el mapa
  map.on("click focus", () => map.scrollWheelZoom.enable());
  map.on("mouseout blur", () => map.scrollWheelZoom.disable());

  const cityLayer = L.layerGroup();
  const zoneLayer = L.layerGroup();
  const allPoints = [];

  // Ciudades
  const cities = [...new Set(ZONES.map((z) => z.city))];
  for (const city of cities) {
    const zones = ZONES.filter((z) => z.city === city);
    const points = zones.flatMap((z) => [z.coords, z.uniCoords]);
    allPoints.push(...points);
    const bounds = L.latLngBounds(points);
    const total = zones.reduce((n, z) => n + roomsIn(z.id).length, 0);
    // Punto en la ubicación real y etiqueta a un lado (evita que se encimen ciudades cercanas)
    const side = LABEL_SIDE[city] ?? "top";
    const marker = L.marker(bounds.getCenter(), {
      title: `${city}: ${total} cuartos`,
      alt: `${city}: ${total} cuartos`,
      icon: L.divIcon({
        className: "",
        iconSize: null,
        html: `<div class="relative cursor-pointer">
          <span class="absolute -left-2 -top-2 size-4 rounded-full bg-accent ring-4 ring-white shadow-soft"></span>
          <span class="absolute ${LABEL_POS[side]} inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-accent px-3 py-1.5 text-sm font-semibold text-accent-ink shadow-soft ring-2 ring-white">
            ${esc(city)}<span class="font-normal opacity-85">${total}</span></span>
        </div>`,
      }),
    });
    marker.on("click", () => fly(bounds));
    cityLayer.addLayer(marker);
  }

  // Zonas, campus y línea de distancia
  for (const z of ZONES) {
    const rooms = roomsIn(z.id);
    const from = Math.min(...rooms.map((r) => r.priceReal));
    const dist = km(z.coords, z.uniCoords);

    zoneLayer.addLayer(
      L.polyline([z.coords, z.uniCoords], { color: "#da0a3f", weight: 2, opacity: 0.65, dashArray: "4 7", interactive: false }),
    );

    const uni = L.marker(z.uniCoords, {
      title: z.university,
      alt: z.university,
      keyboard: false,
      icon: L.divIcon({
        className: "",
        iconSize: null,
        html: `<div style="transform:translate(-50%,-50%)"><span class="grid size-9 place-items-center rounded-full bg-accent-soft text-lg text-accent shadow-soft ring-2 ring-white"><i class="ph ph-graduation-cap" aria-hidden="true"></i></span></div>`,
      }),
    });
    uni.bindTooltip(esc(z.university), { direction: "top", offset: [0, -18] });
    zoneLayer.addLayer(uni);

    const marker = L.marker(z.coords, {
      title: `${z.name}: ${rooms.length} cuartos desde ${pesos(from)}`,
      alt: `${z.name}: ${rooms.length} cuartos desde ${pesos(from)}`,
      riseOnHover: true,
      icon: zoneIcon(z, from, false),
    });
    marker.bindPopup(
      `<div class="grid gap-2 font-sans text-[14px] text-ink">
        <div>
          <p class="font-display text-base font-semibold leading-tight">${esc(z.name)}</p>
          <p class="text-muted">${esc(z.city)}${z.state && z.state !== z.city ? `, ${esc(z.state)}` : ""}</p>
        </div>
        <p class="flex items-center gap-1.5"><i class="ph ph-graduation-cap text-accent" aria-hidden="true"></i>${esc(z.university)}, a ${dist.toFixed(1)} km en línea recta</p>
        <p class="flex items-center gap-1.5"><i class="ph ph-house-line text-accent" aria-hidden="true"></i>${rooms.length} ${rooms.length === 1 ? "cuarto" : "cuartos"}, desde <strong>${pesos(from)}</strong></p>
        <p class="flex items-center gap-1.5"><i class="ph ph-shield-check text-accent" aria-hidden="true"></i>Seguridad percibida ${z.guide.safety.toFixed(1)} de 5</p>
        ${z.alerts.length ? `<p class="flex items-center gap-1.5 text-warn"><i class="ph ph-warning" aria-hidden="true"></i>${z.alerts.length === 1 ? "1 alerta" : `${z.alerts.length} alertas`} en la zona</p>` : ""}
        <button type="button" data-ver-zona="${z.id}" class="btn-primary mt-1 w-full py-2.5!">Ver cuartos</button>
      </div>`,
      { className: "mapa-popup", maxWidth: 280, minWidth: 240 },
    );
    zoneMarkers.set(z.id, { marker, zone: z, from });
    zoneLayer.addLayer(marker);
  }

  map.on("popupopen", (e) => {
    const btn = e.popup.getElement()?.querySelector("[data-ver-zona]");
    btn?.addEventListener("click", () => {
      map.closePopup();
      selectZone(btn.dataset.verZona);
    });
  });

  // Ciudades lejos, zonas cerca
  const update = () => {
    const near = map.getZoom() >= ZOOM_ZONAS;
    if (near) {
      map.removeLayer(cityLayer);
      zoneLayer.addTo(map);
    } else {
      map.removeLayer(zoneLayer);
      cityLayer.addTo(map);
    }
  };
  map.on("zoomend", update);

  // Botón para volver a ver todo México
  const allBounds = L.latLngBounds(allPoints);
  const ResetControl = L.Control.extend({
    options: { position: "topright" },
    onAdd() {
      const b = L.DomUtil.create("button", "");
      b.type = "button";
      b.className = "inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-white px-3.5 py-2 text-sm font-medium text-ink shadow-soft ring-1 ring-line hover:bg-surface-2";
      b.innerHTML = `<i class="ph ph-globe-hemisphere-west" aria-hidden="true"></i>Todas las ciudades`;
      L.DomEvent.disableClickPropagation(b);
      b.addEventListener("click", () => fly(allBounds));
      return b;
    },
  });
  map.addControl(new ResetControl());

  map.fitBounds(allBounds, { padding: [40, 40] });
  update();
  if (activeZone) focusZone(activeZone);
}

function zoneIcon(z, from, active) {
  return L.divIcon({
    className: "",
    iconSize: null,
    html: `<div style="transform:translate(-50%,-50%)"><span class="flex cursor-pointer flex-col items-center whitespace-nowrap rounded-2xl px-3 py-1.5 text-center shadow-soft ring-2 ${
      active ? "bg-accent text-accent-ink ring-white" : "bg-white text-ink ring-white"
    }">
      <span class="text-[11px] leading-tight ${active ? "opacity-90" : "text-muted"}">${esc(z.name)}</span>
      <span class="font-display text-sm font-semibold leading-tight">${pesos(from)}</span>
    </span></div>`,
  });
}

function fly(bounds) {
  const opts = { padding: [60, 60], maxZoom: 14 };
  if (reduceMotion) map.fitBounds(bounds, opts);
  else map.flyToBounds(bounds, { ...opts, duration: 0.8 });
}

function focusZone(id) {
  const item = zoneMarkers.get(id);
  if (!item) return;
  fly(L.latLngBounds([item.zone.coords, item.zone.uniCoords]));
}

// La zona elegida en la búsqueda o el directorio se resalta y el mapa va hacia ella
document.addEventListener("zona:activa", (e) => {
  activeZone = e.detail;
  if (!map) return;
  for (const [id, { marker, zone, from }] of zoneMarkers) marker.setIcon(zoneIcon(zone, from, id === activeZone));
  if (activeZone && !wrap.hidden) focusZone(activeZone);
});
