// Asistente de búsqueda SIMULADO: entiende frases con reglas y palabras clave
// (sin IA ni servidor) y busca en el catálogo de src/data.js.
import { animate } from "motion";
import { ZONES, ROOMS } from "./data.js";
import { openRoom, overall, norm, esc, zoneOf } from "./demo.js";

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const isTouch = window.matchMedia("(pointer: coarse)").matches; // en táctil no se abre el teclado solo
const isSmall = window.matchMedia("(max-width: 639px)"); // en celular el chat ocupa toda la pantalla
const ease = [0.16, 1, 0.3, 1];
const MAX_SHOWN = 5;

const launcher = document.getElementById("asistente-boton");
const panel = document.getElementById("asistente");
const log = document.getElementById("asistente-mensajes");
const form = document.getElementById("asistente-form");
const input = document.getElementById("asistente-texto");
const resetBtn = document.getElementById("asistente-reiniciar");
const closeBtn = document.getElementById("asistente-cerrar");

const pesos = (n) => `$${Math.round(n).toLocaleString("es-MX")}`;
const plural = (n, uno, varios) => `${n} ${n === 1 ? uno : varios}`;
const CITIES = [...new Set(ZONES.map((z) => z.city))];

// ---------- Interpretación del mensaje ----------

const escRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const word = (kw) => new RegExp(`(^|[^a-z0-9])${escRe(kw)}([^a-z0-9]|$)`);

// Palabras que identifican cada zona: nombre, ciudad, estado, universidad y apodos
const ZONE_KEYWORDS = ZONES.map((z) => ({
  id: z.id,
  patterns: [z.name, z.city, z.state ?? "", z.university, ...z.aliases].map(norm).filter(Boolean).map(word),
}));

const RULES = {
  individual: /\b(individual|para mi sol[oa]|yo sol[oa]|sin roomies?)\b/,
  compartido: /\b(compartid[oa]s?|roomies?|compartir|con otros estudiantes)\b/,
  departamento: /\b(departamentos?|depas?|monoambientes?|lofts?)\b|\b(un|el) estudio\b|\bestudio (amueblado|independiente|completo)\b/,
  privateBath: /\bbano (propio|privado|independiente|para mi)\b/,
  quiet: /\b(tranquil[oa]s?|silencios[oa]s?|sin ruido|poco ruido|para estudiar|concentrarme)\b/,
  clean: /\blimpi[oa]s?\b/,
  internet: /\b(internet|wifi|wi-fi|clases en linea|videollamadas?)\b/,
  safe: /\b(segur[oa]s?|sin alertas?|sin estafas?|confiables?|sin fraudes?|que no sea estafa)\b/,
  depositBack: /\bdeposito\b.*\b(devuelv|regres)|\b(devuelv|regres)\w*\b.*\bdeposito\b/,
  walking: /\b(muy cerca|caminando|a pie|a pasos|a unos pasos)\b/,
  tour360: /\b(360|recorrido|tour|virtual)\b/,
  services: /\b(servicios|luz|todo) incluid[oa]s?\b|\bincluy\w* (servicios|luz)\b/,
  sortPrice: /\b(barat[oa]s?|economic[oa]s?|menor precio|ahorrar|lo mas barato)\b/,
  sortRating: /\b(mejor calificad[oa]s?|mejores resenas|el mejor|la mejor|recomiendas?|recomienda)\b/,
  sortDistance: /\b(mas cerca|mas cercan[oa]s?|lo mas cercano)\b/,
  reset: /\b(nueva busqueda|empezar de nuevo|empecemos de nuevo|reinicia\w*|olvida lo anterior)\b/,
  greeting: /^(hola|buenas|buen dia|buenos dias|buenas tardes|buenas noches|hey|que tal)\b/,
  help: /\b(que ciudades|donde (hay|tienen)|ciudades disponibles|ayuda|que puedes hacer|como funciona)\b/,
  thanks: /\b(gracias|muchas gracias|genial|perfecto)\b/,
};

