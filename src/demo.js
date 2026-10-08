// Demo de búsqueda por zona. Todo es simulado en el navegador con datos de src/data.js.
import { animate, stagger } from "motion";
import { ZONES, ROOMS } from "./data.js";
import { openTour } from "./tour.js";

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const ease = [0.16, 1, 0.3, 1];

const LOCALES = { México: "es-MX" };
const TYPES = [
  ["todos", "Todos"],
  ["individual", "Individual"],
  ["compartido", "Compartido"],
  ["departamento", "Departamento"],
];
const SCORE_LABELS = [
  ["limpieza", "Limpieza", "ph-broom"],
  ["casero", "Trato del casero", "ph-user-circle"],
  ["ruido", "Ruido", "ph-speaker-high"],
  ["internet", "Internet", "ph-wifi-high"],
  ["seguridad", "Seguridad", "ph-shield-check"],
];
const DEPOSIT = {
  devuelto: ["Depósito devuelto", "text-success", "ph-check-circle"],
  parcial: ["Devolución parcial", "text-warn", "ph-warning"],
  no: ["No lo devolvieron", "text-danger", "ph-x-circle"],
  null: ["Sin datos todavía", "text-muted", "ph-clock"],
};

const form = document.getElementById("demo-form");
const input = document.getElementById("demo-q");
const list = document.getElementById("demo-sugerencias");
const results = document.getElementById("demo-resultados");
const dialog = document.getElementById("cuarto-dialog");

const state = {
  zones: [],
  zoneId: null,
  type: "todos",
  maxPrice: null,
  hideAlerts: false,
  sort: "rating",
};

// Utilidades
const norm = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const zoneOf = (room) => ZONES.find((z) => z.id === room.zone);
const money = (n, zone) => `${zone.currency}${n.toLocaleString(LOCALES[zone.country] ?? "es-MX")}`;
const overall = (room) => {
  const v = Object.values(room.scores);
  return v.reduce((a, b) => a + b, 0) / v.length;
};
const roomsIn = (zoneId) => ROOMS.filter((r) => r.zone === zoneId);
const img = (src) => src; // cada cuarto trae su foto importada en src/data.js

function matchZones(query) {
  const q = norm(query);
  if (q.length < 2) return [];
  return ZONES.filter((z) =>
    [z.name, z.city, z.state ?? "", z.university, ...z.aliases].some((field) => {
      const f = norm(field);
      return f.includes(q) || q.includes(f);
    }),
  );
}

// Sugerencias (combobox accesible)
let active = -1;
let suggestions = [];

function closeList() {
  list.classList.add("hidden");
  input.setAttribute("aria-expanded", "false");
  input.removeAttribute("aria-activedescendant");
  active = -1;
}

function renderList() {
  suggestions = matchZones(input.value).slice(0, 6);
  if (!suggestions.length) return closeList();
  list.innerHTML = suggestions
    .map(
      (z, i) => `
      <li id="sug-${i}" role="option" aria-selected="${i === active}" data-i="${i}"
          class="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 ${i === active ? "bg-accent-soft" : "hover:bg-surface-2"}">
        <i class="ph ph-map-pin text-lg text-accent" aria-hidden="true"></i>
        <span><span class="block font-medium">${esc(z.name)}</span>
        <span class="text-sm text-muted">${esc(z.university)}, ${esc(z.city)}</span></span>
      </li>`,
    )
    .join("");
  list.classList.remove("hidden");
  input.setAttribute("aria-expanded", "true");
  if (active >= 0) input.setAttribute("aria-activedescendant", `sug-${active}`);
}

