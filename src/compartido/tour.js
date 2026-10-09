// Recorrido interactivo de una habitación con three.js.
//
// Proyecciones que acepta un recorrido:
// - "equirect": foto panorámica equirectangular pegada por dentro de una esfera. Con
//   haov = 360 es una 360° completa; con menos grados es un panorama parcial y el giro se
//   limita al tramo que cubre la foto.
// - "flat": una foto normal (rectilínea) colocada como un plano frente a la cámara.
//
// Uso: openTour(config, elementoDeOrigen). La transición sale del rectángulo del elemento.
import { animate } from "motion";
import estudioGdl from "../assets/cuartos/guadalajara/colonia-olimpica-estudio-360.jpg";
import estudioGdlInicio from "../assets/cuartos/guadalajara/colonia-olimpica-estudio-360-inicio.jpg";

// Recorrido de la sección "Rentar a ciegas" (estudio en la Colonia Olímpica, Guadalajara)
export const TOUR_ESTUDIO_GDL = {
  title: "Estudio amueblado con cocineta",
  subtitle: "Colonia Olímpica, Guadalajara",
  src: estudioGdl,
  still: estudioGdlInicio, // vista plana desde la dirección inicial, para la transición
  projection: "equirect",
  haov: 360, // grados horizontales que cubre la foto
  start: { u: 0.47, pitch: -10, fov: 72 }, // u: posición horizontal (0 a 1) hacia donde mira al abrir
  minLat: -68, // debajo de -70° esta foto tiene una franja borrosa
  hotspots: [
    { id: "cama", u: 0.6, v: 0.7, icon: "ph-bed", title: "Cama matrimonial", text: "Colchón firme con 2 almohadas. Incluye sábanas y toallas al llegar." },
    { id: "escritorio", u: 0.32, v: 0.63, icon: "ph-desk", title: "Área de estudio", text: "Escritorio con monitor, cajonera y lámpara. Contactos a la altura de la mesa." },
    { id: "closet", u: 0.41, v: 0.5, icon: "ph-door", title: "Clóset con repisas", text: "Clóset alto de 2 puertas y repisas abiertas para libros y cajas." },
    { id: "cocineta", u: 0.76, v: 0.6, icon: "ph-cooking-pot", title: "Cocineta", text: "Tarja, parrilla de inducción, microondas, cafetera y frigobar." },
    { id: "ventana", u: 0.92, v: 0.44, icon: "ph-frame-corners", title: "Ventana a la calle", text: "Calle arbolada y tranquila. Entra luz natural casi todo el día." },
    { id: "entrada", u: 0.11, v: 0.54, icon: "ph-key", title: "Entrada", text: "Cerradura de seguridad y perchero junto a la puerta." },
  ],
};

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const isTouch = window.matchMedia("(pointer: coarse)").matches;
const ease = [0.16, 1, 0.3, 1];
const DEG = Math.PI / 180;
const MIN_FOV = 28;

const dialog = document.getElementById("tour");
const stage = document.getElementById("tour-stage");
const still = document.getElementById("tour-still");
const mount = document.getElementById("tour-canvas");
const layer = document.getElementById("tour-hotspots");
const hint = document.getElementById("tour-hint");
const titleEl = dialog.querySelector("[data-tour-title]");
const subtitleEl = dialog.querySelector("[data-tour-subtitle]");

let viewer = null; // se crea la primera vez que se abre
let closing = false;
let origin = null; // elemento desde el que se abrió (para la transición y el foco)

// ---------- Apertura y cierre con transición desde el elemento de origen ----------

const originInset = () => {
  const r = origin.getBoundingClientRect();
  return `inset(${r.top}px ${innerWidth - r.right}px ${innerHeight - r.bottom}px ${r.left}px round 24px)`;
};