function parsePrices(t) {
  const out = {};
  const between = t.match(/entre\s*\$?\s*([\d.,]+)\s*(mil|k)?\s*y\s*\$?\s*([\d.,]+)\s*(mil|k)?/);
  const toNum = (n, mil) => (mil ? parseFloat(n.replace(",", ".")) * 1000 : parseInt(n.replace(/[.,]/g, ""), 10));
  if (between) {
    out.minPrice = toNum(between[1], between[2] || between[4]);
    out.maxPrice = toNum(between[3], between[4]);
    return out;
  }
  const re = /(\$\s*)?(\d{1,3}(?:[.,]\d{3})+|\d+(?:[.,]\d+)?)\s*(mil|k)?/g;
  let m;
  while ((m = re.exec(t))) {
    const after = t.slice(re.lastIndex, re.lastIndex + 8);
    if (/^\s*(min|minutos)/.test(after)) continue; // son minutos, no pesos
    const value = toNum(m[2], m[3]);
    if (!m[1] && !m[3] && value < 500) continue; // números chicos que no son precios
    const before = t.slice(Math.max(0, m.index - 24), m.index);
    if (/(mas de|minimo|desde|arriba de|al menos)\s*$/.test(before)) out.minPrice = value;
    else out.maxPrice = value; // "menos de", "hasta", "presupuesto", o un monto suelto
  }
  return out;
}

function parse(text) {
  const t = norm(text);
  const c = {};

  const zones = ZONE_KEYWORDS.filter((z) => z.patterns.some((p) => p.test(t))).map((z) => z.id);
  if (zones.length) c.zones = zones;

  Object.assign(c, parsePrices(t));

  const minutes = t.match(/(\d+)\s*(min|minutos)\b/);
  if (minutes) c.maxMinutes = parseInt(minutes[1], 10);

  if (RULES.individual.test(t)) c.type = "individual";
  else if (RULES.compartido.test(t)) c.type = "compartido";
  else if (RULES.departamento.test(t)) c.type = "departamento";

  for (const key of ["privateBath", "quiet", "clean", "internet", "safe", "depositBack", "walking", "tour360", "services"]) {
    if (RULES[key].test(t)) c[key] = true;
  }
  if (RULES.sortPrice.test(t)) c.sort = "price";
  else if (RULES.sortDistance.test(t)) c.sort = "distance";
  else if (RULES.sortRating.test(t)) c.sort = "rating";

  // Lugar mencionado que no está en la demo ("en Mérida")
  const place = t.match(/\b(?:en|de|por)\s+(?:la\s+|el\s+)?([a-z]{4,})/g) ?? [];
  const known = new Set(["cuarto", "cuartos", "casa", "zona", "renta", "menos", "algo", "donde", "busqueda", "departamento", "estudio", "precio", "caminando"]);
  const unknownPlace = !zones.length
    ? place.map((p) => p.split(/\s+/).pop()).find((w) => !known.has(w) && !Object.values(RULES).some((r) => r.test(w)) && !/^\d/.test(w))
    : null;

  // Recupera cómo lo escribió el usuario (con mayúsculas y acentos)
  const original = unknownPlace ? text.split(/[^\p{L}\d]+/u).find((w) => norm(w) === unknownPlace) : null;

  return {
    criteria: c,
    unknownPlace: original ? original[0].toUpperCase() + original.slice(1) : unknownPlace,
    cheaper: /\bmas barat[oa]s?\b/.test(t),
    anywhere: /\b(cualquier (ciudad|lugar|zona|parte)|donde sea|en todas|todas las ciudades|otras ciudades|otra ciudad)\b/.test(t),
    followUp: /^(y|ahora|mejor|tambien|pero|solo|nada mas|que sea|con|sin|y que|entonces)\b/.test(t.replace(/^[¿¡\s]+/, "")),
    reset: RULES.reset.test(t),
    greeting: RULES.greeting.test(t),
    help: RULES.help.test(t),
    thanks: RULES.thanks.test(t),
  };
}

// ---------- Búsqueda ----------

const FILTERS = {
  zones: (r, c) => c.zones.includes(r.zone),
  maxPrice: (r, c) => r.priceReal <= c.maxPrice,
  minPrice: (r, c) => r.priceReal >= c.minPrice,
  type: (r, c) => r.type === c.type,
  privateBath: (r) => r.type === "departamento" || /bano (propio|privado)/.test(norm(r.title)),
  quiet: (r) => r.scores.ruido >= 3.8,
  clean: (r) => r.scores.limpieza >= 4.2,
  internet: (r) => r.scores.internet >= 3.9 || r.includes.includes("Internet"),
  safe: (r) => !r.alert,
  depositBack: (r) => r.deposit === "devuelto",
  walking: (r) => r.mode === "caminando",
  maxMinutes: (r, c) => r.minutes <= c.maxMinutes,
  tour360: (r) => Boolean(r.tour360),
  services: (r) => r.includes.some((i) => /luz|servicios/i.test(i)),
};