input.addEventListener("input", () => {
  active = -1;
  renderList();
});
input.addEventListener("keydown", (e) => {
  if (list.classList.contains("hidden")) return;
  if (e.key === "ArrowDown" || e.key === "ArrowUp") {
    e.preventDefault();
    const n = suggestions.length;
    active = e.key === "ArrowDown" ? (active + 1) % n : (active - 1 + n) % n;
    renderList();
  } else if (e.key === "Enter" && active >= 0) {
    e.preventDefault();
    pickZone(suggestions[active]);
  } else if (e.key === "Escape") {
    closeList();
  }
});
list.addEventListener("mousedown", (e) => {
  const li = e.target.closest("[data-i]");
  if (li) {
    e.preventDefault();
    pickZone(suggestions[Number(li.dataset.i)]);
  }
});
input.addEventListener("blur", () => setTimeout(closeList, 100));

function pickZone(zone) {
  input.value = zone.name;
  closeList();
  search(zone.name, [zone]);
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  closeList();
  search(input.value);
});

// Directorio de ciudades: todas las zonas disponibles, sin tener que adivinar qué escribir
const cityGrid = document.getElementById("demo-ciudades");
const CITIES = [...new Set(ZONES.map((z) => z.city))].map((city) => {
  const zones = ZONES.filter((z) => z.city === city);
  return { city, state: zones[0].state, zones };
});

function renderCities() {
  cityGrid.innerHTML = CITIES.map(({ city, state, zones }) => {
    const total = zones.reduce((n, z) => n + roomsIn(z.id).length, 0);
    return `
      <div class="flex flex-col rounded-2xl bg-surface p-4 ring-1 ring-line">
        <button type="button" data-dir-city="${esc(city)}" class="group flex cursor-pointer items-start justify-between gap-3 rounded-xl text-left">
          <span>
            <span class="block font-display text-lg font-semibold group-hover:text-accent">${esc(city)}</span>
            <span class="text-sm text-muted">${state && state !== city ? `${esc(state)}. ` : ""}${total} ${total === 1 ? "cuarto" : "cuartos"}</span>
          </span>
          <i class="ph ph-arrow-right mt-1.5 text-accent transition-transform group-hover:translate-x-0.5" aria-hidden="true"></i>
        </button>
        <ul class="mt-3 grid gap-1.5 border-t border-line pt-3">
          ${zones
            .map((z) => {
              const rooms = roomsIn(z.id);
              const from = Math.min(...rooms.map((r) => r.priceReal));
              return `<li>
                <button type="button" data-dir-zone="${z.id}" aria-pressed="false"
                  class="w-full cursor-pointer rounded-xl px-3 py-2 text-left text-sm transition-colors hover:bg-accent-soft aria-pressed:bg-accent-soft aria-pressed:ring-1 aria-pressed:ring-accent/40">
                  <span class="block font-medium">${esc(z.name)}</span>
                  <span class="block text-muted">${esc(z.university)}</span>
                  <span class="mt-0.5 block text-muted">${rooms.length} ${rooms.length === 1 ? "cuarto" : "cuartos"}, desde <span class="font-medium text-ink">${money(from, z)}</span></span>
                </button>
              </li>`;
            })
            .join("")}
        </ul>
      </div>`;
  }).join("");

  cityGrid.querySelectorAll("[data-dir-city]").forEach((b) =>
    b.addEventListener("click", () => {
      const city = b.dataset.dirCity;
      input.value = city;
      search(city, ZONES.filter((z) => z.city === city));
      scrollToResults();
    }),
  );
  cityGrid.querySelectorAll("[data-dir-zone]").forEach((b) =>
    b.addEventListener("click", () => {
      pickZone(ZONES.find((z) => z.id === b.dataset.dirZone));
      scrollToResults();
    }),
  );
}