export async function openTour(config, originEl) {
  if (dialog.open) return;
  origin = originEl;
  titleEl.textContent = config.title ?? "";
  subtitleEl.textContent = config.subtitle ?? "";
  dialog.setAttribute("aria-label", `Recorrido interactivo: ${config.title ?? "habitación"}`);
  if (isTouch) hint.querySelector("[data-hint-text]").textContent = "Desliza para mirar, pellizca para acercar";
  hint.classList.remove("opacity-0!");
  mount.style.opacity = "0";
  still.src = config.still ?? config.src;
  still.style.opacity = "1";
  dialog.showModal();
  document.documentElement.style.overflow = "hidden";

  if (!reduceMotion) {
    animate(stage, { clipPath: [originInset(), "inset(0px 0px 0px 0px round 0px)"] }, { duration: 0.7, ease });
    animate(dialog.querySelectorAll("[data-tour-ui]"), { opacity: [0, 1] }, { duration: 0.4, delay: 0.45 });
  }

  viewer ??= await createViewer();
  await viewer.load(config);
  if (!dialog.open) return; // se cerró mientras cargaba la foto
  viewer.start();
  mount.style.opacity = "1";
  setTimeout(() => (still.style.opacity = "0"), 500);
}

async function closeTour() {
  if (!dialog.open || closing) return;
  closing = true;
  viewer?.closePopover();
  if (!reduceMotion) {
    still.style.opacity = "1";
    mount.style.opacity = "0";
    animate(dialog.querySelectorAll("[data-tour-ui]"), { opacity: 0 }, { duration: 0.2 });
    // Tope de tiempo: si el navegador pausa las animaciones (pestaña oculta), igual se cierra
    await Promise.race([animate(stage, { clipPath: originInset() }, { duration: 0.55, ease }), new Promise((r) => setTimeout(r, 700))]);
  }
  viewer?.stop();
  dialog.close();
  stage.style.clipPath = "";
  // La animación de salida deja los controles en opacidad 0; se limpian para la próxima apertura
  dialog.querySelectorAll("[data-tour-ui]").forEach((el) => (el.style.opacity = ""));
  // Solo libera el scroll si no queda otra ventana abierta (p. ej. la ficha de un cuarto);
  // si queda una, lo libera cuando esa se cierre
  const other = document.querySelector("dialog[open]");
  if (!other) document.documentElement.style.overflow = "";
  else
    other.addEventListener(
      "close",
      () => {
        if (!document.querySelector("dialog[open]")) document.documentElement.style.overflow = "";
      },
      { once: true },
    );
  closing = false;
  (origin?.closest("button") ?? origin)?.focus?.();
}

dialog.addEventListener("cancel", (e) => {
  e.preventDefault(); // Escape: cerrar con animación
  if (viewer?.closePopover()) return; // primero cierra la ficha abierta, si hay
  closeTour();
});
dialog.querySelector('[data-tour="close"]').addEventListener("click", closeTour);

// ---------- Visor ----------