// Orden en que se relajan los filtros cuando no hay resultados (la zona nunca se relaja)
const RELAX_ORDER = ["maxPrice", "type", "privateBath", "quiet", "clean", "internet", "depositBack", "maxMinutes", "walking", "services", "tour360", "safe", "minPrice"];

const LABELS = {
  maxPrice: (c) => `hasta ${pesos(c.maxPrice)}`,
  minPrice: (c) => `desde ${pesos(c.minPrice)}`,
  type: (c) => ({ individual: "cuarto individual", compartido: "compartido", departamento: "departamento o estudio" })[c.type],
  privateBath: () => "baño propio",
  quiet: () => "tranquilo",
  clean: () => "muy limpio",
  internet: () => "buen internet",
  safe: () => "sin alertas",
  depositBack: () => "devuelven el depósito",
  walking: () => "caminando al campus",
  maxMinutes: (c) => `a ${c.maxMinutes} min o menos`,
  tour360: () => "con recorrido 360°",
  services: () => "servicios incluidos",
  sort: (c) => ({ price: "más baratos primero", rating: "mejor calificados primero", distance: "más cercanos primero" })[c.sort],
};

function run(c) {
  const active = Object.keys(FILTERS).filter((k) => c[k] !== undefined);
  const rooms = ROOMS.filter((r) => active.every((k) => FILTERS[k](r, c)));
  const sorters = {
    price: (a, b) => a.priceReal - b.priceReal,
    distance: (a, b) => a.minutes - b.minutes,
    rating: (a, b) => overall(b) - overall(a),
  };
  return rooms.sort(sorters[c.sort ?? "rating"]);
}

function placeLabel(c) {
  if (!c.zones) return null;
  const zones = c.zones.map((id) => ZONES.find((z) => z.id === id));
  const cities = [...new Set(zones.map((z) => z.city))];
  if (zones.length === 1) return `${zones[0].name}, ${zones[0].city}`;
  if (cities.length === 1) return cities[0];
  return cities.join(" y ");
}

// ---------- Conversación ----------

let memory = {}; // criterios acumulados de la conversación
let lastShown = []; // últimos cuartos mostrados (para "¿y más barato?")
let lastSort = "rating"; // cómo estaba ordenada la última lista
let lastRelaxed = false; // la última respuesta tuvo que quitar filtros

