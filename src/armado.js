// Presentación "la casa se arma": sección fija mientras se hace scroll.
// 1. Las piezas llegan volando a la vista explosionada y aparecen sus etiquetas.
// 2. Las piezas se juntan y la casa queda armada.
// 3. La cámara entra por el frente abierto y se funde con la foto de la recámara.
// Las piezas salen de src/assets/explode/gemini2.jpeg (recortadas, coordenadas en px de esa imagen).
// Con reduced motion se queda quieta en la vista explosionada con etiquetas.
import { scroll } from "motion";

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const section = document.getElementById("armado");
const stage = document.getElementById("armado-stage");
const house = document.getElementById("armado-casa");
const bg = document.getElementById("armado-fondo");
const interior = document.getElementById("armado-interior");
const scrim = document.getElementById("armado-velo");
const captions = [...section.querySelectorAll("[data-armado-caption]")];

const urls = import.meta.glob("./assets/armado/*.webp", { eager: true, query: "?url", import: "default" });
const url = (id) => urls[`./assets/armado/${id}.webp`];

// Tamaño de la imagen original y centro de la casa
const W = 2528;
const H = 1686;
const CX = 1290;
const CY = 800;

// x, y, w, h: caja en la imagen original. a: desplazamiento ya armada. far: de dónde llega.
// t: momento (0 a 1 dentro de la fase) en que empieza a moverse. z: orden de capas.
const PIECES = [
  { id: "modulo", x: 720, y: 465, w: 734, h: 721, a: [0, 0], far: [0, 260], t: 0, z: 5 },
  { id: "cimentacion", x: 738, y: 1301, w: 1016, h: 263, a: [0, -95], far: [0, 700], t: 0.1, z: 1 },
  { id: "piso", x: 710, y: 1163, w: 1041, h: 208, a: [0, -25], far: [0, 560], t: 0.18, z: 2 },
  { id: "muro-izq", x: 174, y: 421, w: 320, h: 759, a: [190, 0], far: [-1100, 0], t: 0.26, z: 4 },
  { id: "estructura", x: 490, y: 427, w: 94, h: 748, a: [150, 0], far: [-900, -120], t: 0.32, z: 3 },
  { id: "yeso", x: 580, y: 437, w: 68, h: 733, a: [100, 0], far: [-800, 120], t: 0.36, z: 3 },
  { id: "aislamiento", x: 644, y: 442, w: 80, h: 727, a: [55, 0], far: [-700, -60], t: 0.4, z: 3 },
  { id: "puerta", x: 1450, y: 508, w: 367, h: 701, a: [-30, 0], far: [900, 80], t: 0.3, z: 6 },
  { id: "ventana", x: 1813, y: 563, w: 165, h: 595, a: [-150, 0], far: [1000, -80], t: 0.36, z: 4 },
  { id: "muro-der", x: 1974, y: 465, w: 450, h: 699, a: [-200, 0], far: [1200, 0], t: 0.42, z: 5 },
  { id: "cielo", x: 645, y: 278, w: 1096, h: 211, a: [0, 25], far: [0, -650], t: 0.5, z: 7 },
  { id: "techo", x: 524, y: 33, w: 1341, h: 356, a: [0, 115], far: [0, -800], t: 0.58, z: 8 },
];

// Etiquetas: punto de anclaje en la imagen original y hacia dónde sale el texto
const LABELS = [
  { piece: "techo", x: 1880, y: 130, side: "right", text: "Cubierta de concreto y vigas de madera" },
  { piece: "cielo", x: 630, y: 360, side: "left", text: "Cielo falso de yeso" },
  { piece: "muro-izq", x: 330, y: 1205, side: "bottom", text: "Muro exterior y aislamiento térmico" },
  { piece: "puerta", x: 1630, y: 480, side: "top", text: "Cancel de aluminio y vidrio templado" },
  { piece: "muro-der", x: 2200, y: 440, side: "top", text: "Muro de estuco" },
  { piece: "piso", x: 1770, y: 1250, side: "right", text: "Piso de porcelanato" },
  { piece: "cimentacion", x: 1770, y: 1470, side: "right", text: "Cimentación de concreto" },
];

// Fases del scroll (progreso 0 a 1 de toda la sección)
const PH = {
  llegan: [0.04, 0.3],
  etiquetas: [0.2, 0.44],
  arman: [0.44, 0.62],
  entra: [0.64, 0.92],
  interior: [0.8, 0.9],
};

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const range = (p, [a, b]) => clamp((p - a) / (b - a));
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOut = (t) => 1 - Math.pow(1 - t, 3);
const lerp = (a, b, t) => a + (b - a) * t;
const pct = (v, total) => `${(v / total) * 100}%`;

