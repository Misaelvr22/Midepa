// Lo que comparten la landing (index.html) y el sistema (buscar.html):
// fuentes, iconos, nombre de marca, menú móvil, entrada de secciones y títulos palabra por palabra.
import "@fontsource-variable/outfit";
import "@fontsource-variable/work-sans";
import "@phosphor-icons/web/regular";
import "@phosphor-icons/web/fill";

import { animate, inView, stagger } from "motion";
import { BRAND_NAME } from "./config.js";

export const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
export const ease = [0.16, 1, 0.3, 1];

// Nombre de marca en un solo lugar (src/compartido/config.js)
document.querySelectorAll("[data-brand]").forEach((el) => (el.textContent = BRAND_NAME));
document.title = document.title.replace("[Nombre]", BRAND_NAME);

if (!reduceMotion) {
  // Entrada de secciones al aparecer en pantalla (jerarquía de lectura)
  inView(
    "[data-reveal]",
    (el) => {
      const i = Number(getComputedStyle(el).getPropertyValue("--i")) || 0;
      animate(el, { opacity: [0, 1], y: [24, 0] }, { duration: 0.7, delay: i * 0.08, ease });
    },
    { amount: 0.2 },
  );

  // Títulos [data-split]: cada palabra va en una máscara y sube desde abajo.
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
}

// Menú móvil
const menuBtn = document.getElementById("menu-btn");
const menu = document.getElementById("menu-movil");
const setMenu = (open) => {
  menu.classList.toggle("hidden", !open);
  menuBtn.setAttribute("aria-expanded", String(open));
  menuBtn.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
  menuBtn.querySelector("i").className = `ph ${open ? "ph-x" : "ph-list"} text-2xl`;
};
menuBtn.addEventListener("click", () => setMenu(menu.classList.contains("hidden")));
menu.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => setMenu(false)));
document.addEventListener("keydown", (e) => e.key === "Escape" && setMenu(false));