function respond(text) {
  const p = parse(text);
  const hasCriteria = Object.keys(p.criteria).length > 0 || p.anywhere;

  if (p.reset) {
    memory = {};
    lastShown = [];
    lastRelaxed = false;
    if (!hasCriteria) return { text: "Listo, empezamos de nuevo. ¿Qué estás buscando?", chips: EXAMPLES };
  }
  if (!hasCriteria) {
    if (p.unknownPlace)
      return {
        text: `Todavía no tengo cuartos en “${esc(p.unknownPlace)}”. Por ahora busco en ${CITIES.join(", ")}. ¿Te sirve alguna?`,
        chips: CITIES.map((c) => `Cuartos en ${c}`),
      };
    if (p.thanks) return { text: "¡Con gusto! Si quieres, afina la búsqueda o pídeme otra ciudad." };
    if (p.greeting || p.help || !Object.keys(memory).length)
      return {
        text: `Puedo buscar por ciudad o universidad, presupuesto, tipo de cuarto y detalles como baño propio, silencio, buen internet o sin alertas. Tengo cuartos en ${CITIES.join(", ")}.`,
        chips: EXAMPLES,
      };
    return {
      text: "No entendí bien. Prueba diciéndome una ciudad, un presupuesto o algo que necesites, por ejemplo “baño propio” o “tranquilo”.",
      chips: EXAMPLES.slice(0, 2),
    };
  }

  // ¿Es un seguimiento ("¿y más barato?", "¿y en Monterrey?", "sin alertas") o una búsqueda nueva?
  const onlyPlace = Object.keys(p.criteria).length === 1 && p.criteria.zones;
  const isFollowUp = p.followUp || onlyPlace || !p.criteria.zones;
  // Si lo anterior no tuvo coincidencias exactas, el seguimiento solo conserva el lugar
  // ("en cualquier ciudad" sí conserva todo lo pedido, solo quita el lugar)
  const base = lastRelaxed && !p.anywhere ? (memory.zones ? { zones: memory.zones } : {}) : memory;
  memory = isFollowUp ? { ...base, ...p.criteria } : { ...p.criteria };
  if (p.criteria.maxPrice && memory.minPrice > p.criteria.maxPrice) delete memory.minPrice;
  if (p.anywhere && !p.criteria.zones) delete memory.zones;

  // "Más barato": busca por debajo de lo más barato que ya se mostró
  // Si la lista anterior no estaba ordenada por precio, basta con ordenarla (sort ya viene en los criterios)
  if (p.cheaper && lastShown.length && (lastSort === "price" || lastShown.length === 1)) {
    const floor = Math.min(...lastShown.map((r) => r.priceReal));
    const cheaper = run({ ...memory, maxPrice: floor - 1 });
    if (!cheaper.length) {
      const where = placeLabel(memory);
      return {
        text: `“${esc(lastShown.find((r) => r.priceReal === floor).title)}” (${pesos(floor)} al mes) ya es lo más económico que tengo${where ? ` en ${where}` : ""} con lo que pediste. Puedo buscar en otra zona o quitar algún filtro.`,
        chips: CITIES.filter((ci) => !where?.includes(ci)).slice(0, 2).map((ci) => `Cuartos en ${ci}`).concat("Nueva búsqueda"),
      };
    }
    memory.maxPrice = floor - 1;
  }
  const c = memory;

  const pieces = Object.keys(LABELS).filter((k) => c[k] !== undefined).map((k) => LABELS[k](c));
  const where = placeLabel(c);
  const understood = [where, ...pieces].filter(Boolean);

  let rooms = run(c);
  let note = "";

  if (!rooms.length) {
    // Relaja filtros uno por uno (acumulando) hasta encontrar algo; la zona nunca se quita
    const relaxed = { ...c };
    const dropped = [];
    for (const key of RELAX_ORDER) {
      if (relaxed[key] === undefined) continue;
      dropped.push(LABELS[key](c));
      delete relaxed[key];
      const found = run(relaxed);
      if (!found.length) continue;
      rooms = found;
      if (dropped.length === 1 && key === "maxPrice") {
        const cheapest = Math.min(...found.map((r) => r.priceReal));
        note = `No encontré nada por ${pesos(c.maxPrice)} o menos${where ? ` en ${where}` : ""}. Lo más económico que cumple lo demás cuesta ${pesos(cheapest)} al mes:`;
      } else {
        const list = dropped.map((d) => `“${d}”`).join(dropped.length > 2 ? ", " : " y ");
        note = `Ningún cuarto cumple todo a la vez. Sin ${list}, hay ${plural(found.length, "opción", "opciones")}:`;
      }
      break;
    }
    if (!rooms.length) {
      return {
        text: `No encontré cuartos${where ? ` en ${where}` : ""} con esas condiciones. Prueba con otra ciudad o menos filtros.`,
        understood,
        chips: ["Nueva búsqueda"],
      };
    }
  }

  const shown = rooms.slice(0, MAX_SHOWN);
  lastShown = shown;
  lastSort = c.sort ?? "rating";
  lastRelaxed = Boolean(note);
  const top = shown[0];
  let intro;
  if (note) intro = note;
  else {
    const cities = new Set(rooms.map((r) => zoneOf(r).city));
    const lugar = where ? ` en ${where}` : cities.size > 1 ? ` en ${plural(cities.size, "ciudad", "ciudades")}` : ` en ${[...cities][0]}`;
    intro = `Encontré ${plural(rooms.length, "cuarto", "cuartos")}${lugar}.`;
    if (rooms.length > 1) {
      if (c.sort === "price") intro += ` El más barato es “${esc(top.title)}” por ${pesos(top.priceReal)} al mes.`;
      else if (c.sort === "distance") intro += ` El más cercano está a ${top.minutes} min ${esc(top.mode)}.`;
      else intro += ` El mejor calificado es “${esc(top.title)}” con ${overall(top).toFixed(1)} estrellas.`;
    }
  }
  // Si en la zona pedida no hay nada exacto, ¿lo hay en otra ciudad?
  const elsewhere = note && c.zones ? run({ ...c, zones: undefined }) : [];
  const alerts = shown.filter((r) => r.alert).length;
  const outro = [
    elsewhere.length
      ? `En otras zonas sí hay ${plural(elsewhere.length, "cuarto que cumple", "cuartos que cumplen")} todo: ${[...new Set(elsewhere.map((r) => zoneOf(r).name + ", " + zoneOf(r).city))].slice(0, 3).join("; ")}.`
      : "",
    alerts && !c.safe ? `Ojo: ${alerts === 1 ? "uno tiene" : `${alerts} tienen`} alerta de la comunidad. Revisa su ficha antes de pagar.` : "",
    rooms.length > MAX_SHOWN ? `Te muestro los ${MAX_SHOWN} primeros; dime un presupuesto o una zona para afinar.` : "",
  ].filter(Boolean);

  const chips = elsewhere.length ? ["En cualquier ciudad", ...followUps(c).slice(0, 2)] : followUps(c);
  return { text: intro, understood, rooms: shown, outro, chips };
}