// Construir piezas
const nodes = {};
for (const pc of PIECES) {
  const img = document.createElement("img");
  img.src = url(pc.id);
  img.alt = "";
  img.decoding = "async";
  img.draggable = false;
  img.className = "armado-pieza";
  Object.assign(img.style, { left: pct(pc.x, W), top: pct(pc.y, H), width: pct(pc.w, W), zIndex: pc.z });
  house.append(img);
  nodes[pc.id] = img;
}
const labelNodes = LABELS.map((lb) => {
  const el = document.createElement("span");
  el.className = "armado-etiqueta";
  el.dataset.side = lb.side;
  el.textContent = lb.text;
  Object.assign(el.style, { left: pct(lb.x, W), top: pct(lb.y, H) });
  house.append(el);
  return el;
});

// La casa ocupa el ancho disponible sin pasarse de alto; en celular se agranda y se recortan los lados
let s = 1;
function layout() {
  const vw = stage.clientWidth;
  const vh = stage.clientHeight;
  let w = Math.min(vw * 0.98, (vh * 0.86 * W) / H);
  if (vw < 640) w = Math.max(w, vw * 1.55);
  s = w / W;
  house.style.width = `${w}px`;
  house.style.height = `${(w * H) / W}px`;
}

// Posición de cada pieza según el progreso
function offsetOf(pc, p) {
  const llega = range(p, PH.llegan);
  const arma = range(p, PH.arman);
  // Cada pieza entra con su propio retraso dentro de la fase
  const tl = easeOut(clamp((llega - pc.t * 0.6) / 0.4));
  const ta = easeInOut(clamp((arma - pc.t * 0.35) / 0.65));
  const x = lerp(pc.far[0], 0, tl) + pc.a[0] * ta;
  const y = lerp(pc.far[1], 0, tl) + pc.a[1] * ta;
  return { x, y, o: clamp(tl * 1.6) };
}

// Punto de la recámara al que entra la cámara (px de la imagen original, ya armada)
const DOOR = [1110, 820];

function render(p) {
  for (const pc of PIECES) {
    const { x, y, o } = offsetOf(pc, p);
    const el = nodes[pc.id];
    el.style.transform = `translate3d(${x * s}px, ${y * s}px, 0)`;
    el.style.opacity = o;
  }

  // Etiquetas: aparecen una tras otra y se van antes de armar
  const e = range(p, PH.etiquetas);
  labelNodes.forEach((el, i) => {
    const pc = PIECES.find((q) => q.id === LABELS[i].piece);
    const { x, y } = offsetOf(pc, p);
    const on = clamp((e - i * 0.07) / 0.15) * (1 - clamp((e - 0.88) / 0.12));
    el.style.opacity = on;
    el.style.transform = `translate3d(${x * s}px, ${y * s + (1 - on) * 10}px, 0)`;
  });

  // Cámara: zoom hacia la recámara llevando ese punto al centro de la pantalla
  const t = easeInOut(range(p, PH.entra));
  const z = lerp(1, 5.5, t * t);
  const px = (DOOR[0] - W / 2) * s;
  const py = (DOOR[1] - H / 2) * s;
  house.style.transform = `translate(-50%, -50%) translate3d(${-px * z * t}px, ${-py * z * t}px, 0) scale(${z})`;
  house.style.filter = t > 0.55 ? `blur(${(t - 0.55) * 10}px)` : "";
  bg.style.transform = `scale(${1.04 + t * 0.5})`;
  bg.style.filter = `blur(${t * 6}px)`;

  // Recámara: se funde y se acomoda desde un poco más cerca
  const i = range(p, PH.interior);
  interior.style.opacity = i;
  interior.style.transform = `scale(${lerp(1.35, 1, easeOut(range(p, [0.8, 1])))})`;

  // Velo oscuro arriba para que el texto se lea sobre el cielo o la recámara
  scrim.style.opacity = 0.55 + 0.45 * range(p, [0.86, 0.95]);

  // Textos: cada uno vive en su tramo
  captions.forEach((c) => {
    const [a, b] = c.dataset.armadoCaption.split(",").map(Number);
    const fade = 0.04;
    const on = a === 0 ? 1 - clamp((p - b) / fade) : clamp((p - a) / fade) * (b >= 1 ? 1 : 1 - clamp((p - b) / fade));
    c.style.opacity = on;
    c.style.transform = `translateY(${(1 - on) * 16}px)`;
    c.inert = on < 0.5;
  });
}

let last = 0;
layout();
window.addEventListener("resize", () => {
  layout();
  render(last);
});

if (reduceMotion) {
  section.classList.add("armado-quieto");
  render(0.36);
} else {
  render(0);
  scroll(
    (p) => {
      last = p;
      render(p);
    },
    { target: section, offset: ["start start", "end end"] },
  );
}