async function createViewer() {
  const THREE = await import("three");

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  mount.appendChild(renderer.domElement);
  renderer.domElement.style.display = "block";

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 2000);
  camera.rotation.order = "YXZ";
  const loader = new THREE.TextureLoader();

  // Recorrido cargado y su geometría
  let cfg = null;
  let mesh = null;
  let haov = 360, vaov = 180, maxLat = 90, minLat = -90;
  let planeW = 0, planeH = 0;
  const D = 100;
  let pointFor = () => new THREE.Vector3();

  async function load(config) {
    const texture = await loader.loadAsync(config.src);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
    const imgAspect = texture.image.width / texture.image.height;

    if (mesh) {
      scene.remove(mesh);
      mesh.geometry.dispose();
      mesh.material.map?.dispose();
      mesh.material.dispose();
    }
    cfg = config;

    if (cfg.projection === "flat") {
      planeW = 2 * D * Math.tan(((cfg.hfov ?? 90) / 2) * DEG);
      planeH = planeW / imgAspect;
      mesh = new THREE.Mesh(new THREE.PlaneGeometry(planeW, planeH), new THREE.MeshBasicMaterial({ map: texture }));
      mesh.position.z = -D;
      pointFor = ({ u, v }) => new THREE.Vector3((u - 0.5) * planeW, (0.5 - v) * planeH, -D);
    } else {
      haov = cfg.haov ?? 360;
      vaov = cfg.vaov ?? Math.min(180, haov / imgAspect); // píxeles cuadrados si no se indica
      maxLat = vaov / 2;
      minLat = Math.max(-vaov / 2, cfg.minLat ?? -90);
      const phiLen = haov * DEG;
      const thetaLen = vaov * DEG;
      const geo = new THREE.SphereGeometry(500, 96, 64, 0, phiLen, Math.PI / 2 - thetaLen / 2, thetaLen);
      geo.scale(-1, 1, 1);
      mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: texture }));
      mesh.rotation.y = phiLen / 2 - (3 * Math.PI) / 2; // el centro de la foto (u = 0.5) queda al frente
      pointFor = ({ u, v }) => {
        const lon = (u - 0.5) * haov * DEG;
        const lat = (0.5 - v) * vaov * DEG;
        return new THREE.Vector3(Math.sin(lon) * Math.cos(lat) * 400, Math.sin(lat) * 400, -Math.cos(lon) * Math.cos(lat) * 400);
      };
    }
    scene.add(mesh);
    buildHotspots(cfg.hotspots ?? []);
  }

  const isFull360 = () => cfg.projection !== "flat" && haov >= 360;

  // ¿La vista (yaw, pitch, fov) queda dentro de la foto? Revisa esquinas y bordes del encuadre.
  const probe = new THREE.PerspectiveCamera();
  probe.rotation.order = "YXZ";
  const ray = new THREE.Vector3();
  const PROBES = [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]];
  function fits(yaw, pitch, fov) {
    probe.fov = fov;
    probe.aspect = camera.aspect;
    probe.updateProjectionMatrix();
    probe.rotation.set(pitch * DEG, yaw * DEG, 0);
    probe.updateMatrixWorld();
    for (const [x, y] of PROBES) {
      ray.set(x, y, 0.5).unproject(probe).normalize();
      if (cfg.projection === "flat") {
        if (ray.z >= -1e-3) return false;
        const t = -D / ray.z;
        if (Math.abs(ray.x * t) > planeW / 2 + 0.01 || Math.abs(ray.y * t) > planeH / 2 + 0.01) return false;
      } else {
        const lat = Math.asin(Math.max(-1, Math.min(1, ray.y))) / DEG;
        if (lat > maxLat + 0.01 || lat < minLat - 0.01) return false;
        if (!isFull360() && Math.abs(Math.atan2(ray.x, -ray.z) / DEG) > haov / 2 + 0.01) return false;
      }
    }
    return true;
  }

  // Busca el valor más lejano permitido entre `from` (válido) y `to`
  function clampAxis(from, to, test) {
    if (test(to)) return to;
    let lo = from, hi = to;
    for (let i = 0; i < 18; i++) {
      const mid = (lo + hi) / 2;
      if (test(mid)) lo = mid;
      else hi = mid;
    }
    return lo;
  }

  let maxFov = 75;
  const computeMaxFov = () => {
    maxFov = clampAxis(10, cfg.projection === "flat" ? 120 : 100, (f) => fits(0, 0, f));
  };
  const homeFov = () => Math.min(cfg.start?.fov ?? 70, maxFov * 0.95);
  const homeYaw = () => (cfg.start ? -(cfg.start.u - 0.5) * (cfg.projection === "flat" ? 0 : haov) : 0);
  const homePitch = () => cfg.start?.pitch ?? 0;

  // Estado: valores objetivo y valores actuales (suavizados)
  const target = { yaw: 0, pitch: 0, fov: 60 };
  const view = { ...target };
  const velocity = { yaw: 0, pitch: 0 };

  function setView(yaw, pitch, fov = target.fov) {
    fov = Math.min(maxFov, Math.max(MIN_FOV, fov));
    // Si al alejar la vista ya no cabe, la acerca al centro de la foto lo necesario
    // (en una 360° completa el giro horizontal no tiene límite: solo se ajusta la inclinación)
    if (!fits(target.yaw, target.pitch, fov)) {
      const cy = isFull360() ? target.yaw : 0;
      const s = clampAxis(0, 1, (k) => fits(cy + (target.yaw - cy) * k, target.pitch * k, fov));
      target.yaw = cy + (target.yaw - cy) * s;
      target.pitch *= s;
    }
    target.fov = fov;
    const ny = clampAxis(target.yaw, yaw, (y) => fits(y, target.pitch, fov));
    const np = clampAxis(target.pitch, pitch, (p) => fits(ny, p, fov));
    const blockedYaw = ny !== yaw;
    const blockedPitch = np !== pitch;
    target.yaw = ny;
    target.pitch = np;
    return { blockedYaw, blockedPitch };
  }

  function resize() {
    const w = mount.clientWidth, h = mount.clientHeight;
    renderer.setSize(w, h, false);
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    computeMaxFov();
    setView(target.yaw, target.pitch, target.fov);
  }

  function reset(animated = true) {
    // En 360° completa toma el camino corto de vuelta a la vista inicial
    target.yaw = isFull360() ? homeYaw() + Math.round((target.yaw - homeYaw()) / 360) * 360 : homeYaw();
    target.pitch = homePitch();
    target.fov = homeFov();
    // Parte de un estado válido (centro) y avanza hasta la vista inicial permitida
    const want = { ...target };
    target.yaw = isFull360() ? want.yaw : 0;
    target.pitch = 0;
    setView(want.yaw, want.pitch, want.fov);
    velocity.yaw = velocity.pitch = 0;
    if (!animated) Object.assign(view, target);
  }

  // ---------- Entrada: arrastre, pellizco, rueda y teclado ----------
  const pointers = new Map();
  let pinchDist = 0;
  let lastMove = 0;
  let interacted = false;
  const el = renderer.domElement;

  const markInteracted = () => {
    if (interacted) return;
    interacted = true;
    hint.classList.add("opacity-0!"); // gana a la animación de entrada de los controles
  };
  const degPerPx = () => target.fov / mount.clientHeight;

  el.addEventListener("pointerdown", (e) => {
    try {
      el.setPointerCapture(e.pointerId);
    } catch {
      // puntero no capturable (p. ej. eventos sintéticos); el arrastre sigue funcionando
    }
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    velocity.yaw = velocity.pitch = 0;
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      pinchDist = Math.hypot(a.x - b.x, a.y - b.y);
    }
  });

  el.addEventListener("pointermove", (e) => {
    const prev = pointers.get(e.pointerId);
    if (!prev) return;
    const cur = { x: e.clientX, y: e.clientY };
    pointers.set(e.pointerId, cur);
    markInteracted();

    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      if (pinchDist) setView(target.yaw, target.pitch, target.fov * (pinchDist / dist));
      pinchDist = dist;
      return;
    }
    const k = degPerPx();
    const dYaw = (cur.x - prev.x) * k;
    const dPitch = (cur.y - prev.y) * k;
    setView(target.yaw + dYaw, target.pitch + dPitch);
    const now = performance.now();
    const dt = Math.max(1, now - lastMove);
    lastMove = now;
    velocity.yaw = (dYaw / dt) * 16;
    velocity.pitch = (dPitch / dt) * 16;
  });

  const release = (e) => {
    pointers.delete(e.pointerId);
    if (pointers.size < 2) pinchDist = 0;
    if (performance.now() - lastMove > 80 || reduceMotion) velocity.yaw = velocity.pitch = 0;
  };
  el.addEventListener("pointerup", release);
  el.addEventListener("pointercancel", release);

  el.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      markInteracted();
      setView(target.yaw, target.pitch, target.fov * (1 + Math.sign(e.deltaY) * Math.min(Math.abs(e.deltaY), 100) * 0.0015));
    },
    { passive: false },
  );

  const onKey = (e) => {
    if (!dialog.open || e.target.closest?.("[data-popover]")) return;
    const step = 4;
    const map = {
      ArrowLeft: () => setView(target.yaw + step, target.pitch),
      ArrowRight: () => setView(target.yaw - step, target.pitch),
      ArrowUp: () => setView(target.yaw, target.pitch + step),
      ArrowDown: () => setView(target.yaw, target.pitch - step),
      "+": () => setView(target.yaw, target.pitch, target.fov / 1.2),
      "=": () => setView(target.yaw, target.pitch, target.fov / 1.2),
      "-": () => setView(target.yaw, target.pitch, target.fov * 1.2),
      0: () => reset(),
    };
    if (map[e.key]) {
      e.preventDefault();
      markInteracted();
      map[e.key]();
    }
  };
  window.addEventListener("keydown", onKey);

  // Controles de la interfaz
  dialog.querySelector('[data-tour="zoom-in"]').addEventListener("click", () => setView(target.yaw, target.pitch, target.fov / 1.25));
  dialog.querySelector('[data-tour="zoom-out"]').addEventListener("click", () => setView(target.yaw, target.pitch, target.fov * 1.25));
  dialog.querySelector('[data-tour="reset"]').addEventListener("click", () => reset());

  // ---------- Hotspots ----------
  let hotspotsOn = true;
  let openSpot = null;
  let spots = [];

  const popover = document.createElement("div");
  popover.dataset.popover = "";
  popover.setAttribute("role", "dialog");
  popover.className = "pointer-events-auto absolute left-0 top-0 hidden w-72 rounded-2xl bg-white p-5 text-ink shadow-soft";
  layer.appendChild(popover);

  function buildHotspots(list) {
    closePopover();
    spots.forEach((s) => s.btn.remove());
    spots = list.map((h) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className =
        "group/spot pointer-events-auto absolute left-0 top-0 flex cursor-pointer items-center gap-2 rounded-full bg-white/95 p-1.5 pr-1.5 text-ink shadow-soft transition-[padding] duration-300 hover:pr-3.5 focus-visible:pr-3.5 aria-expanded:pr-3.5";
      btn.setAttribute("aria-expanded", "false");
      btn.setAttribute("aria-label", h.title);
      btn.innerHTML = `
        <span class="relative grid size-8 place-items-center rounded-full bg-accent text-accent-ink">
          <span class="absolute inset-0 rounded-full bg-accent/40 motion-safe:animate-ping [animation-duration:2.4s]" aria-hidden="true"></span>
          <i class="ph ${h.icon} relative text-base" aria-hidden="true"></i>
        </span>
        <span class="max-w-0 overflow-hidden whitespace-nowrap text-sm font-medium transition-[max-width] duration-300 group-hover/spot:max-w-40 group-focus-visible/spot:max-w-40 group-aria-expanded/spot:max-w-40">${h.title}</span>`;
      layer.insertBefore(btn, popover);
      const spot = { ...h, btn, pos: pointFor(h), x: 0, y: 0, visible: false };
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        togglePopover(spot);
      });
      return spot;
    });
  }

  function togglePopover(spot) {
    if (openSpot === spot) return closePopover();
    closePopover();
    openSpot = spot;
    spot.btn.setAttribute("aria-expanded", "true");
    popover.setAttribute("aria-label", spot.title);
    popover.innerHTML = `
      <div class="flex items-start justify-between gap-3">
        <p class="flex items-center gap-2 font-display text-lg font-semibold"><i class="ph ${spot.icon} text-accent" aria-hidden="true"></i>${spot.title}</p>
        <button type="button" data-close class="-mr-2 -mt-2 grid size-9 shrink-0 cursor-pointer place-items-center rounded-full hover:bg-surface-2" aria-label="Cerrar información"><i class="ph ph-x" aria-hidden="true"></i></button>
      </div>
      <p class="mt-2 text-[15px] leading-relaxed text-muted">${spot.text}</p>`;
    popover.querySelector("[data-close]").addEventListener("click", () => {
      closePopover();
      spot.btn.focus();
    });
    popover.classList.remove("hidden");
    if (!reduceMotion) animate(popover, { opacity: [0, 1], scale: [0.96, 1] }, { duration: 0.25, ease });
  }

  function closePopover() {
    if (!openSpot) return false;
    openSpot.btn.setAttribute("aria-expanded", "false");
    openSpot = null;
    popover.classList.add("hidden");
    return true;
  }
  el.addEventListener("pointerdown", () => closePopover());

  const hotspotBtn = dialog.querySelector('[data-tour="hotspots"]');
  hotspotBtn.addEventListener("click", () => {
    hotspotsOn = !hotspotsOn;
    if (!hotspotsOn) closePopover();
    layer.style.display = hotspotsOn ? "" : "none";
    hotspotBtn.setAttribute("aria-pressed", String(hotspotsOn));
    hotspotBtn.setAttribute("aria-label", hotspotsOn ? "Ocultar puntos de información" : "Mostrar puntos de información");
    hotspotBtn.querySelector("i").className = `ph ${hotspotsOn ? "ph-eye" : "ph-eye-slash"} text-lg`;
  });

  const tmp = new THREE.Vector3();
  function placeHotspots() {
    if (!hotspotsOn) return;
    const w = mount.clientWidth, h = mount.clientHeight;
    for (const s of spots) {
      tmp.copy(s.pos).project(camera);
      s.visible = tmp.z < 1 && Math.abs(tmp.x) < 1.05 && Math.abs(tmp.y) < 1.05;
      s.x = ((tmp.x + 1) / 2) * w;
      s.y = ((1 - tmp.y) / 2) * h;
      s.btn.style.transform = `translate(${s.x - 22}px, ${s.y - 22}px)`;
      s.btn.style.visibility = s.visible ? "visible" : "hidden";
    }
    if (openSpot) {
      const pw = popover.offsetWidth, ph = popover.offsetHeight;
      let px = openSpot.x + 28, py = openSpot.y - ph / 2;
      if (px + pw > w - 16) px = openSpot.x - pw - 28;
      px = Math.max(16, Math.min(px, w - pw - 16));
      py = Math.max(80, Math.min(py, h - ph - 16));
      popover.style.transform = `translate(${px}px, ${py}px)`;
      popover.style.visibility = openSpot.visible ? "visible" : "hidden";
    }
  }

  // ---------- Bucle de render ----------
  let raf = 0;
  function frame() {
    raf = requestAnimationFrame(frame);
    if (!pointers.size && (Math.abs(velocity.yaw) > 0.001 || Math.abs(velocity.pitch) > 0.001)) {
      const { blockedYaw, blockedPitch } = setView(target.yaw + velocity.yaw, target.pitch + velocity.pitch);
      velocity.yaw = blockedYaw ? 0 : velocity.yaw * 0.92;
      velocity.pitch = blockedPitch ? 0 : velocity.pitch * 0.92;
    }
    const k = reduceMotion ? 1 : 0.18;
    view.yaw += (target.yaw - view.yaw) * k;
    view.pitch += (target.pitch - view.pitch) * k;
    view.fov += (target.fov - view.fov) * k;
    camera.fov = view.fov;
    camera.updateProjectionMatrix();
    camera.rotation.set(view.pitch * DEG, view.yaw * DEG, 0);
    renderer.render(scene, camera);
    placeHotspots();
  }

  const ro = new ResizeObserver(resize);

  return {
    load,
    start() {
      ro.observe(mount);
      target.yaw = target.pitch = 0;
      resize();
      reset(false);
      // Entrada suave: empieza un poco más cerca y se abre a la vista inicial
      if (!reduceMotion) view.fov = Math.max(MIN_FOV, target.fov * 0.8);
      interacted = false;
      cancelAnimationFrame(raf);
      frame();
    },
    stop() {
      cancelAnimationFrame(raf);
      ro.disconnect();
    },
    closePopover,
  };
}