const EXAMPLES = [
  "Cerca de la UNAM por menos de 5 mil",
  "Cuarto individual en Guadalajara",
  "Algo tranquilo con baño propio",
  "Con recorrido 360",
];

function followUps(c) {
  const out = [];
  if (c.sort !== "price") out.push("¿Y más barato?");
  if (!c.safe) out.push("Solo sin alertas");
  if (!c.privateBath) out.push("Con baño propio");
  out.push("Nueva búsqueda");
  return out.slice(0, 3);
}

// ---------- Interfaz del chat ----------

function roomRow(r) {
  const z = zoneOf(r);
  return `
    <li>
      <button type="button" data-room="${r.id}" class="flex w-full cursor-pointer gap-3 rounded-2xl bg-surface p-2 text-left ring-1 ring-line transition-colors hover:bg-accent-soft">
        <img src="${r.img}" alt="" width="80" height="64" loading="lazy" class="h-16 w-20 shrink-0 rounded-xl object-cover" />
        <span class="min-w-0 flex-1">
          <span class="block truncate text-sm font-semibold">${esc(r.title)}</span>
          <span class="block truncate text-xs text-muted">${esc(z.name)}, ${esc(z.city)}</span>
          <span class="mt-1 flex flex-wrap items-center gap-x-2 text-xs">
            <span class="font-display font-semibold">${pesos(r.priceReal)}</span>
            <span class="flex items-center gap-0.5"><i class="ph-fill ph-star text-accent" aria-hidden="true"></i>${overall(r).toFixed(1)}</span>
            ${r.tour360 ? `<span class="flex items-center gap-0.5 text-accent"><i class="ph ph-cube-focus" aria-hidden="true"></i>360°</span>` : ""}
            ${r.alert ? `<span class="flex items-center gap-0.5 text-warn"><i class="ph ph-warning" aria-hidden="true"></i>Alerta</span>` : ""}
          </span>
        </span>
      </button>
    </li>`;
}

function addMessage(html, from) {
  const li = document.createElement("li");
  li.className = from === "user" ? "flex justify-end" : "flex gap-2";
  li.innerHTML =
    from === "user"
      ? `<p class="max-w-[85%] rounded-2xl rounded-br-md bg-accent px-4 py-2.5 text-[15px] text-accent-ink">${html}</p>`
      : `<span class="mt-1 grid size-7 shrink-0 place-items-center rounded-full bg-accent-soft text-accent" aria-hidden="true"><i class="ph ph-sparkle"></i></span>
         <div class="min-w-0 flex-1 space-y-3 rounded-2xl rounded-tl-md bg-surface-2 px-4 py-3 text-[15px] leading-relaxed">${html}</div>`;
  log.appendChild(li);
  if (!reduceMotion) animate(li, { opacity: [0, 1], y: [8, 0] }, { duration: 0.3, ease });
  log.scrollTop = log.scrollHeight;
  return li;
}

