// Landing (index.html): presentación del producto hasta preguntas frecuentes y lista de espera.
// La búsqueda de cuartos vive aparte, en buscar.html (src/sistema/).
import { animate, scroll } from "motion";
import { reduceMotion, ease } from "../compartido/base.js";
import { openTour, TOUR_ESTUDIO_GDL } from "../compartido/tour.js";
import "./hero.js";
import "./animaciones.js";
import "./armado.js";

// Parallax al hacer scroll (progreso 0 cuando el elemento asoma abajo, 1 cuando sale arriba).
// data-parallax-img: la foto se mueve más lento que su marco (va un poco agrandada para no dejar huecos).
// data-parallax="px": el elemento se desplaza esa distancia; negativo = sube más rápido que la página.
if (!reduceMotion) {
  const range = { offset: ["start end", "end start"] };
  document.querySelectorAll("[data-parallax-img]").forEach((img) => {
    scroll(animate(img, { y: ["-8%", "8%"], scale: [1.18, 1.18] }, { ease: "linear" }), { ...range, target: img.parentElement });
  });
  document.querySelectorAll("[data-parallax]").forEach((el) => {
    const d = Number(el.dataset.parallax) || 0;
    scroll(animate(el, { y: [-d, d] }, { ease: "linear" }), { ...range, target: el.parentElement });
  });
}

// Tarjeta de la sección "Rentar a ciegas": abre el recorrido 360°
const openBtn = document.getElementById("tour-open");
openBtn.addEventListener("click", () => openTour(TOUR_ESTUDIO_GDL, document.getElementById("tour-thumb")));
// Precarga three.js cuando el usuario muestra intención
openBtn.addEventListener("pointerenter", () => import("three"), { once: true });

// Preguntas frecuentes (acordeón)
document.querySelectorAll(".faq-item").forEach((item) => {
  const btn = item.querySelector("button");
  btn.addEventListener("click", () => {
    const open = item.dataset.open !== "true";
    item.dataset.open = String(open);
    btn.setAttribute("aria-expanded", String(open));
  });
});

// Carrusel de testimonios
const track = document.getElementById("testimonios");
document.querySelectorAll("[data-scroll]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const card = track.querySelector("li");
    const step = card.offsetWidth + 20;
    track.scrollBy({ left: step * Number(btn.dataset.scroll), behavior: reduceMotion ? "auto" : "smooth" });
  });
});

// Lista de espera: validación en el cliente y envío simulado (no hay backend)
const form = document.getElementById("form-lista");
const success = document.getElementById("form-exito");
const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const setError = (input, message) => {
  const error = document.getElementById(`${input.id}-error`);
  input.setAttribute("aria-invalid", message ? "true" : "false");
  error.textContent = message;
  error.classList.toggle("hidden", !message);
};

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const { correo, ciudad } = form.elements;

  const correoMsg = !correo.value.trim()
    ? "Escribe tu correo."
    : !emailRe.test(correo.value.trim())
      ? "Revisa tu correo, parece que le falta algo."
      : "";
  const ciudadMsg = ciudad.value.trim() ? "" : "Dinos a qué ciudad te mudas.";
  setError(correo, correoMsg);
  setError(ciudad, ciudadMsg);
  if (correoMsg || ciudadMsg) {
    (correoMsg ? correo : ciudad).focus();
    return;
  }

  const submit = form.querySelector("button[type=submit]");
  submit.disabled = true;
  submit.querySelector("[data-label]").textContent = "Enviando...";
  await new Promise((r) => setTimeout(r, 900));

  success.querySelector("[data-ciudad]").textContent = ciudad.value.trim();
  form.classList.add("hidden");
  success.classList.replace("hidden", "flex");
  success.focus();
  if (!reduceMotion) {
    animate(success, { opacity: [0, 1], y: [12, 0] }, { duration: 0.5, ease });
    celebrarCheck();
  }
});

// Check animado: se dibuja el aro, se rellena, aparece la palomita y salen chispas
function celebrarCheck() {
  const check = document.getElementById("exito-check");
  const aro = check.querySelector("[data-aro]");
  const fondo = check.querySelector("[data-fondo]");
  const palomita = check.querySelector("[data-palomita]");
  const chispas = check.querySelector("[data-chispas]");

  animate(aro, { pathLength: [0, 1] }, { duration: 0.6, delay: 0.15, ease: "easeInOut" });
  animate(fondo, { scale: [0, 1] }, { duration: 0.45, delay: 0.65, ease: [0.34, 1.56, 0.64, 1] });
  animate(palomita, { pathLength: [0, 1] }, { duration: 0.4, delay: 0.85, ease: "easeOut" });
  animate(check, { scale: [1, 1.12, 1] }, { duration: 0.4, delay: 1.2, ease });
  animate(check.querySelector("[data-onda]"), { scale: [1, 2], opacity: [0.9, 0] }, { duration: 0.8, delay: 1.2, ease: "easeOut" });

  // Chispas en colores de la marca que salen en círculo
  const colores = ["var(--accent)", "var(--success)", "#ffb400", "var(--accent)"];
  chispas.replaceChildren();
  for (let i = 0; i < 10; i++) {
    const ang = (i / 10) * Math.PI * 2;
    const dist = 46 + (i % 3) * 8;
    const c = document.createElement("span");
    c.className = "absolute left-1/2 top-1/2 -ml-1 -mt-1 size-2 rounded-full";
    c.style.background = colores[i % colores.length];
    chispas.append(c);
    animate(
      c,
      { x: [0, Math.cos(ang) * dist], y: [0, Math.sin(ang) * dist], scale: [0, 1, 0], opacity: [1, 1, 0] },
      { duration: 0.8, delay: 1.2, ease: "easeOut" },
    );
  }
}

["correo", "ciudad"].forEach((id) => {
  const input = document.getElementById(id);
  input.addEventListener("input", () => input.getAttribute("aria-invalid") === "true" && setError(input, ""));
});
