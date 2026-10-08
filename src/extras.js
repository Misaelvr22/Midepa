// Animaciones extra (se pueden quitar borrando este archivo y su import en main.js):
// 1. Títulos [data-split] que se revelan palabra por palabra.
// 2. Línea de "Cómo funciona" que se llena con el scroll y enciende cada paso.
// 3. Contadores [data-count] (precio y calificación) que suben al aparecer.
// Con reduced motion no se hace nada y el contenido queda tal cual.
import { animate, inView, scroll, stagger } from "motion";

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const ease = [0.16, 1, 0.3, 1];

if (!reduceMotion) {
  // 1. Títulos palabra por palabra: cada palabra va en una máscara y sube desde abajo.
  // El lector de pantalla lee el título completo (aria-label), no las palabras sueltas.
  document.querySelectorAll("[data-split]").forEach((h) => {
    const words = h.textContent.trim().split(/\s+/);
    h.setAttribute("aria-label", words.join(" "));
    h.innerHTML = words
      .map((w) => `<span class="split-mask" aria-hidden="true"><span class="split-word">${w}</span></span>`)
      .join(" ");
    h.style.opacity = "1";
    inView(
      h,
      () => {
        animate(h.querySelectorAll(".split-word"), { y: ["110%", "0%"] }, { duration: 0.9, delay: stagger(0.06), ease });
      },
      { amount: 0.5 },
    );
  });

  // 2. Pasos: en escritorio la línea avanza con el scroll y cada círculo se enciende
  // cuando la línea lo alcanza. En celular (línea oculta) se encienden al aparecer.
  const pasos = document.querySelector("#como-funciona ol");
  const linea = document.getElementById("pasos-linea");
  const iconos = [...pasos.querySelectorAll(".paso-icono")];
  const encender = (icono, on) => {
    if (on === icono.hasAttribute("data-on")) return;
    icono.toggleAttribute("data-on", on);
    if (on) animate(icono, { scale: [0.8, 1.12, 1] }, { duration: 0.5, ease });
  };
  scroll(animate(linea, { scaleX: [0, 1] }, { ease: "linear" }), { target: pasos, offset: ["start 0.75", "start 0.3"] });
  scroll(
    (p) => {
      if (!linea.offsetParent) return;
      iconos.forEach((icono, i) => encender(icono, p >= i / (iconos.length - 1) - 0.02));
    },
    { target: pasos, offset: ["start 0.75", "start 0.3"] },
  );
  iconos.forEach((icono) => inView(icono, () => !linea.offsetParent && encender(icono, true), { amount: 1 }));

  // 3. Contadores: suben desde 0 y la estrella da un giro al terminar.
  const formato = (n, decimales) =>
    n.toLocaleString("es-MX", { minimumFractionDigits: decimales, maximumFractionDigits: decimales });
  document.querySelectorAll("[data-count]").forEach((el) => {
    const final = Number(el.dataset.count);
    const decimales = Number(el.dataset.decimals) || 0;
    const prefijo = el.dataset.prefix || "";
    const estrella = el.parentElement.querySelector("[data-star]");
    const enHero = el.closest("#hero");
    el.textContent = prefijo + formato(0, decimales);
    inView(
      el,
      () => {
        const delay = enHero ? 0.9 : 0.2;
        animate(0, final, {
          duration: 1.4,
          delay,
          ease,
          onUpdate: (v) => (el.textContent = prefijo + formato(v, decimales)),
        });
        if (estrella) animate(estrella, { scale: [0, 1.3, 1], rotate: [-90, 0] }, { duration: 0.7, delay: delay + 0.9, ease });
      },
      { amount: 1 },
    );
  });
}