function botHTML(reply) {
  return [
    `<p>${reply.text}</p>`,
    reply.understood?.length
      ? `<p class="flex flex-wrap gap-1.5" aria-label="Lo que entendí">${reply.understood.map((u) => `<span class="rounded-full bg-surface px-2.5 py-1 text-xs ring-1 ring-line">${esc(u)}</span>`).join("")}</p>`
      : "",
    reply.rooms?.length ? `<ul class="grid grid-cols-[minmax(0,1fr)] gap-2">${reply.rooms.map(roomRow).join("")}</ul>` : "",
    ...(reply.outro ?? []).map((o) => `<p class="text-sm text-muted">${o}</p>`),
    reply.chips?.length
      ? `<div class="flex flex-wrap gap-1.5">${reply.chips.map((ch) => `<button type="button" data-say="${esc(ch)}" class="cursor-pointer rounded-full bg-surface px-3 py-1.5 text-sm text-accent ring-1 ring-accent/30 transition-colors hover:bg-accent-soft">${esc(ch)}</button>`).join("")}</div>`
      : "",
  ].join("");
}

let busy = false;
async function send(text) {
  text = text.trim();
  if (!text || busy) return;
  busy = true;
  input.value = "";
  addMessage(esc(text), "user");

  const typing = addMessage(
    `<span class="flex items-center gap-1 py-1" role="status" aria-label="Escribiendo">
      ${[0, 1, 2].map((i) => `<span class="size-2 rounded-full bg-muted/60 motion-safe:animate-bounce" style="animation-delay:${i * 150}ms"></span>`).join("")}
    </span>`,
    "bot",
  );
  const reply = text === "Nueva búsqueda" ? respond("nueva busqueda") : respond(text);
  await new Promise((r) => setTimeout(r, reduceMotion ? 0 : 450 + Math.random() * 400));
  typing.remove();
  addMessage(botHTML(reply), "bot");
  busy = false;
  if (isTouch) input.blur();
  else input.focus();
}

log.addEventListener("click", (e) => {
  const room = e.target.closest("[data-room]");
  if (room) return openRoom(room.dataset.room);
  const say = e.target.closest("[data-say]");
  if (say) send(say.dataset.say);
});

form.addEventListener("submit", (e) => {
  e.preventDefault();
  send(input.value);
});

resetBtn.addEventListener("click", () => {
  memory = {};
  lastShown = [];
  log.innerHTML = "";
  greet();
  if (!isTouch) input.focus();
});

function greet() {
  addMessage(
    botHTML({
      text: "¡Hola! Soy el asistente de búsqueda. Cuéntame qué cuarto necesitas y te muestro lo que hay disponible.",
      chips: EXAMPLES,
    }),
    "bot",
  );
}

// Abrir y cerrar el panel
function setOpen(open) {
  panel.classList.toggle("hidden", !open);
  panel.classList.toggle("flex", open);
  launcher.setAttribute("aria-expanded", String(open));
  launcher.querySelector("[data-icon]").className = `ph ${open ? "ph-x" : "ph-chat-circle-dots"} text-xl`;
  // En celular el chat es de pantalla completa: la página de atrás no debe moverse
  document.documentElement.style.overflow = open && isSmall.matches ? "hidden" : "";
  if (open) {
    if (!log.children.length) greet();
    // En celular solo se desliza (sin transparencia), así nunca se ve la página a través del chat
    if (!reduceMotion)
      isSmall.matches
        ? animate(panel, { y: ["6%", "0%"] }, { duration: 0.25, ease })
        : animate(panel, { opacity: [0, 1], y: [16, 0] }, { duration: 0.3, ease });
    log.scrollTop = log.scrollHeight;
    if (!isTouch) input.focus();
  }
}

closeBtn.addEventListener("click", () => {
  setOpen(false);
  launcher.focus();
});

// Cuando aparece o se oculta el teclado del celular, mantiene visible lo último de la conversación
window.visualViewport?.addEventListener("resize", () => {
  if (!panel.classList.contains("hidden")) log.scrollTop = log.scrollHeight;
});

launcher.addEventListener("click", () => setOpen(panel.classList.contains("hidden")));
panel.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    setOpen(false);
    launcher.focus();
  }
});