function markDirectory() {
  cityGrid.querySelectorAll("[data-dir-zone]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.dirZone === state.zoneId)));
  // Avisa al mapa (src/map.js) qué zona se está viendo
  document.dispatchEvent(new CustomEvent("zona:activa", { detail: state.zoneId }));
}

// Muestra los cuartos de una zona y baja a los resultados (lo usa el mapa)
function selectZone(id) {
  pickZone(ZONES.find((z) => z.id === id));
  scrollToResults();
}

function scrollToResults() {
  results.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
}

renderCities();

// Búsqueda simulada
function search(query, zones = matchZones(query)) {
  if (!query.trim()) {
    input.focus();
    return;
  }
  state.zones = zones;
  state.zoneId = zones[0]?.id ?? null;
  resetFilters();
  renderSkeleton();
  setTimeout(() => (zones.length ? renderResults(true) : renderEmpty(query)), 650);
}

function resetFilters() {
  state.type = "todos";
  state.hideAlerts = false;
  state.sort = "rating";
  state.maxPrice = null;
}

function renderSkeleton() {
  const block = (cls) => `<div class="animate-pulse rounded-3xl bg-line/60 ${cls}"></div>`;
  results.innerHTML = `
    <p class="sr-only">Buscando...</p>
    <div class="grid gap-6 lg:grid-cols-12">
      <div class="grid gap-4 lg:col-span-4">${block("h-72")}${block("h-28")}</div>
      <div class="grid gap-5 sm:grid-cols-2 lg:col-span-8">${block("h-80")}${block("h-80")}</div>
    </div>`;
}

function renderEmpty(query) {
  state.zoneId = null;
  markDirectory();
  const cities = [...new Set(ZONES.map((z) => z.city))];
  results.innerHTML = `
    <div class="flex flex-col items-center rounded-3xl border border-dashed border-line px-6 py-16 text-center">
      <i class="ph ph-magnifying-glass text-4xl text-muted" aria-hidden="true"></i>
      <p class="mt-4 font-display text-xl font-semibold">No hay datos de “${esc(query)}” en esta demo</p>
      <p class="mt-2 max-w-[46ch] text-muted">Por ahora la demo incluye estas ciudades:</p>
      <div class="mt-5 flex flex-wrap justify-center gap-2">
        ${cities.map((c) => `<button type="button" data-city="${esc(c)}" class="cursor-pointer rounded-full bg-surface px-3.5 py-2 text-sm ring-1 ring-line transition-colors hover:bg-accent-soft hover:text-accent">${esc(c)}</button>`).join("")}
      </div>
    </div>`;
  results.querySelectorAll("[data-city]").forEach((b) =>
    b.addEventListener("click", () => {
      input.value = b.dataset.city;
      search(b.dataset.city);
    }),
  );
}

function visibleRooms(zone) {
  let rooms = roomsIn(zone.id);
  if (state.type !== "todos") rooms = rooms.filter((r) => r.type === state.type);
  if (state.hideAlerts) rooms = rooms.filter((r) => !r.alert);
  if (state.maxPrice != null) rooms = rooms.filter((r) => r.priceReal <= state.maxPrice);
  const sorters = {
    rating: (a, b) => overall(b) - overall(a),
    price: (a, b) => a.priceReal - b.priceReal,
    distance: (a, b) => a.minutes - b.minutes,
  };
  return rooms.sort(sorters[state.sort]);
}

function renderResults(animateIn = false) {
  const zone = ZONES.find((z) => z.id === state.zoneId);
  const all = roomsIn(zone.id);
  const prices = all.map((r) => r.priceReal);
  const minP = Math.min(...prices);
  const maxP = Math.max(...prices);
  const maxPrice = state.maxPrice ?? maxP;
  const rooms = visibleRooms(zone);
  const g = zone.guide;

  results.innerHTML = `
    ${
      state.zones.length > 1
        ? `<div class="mb-8 flex flex-wrap gap-2" aria-label="Zonas encontradas">
            ${state.zones
              .map(
                (z) => `<button type="button" data-zone="${z.id}" aria-pressed="${z.id === zone.id}"
                  class="cursor-pointer rounded-full px-4 py-2.5 text-sm font-medium transition-colors ${
                    z.id === zone.id ? "bg-accent text-accent-ink" : "bg-surface ring-1 ring-line hover:bg-accent-soft"
                  }">${esc(z.name)} <span class="font-normal opacity-70">${esc(z.city)}</span></button>`,
              )
              .join("")}
          </div>`
        : ""
    }
    <div class="grid gap-6 lg:grid-cols-12">
      <aside class="grid content-start gap-4 lg:col-span-4" data-anim>
        <div class="rounded-3xl bg-accent-soft p-6">
          <p class="text-sm text-muted">${esc(zone.city)}${zone.state && zone.state !== zone.city ? `, ${esc(zone.state)}` : ""}</p>
          <h3 class="mt-1 text-2xl font-semibold">${esc(zone.name)}</h3>
          <p class="mt-1 flex items-center gap-1.5 text-sm text-accent"><i class="ph ph-graduation-cap" aria-hidden="true"></i>Cerca de ${esc(zone.university)}</p>
          <dl class="mt-6 grid gap-4 text-[15px]">
            <div class="flex gap-3"><i class="ph ph-house-line mt-0.5 text-xl text-accent" aria-hidden="true"></i><div><dt class="text-sm text-muted">Renta real promedio</dt><dd class="font-display text-xl font-semibold">${money(g.rent, zone)}</dd></div></div>
            <div class="flex gap-3"><i class="ph ph-bus mt-0.5 text-xl text-accent" aria-hidden="true"></i><div><dt class="text-sm text-muted">Transporte</dt><dd>${esc(g.transport)}</dd></div></div>
            <div class="flex gap-3"><i class="ph ph-bowl-food mt-0.5 text-xl text-accent" aria-hidden="true"></i><div><dt class="text-sm text-muted">Comida</dt><dd>${esc(g.food)}</dd></div></div>
            <div class="flex gap-3"><i class="ph ph-washing-machine mt-0.5 text-xl text-accent" aria-hidden="true"></i><div><dt class="text-sm text-muted">Lavandería</dt><dd>${esc(g.laundry)}</dd></div></div>
            <div class="flex gap-3"><i class="ph ph-shield-check mt-0.5 text-xl text-accent" aria-hidden="true"></i><div><dt class="text-sm text-muted">Seguridad percibida</dt><dd class="flex items-center gap-1 font-medium"><i class="ph-fill ph-star text-accent" aria-hidden="true"></i>${g.safety.toFixed(1)} de 5</dd></div></div>
          </dl>
        </div>
        ${
          zone.alerts.length
            ? `<div class="rounded-3xl bg-warn-soft p-6">
                <p class="flex items-center gap-2 font-display text-lg font-semibold text-warn"><i class="ph ph-warning" aria-hidden="true"></i>Alertas en la zona</p>
                <ul class="mt-3 grid gap-2 text-[15px] leading-relaxed">${zone.alerts.map((a) => `<li>${esc(a)}</li>`).join("")}</ul>
              </div>`
            : `<div class="flex items-center gap-3 rounded-3xl bg-surface p-5 text-[15px] ring-1 ring-line">
                <i class="ph ph-seal-check text-2xl text-success" aria-hidden="true"></i>Sin alertas reportadas en esta zona.
              </div>`
        }
      </aside>

      <div class="lg:col-span-8">
        <div class="flex flex-col gap-4 rounded-3xl bg-surface p-4 ring-1 ring-line" data-anim>
          <div class="flex flex-wrap gap-2" role="group" aria-label="Tipo de cuarto">
            ${TYPES.map(
              ([v, l]) => `<button type="button" data-type="${v}" aria-pressed="${state.type === v}"
                class="cursor-pointer rounded-full px-3.5 py-2 text-sm transition-colors ${
                  state.type === v ? "bg-accent text-accent-ink" : "bg-surface-2 hover:bg-accent-soft"
                }">${l}</button>`,
            ).join("")}
          </div>
          <div class="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
            <div class="grid gap-1.5">
              <label for="demo-precio" class="flex justify-between text-sm"><span class="text-muted">Precio real máximo</span><span class="font-medium">${money(maxPrice, zone)}</span></label>
              <input id="demo-precio" type="range" min="${minP}" max="${maxP}" step="${Math.max(1, Math.round((maxP - minP) / 20))}" value="${maxPrice}" class="w-full cursor-pointer accent-[var(--accent)]" ${minP === maxP ? "disabled" : ""} />
            </div>
            <div class="grid gap-1.5">
              <label for="demo-orden" class="text-sm text-muted">Ordenar por</label>
              <select id="demo-orden" class="field py-2!">
                <option value="rating" ${state.sort === "rating" ? "selected" : ""}>Mejor calificados</option>
                <option value="price" ${state.sort === "price" ? "selected" : ""}>Más baratos</option>
                <option value="distance" ${state.sort === "distance" ? "selected" : ""}>Más cerca</option>
              </select>
            </div>
          </div>
          <label class="flex cursor-pointer items-center gap-2.5 text-sm">
            <input id="demo-alertas" type="checkbox" class="size-4 cursor-pointer accent-[var(--accent)]" ${state.hideAlerts ? "checked" : ""} />
            Ocultar cuartos con alertas
          </label>
        </div>

        <p class="mt-6 text-sm text-muted">${rooms.length} de ${all.length} ${all.length === 1 ? "cuarto" : "cuartos"} en ${esc(zone.name)}</p>

        ${
          rooms.length
            ? `<ul class="mt-4 grid gap-5 sm:grid-cols-2">${rooms.map((r) => roomCard(r, zone)).join("")}</ul>`
            : `<div class="mt-4 flex flex-col items-center rounded-3xl border border-dashed border-line px-6 py-12 text-center">
                <p class="font-display text-lg font-semibold">Ningún cuarto cumple esos filtros</p>
                <button type="button" id="demo-reset" class="btn-ghost mt-4">Quitar filtros</button>
              </div>`
        }
      </div>
    </div>`;

  bindResults(zone);
  markDirectory();

  if (animateIn && !reduceMotion) {
    animate(results.querySelectorAll("[data-anim], [data-card]"), { opacity: [0, 1], y: [16, 0] }, { duration: 0.5, delay: stagger(0.06), ease });
  }
}

function roomCard(room, zone) {
  const [depLabel, depColor, depIcon] = DEPOSIT[room.deposit];
  const extra = room.priceReal - room.priceAd;
  return `
    <li data-card>
      <button type="button" data-room="${room.id}" class="group flex h-full w-full cursor-pointer flex-col overflow-hidden rounded-3xl border border-line bg-surface text-left transition-shadow hover:shadow-soft">
        <img src="${img(room.img, 640, 400)}" alt="" width="640" height="400" loading="lazy" class="aspect-[16/10] w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
        <div class="flex flex-1 flex-col p-5">
          <div class="flex items-start justify-between gap-3">
            <h4 class="font-display text-lg font-semibold leading-snug">${esc(room.title)}</h4>
            <p class="flex shrink-0 items-center gap-1 font-display text-lg font-semibold"><i class="ph-fill ph-star text-accent" aria-hidden="true"></i>${overall(room).toFixed(1)}</p>
          </div>
          <p class="mt-1 text-sm text-muted">${room.minutes} min ${esc(room.mode)} · ${room.reviews.length} ${room.reviews.length === 1 ? "reseña" : "reseñas"}</p>
          ${room.tour360 ? `<p class="mt-2 flex items-center gap-1.5 text-sm font-medium text-accent"><i class="ph ph-cube-focus" aria-hidden="true"></i>Recorrido 360°</p>` : ""}
          <p class="mt-4 font-display text-xl font-semibold">${money(room.priceReal, zone)} <span class="text-sm font-normal text-muted">al mes, real</span></p>
          ${extra > 0 ? `<p class="text-sm text-muted">Anunciado en ${money(room.priceAd, zone)}</p>` : `<p class="text-sm text-success">Igual al anuncio</p>`}
          <div class="mt-auto pt-4">
            ${
              room.alert
                ? `<p class="flex items-start gap-2 rounded-xl bg-warn-soft px-3 py-2 text-sm text-warn"><i class="ph ph-warning mt-0.5" aria-hidden="true"></i>${esc(room.alert)}</p>`
                : `<p class="flex items-center gap-1.5 text-sm ${depColor}"><i class="ph ${depIcon}" aria-hidden="true"></i>${depLabel}</p>`
            }
          </div>
        </div>
      </button>
    </li>`;
}

function bindResults(zone) {
  results.querySelectorAll("[data-zone]").forEach((b) =>
    b.addEventListener("click", () => {
      state.zoneId = b.dataset.zone;
      resetFilters();
      renderResults(true);
    }),
  );
  results.querySelectorAll("[data-type]").forEach((b) =>
    b.addEventListener("click", () => {
      state.type = b.dataset.type;
      renderResults();
      results.querySelector(`[data-type="${state.type}"]`).focus();
    }),
  );
  const range = results.querySelector("#demo-precio");
  range.addEventListener("input", () => {
    // Actualiza solo la etiqueta mientras se arrastra; filtra al soltar
    range.labels[0].lastElementChild.textContent = money(Number(range.value), zone);
  });
  range.addEventListener("change", () => {
    state.maxPrice = Number(range.value);
    renderResults();
    results.querySelector("#demo-precio").focus();
  });
  results.querySelector("#demo-orden").addEventListener("change", (e) => {
    state.sort = e.target.value;
    renderResults();
    results.querySelector("#demo-orden").focus();
  });
  results.querySelector("#demo-alertas").addEventListener("change", (e) => {
    state.hideAlerts = e.target.checked;
    renderResults();
    results.querySelector("#demo-alertas").focus();
  });
  results.querySelector("#demo-reset")?.addEventListener("click", () => {
    resetFilters();
    renderResults();
  });
  results.querySelectorAll("[data-room]").forEach((b) => b.addEventListener("click", () => openRoom(b.dataset.room)));
}

// Detalle del cuarto
function openRoom(id) {
  const room = ROOMS.find((r) => r.id === id);
  const zone = zoneOf(room);
  const [depLabel, depColor, depIcon] = DEPOSIT[room.deposit];
  const diff = room.priceReal - room.priceAd;
  const pct = Math.round((diff / room.priceAd) * 100);

  dialog.innerHTML = `
    <div class="relative">
      <img src="${img(room.img, 1200, 560)}" alt="Foto del cuarto: ${esc(room.title)}" width="1200" height="560" class="aspect-[15/7] w-full object-cover" />
      ${
        room.tour360
          ? `<button type="button" data-open360 class="absolute bottom-4 left-4 inline-flex cursor-pointer items-center gap-2 rounded-full bg-surface px-4 py-2.5 text-[15px] font-medium text-ink shadow-soft transition-transform hover:-translate-y-0.5">
              <i class="ph ph-cube-focus text-lg text-accent" aria-hidden="true"></i>Explorar en 360°
            </button>`
          : ""
      }
      <button type="button" data-close class="absolute right-4 top-4 grid size-11 cursor-pointer place-items-center rounded-full bg-surface text-ink shadow-soft" aria-label="Cerrar">
        <i class="ph ph-x text-xl" aria-hidden="true"></i>
      </button>
    </div>
    <div class="grid gap-8 p-6 md:p-8">
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p class="text-sm text-muted">${esc(zone.name)}, ${esc(zone.city)} · ${room.minutes} min ${esc(room.mode)} de ${esc(zone.university)}</p>
          <h3 id="cuarto-titulo" class="mt-1 text-2xl font-semibold md:text-3xl">${esc(room.title)}</h3>
          <p class="mt-1 text-sm text-muted">Casero: ${esc(room.landlord)}</p>
        </div>
        <p class="flex items-center gap-1.5 font-display text-3xl font-semibold"><i class="ph-fill ph-star text-2xl text-accent" aria-hidden="true"></i>${overall(room).toFixed(1)}</p>
      </div>

      ${room.alert ? `<p class="flex items-start gap-3 rounded-2xl bg-warn-soft p-4 text-warn"><i class="ph ph-warning mt-0.5 text-xl" aria-hidden="true"></i><span><span class="block font-medium">Alerta de la comunidad</span>${esc(room.alert)}</span></p>` : ""}

      <dl class="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div class="rounded-2xl bg-surface-2 p-4"><dt class="text-sm text-muted">Precio anunciado</dt><dd class="mt-1 font-display text-xl font-semibold">${money(room.priceAd, zone)}</dd></div>
        <div class="rounded-2xl bg-surface-2 p-4"><dt class="text-sm text-muted">Lo que pagan al mes</dt><dd class="mt-1 font-display text-xl font-semibold">${money(room.priceReal, zone)}</dd></div>
        <div class="col-span-2 rounded-2xl bg-surface-2 p-4 sm:col-span-1"><dt class="text-sm text-muted">Diferencia</dt><dd class="mt-1 font-display text-xl font-semibold ${diff > 0 ? "text-warn" : "text-success"}">${diff > 0 ? `+${pct}%` : "Sin sorpresas"}</dd></div>
      </dl>

      <div class="grid gap-8 md:grid-cols-2">
        <div>
          <h4 class="font-display text-lg font-semibold">Calificaciones</h4>
          <dl class="mt-4 grid grid-cols-2 gap-x-6 gap-y-4">
            ${SCORE_LABELS.map(
              ([k, l, icon]) => `<div>
                <dt class="flex items-center gap-2 text-sm text-muted"><i class="ph ${icon} text-lg" aria-hidden="true"></i>${l}</dt>
                <dd class="mt-0.5 flex items-center gap-1 font-display text-lg font-semibold"><i class="ph-fill ph-star text-sm text-accent" aria-hidden="true"></i>${room.scores[k].toFixed(1)}</dd>
              </div>`,
            ).join("")}
            <div>
              <dt class="flex items-center gap-2 text-sm text-muted"><i class="ph ph-currency-circle-dollar text-lg" aria-hidden="true"></i>Depósito</dt>
              <dd class="mt-0.5 flex items-center gap-1.5 font-display text-lg font-semibold ${depColor}"><i class="ph ${depIcon}" aria-hidden="true"></i>${depLabel}</dd>
            </div>
          </dl>
          <p class="mt-6 text-sm text-muted">Incluye: ${room.includes.map(esc).join(", ")}</p>
        </div>
        <div>
          <h4 class="font-display text-lg font-semibold">Reseñas</h4>
          <ul class="mt-4 grid gap-5">
            ${room.reviews
              .map(
                (rv) => `<li class="border-t border-line pt-4">
                  <p class="leading-relaxed">“${esc(rv.text)}”</p>
                  <p class="mt-2 text-sm text-muted">${esc(rv.author)}, ${esc(rv.career)}. Vivió ahí ${esc(rv.stay)}.</p>
                </li>`,
              )
              .join("")}
          </ul>
        </div>
      </div>

      <div class="flex flex-col gap-3 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p class="text-sm text-muted">Datos hipotéticos para la demo.</p>
        <a href="#lista" data-close class="btn-primary">Únete a la lista</a>
      </div>
    </div>`;

  dialog.querySelectorAll("[data-close]").forEach((el) => el.addEventListener("click", () => dialog.close()));
  dialog.querySelector("[data-open360]")?.addEventListener("click", (e) => {
    openTour({ ...room.tour360, title: room.title, subtitle: `${zone.name}, ${zone.city}` }, e.currentTarget.parentElement.querySelector("img"));
  });
  dialog.showModal();
  dialog.scrollTop = 0;
  if (!reduceMotion) animate(dialog, { opacity: [0, 1], y: [24, 0] }, { duration: 0.4, ease });
}

// Cerrar al hacer clic fuera del contenido
dialog.addEventListener("click", (e) => {
  if (e.target === dialog) dialog.close();
});

// Para el asistente de búsqueda (src/assistant.js)
export { openRoom, money, overall, norm, esc, zoneOf, selectZone };
