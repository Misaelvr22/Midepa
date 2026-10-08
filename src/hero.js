// Hero con video: entrada al cargar y animación ligada al scroll.
// Al bajar, la cámara "entra" a la ciudad (zoom lento del video) mientras el marco
// se encoge un poco y el texto sube y se desvanece. Todo se desactiva con reduced motion.
import { animate, scroll, stagger } from "motion";

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const ease = [0.16, 1, 0.3, 1];

const hero = document.getElementById("hero");
const frame = document.getElementById("hero-frame");
const video = document.getElementById("hero-video");
const copy = document.getElementById("hero-copy");
const card = document.getElementById("hero-card");

// Video en loop continuo. Con reduced motion se queda quieto en el póster.
if (reduceMotion) {
  video.removeAttribute("autoplay");
  video.pause();
}

// No gastar batería decodificando video fuera de pantalla
new IntersectionObserver(([entry]) => {
  if (entry.isIntersecting && !reduceMotion) video.play().catch(() => {});
  else if (!entry.isIntersecting) video.pause();
}).observe(frame);

if (!reduceMotion) {
  // Entrada: el marco se abre y el texto aparece en secuencia
  animate(frame, { clipPath: ["inset(4% 3% round 2rem)", "inset(0% 0% round 2rem)"] }, { duration: 1.2, ease });
  animate(hero.querySelectorAll("[data-hero-in]"), { opacity: [0, 1], y: [24, 0] }, { duration: 0.8, delay: stagger(0.1, { startDelay: 0.35 }), ease });

  // Scroll: progreso 0 cuando el hero está arriba, 1 cuando ya salió de la pantalla
  const range = { target: hero, offset: ["start start", "end start"] };
  scroll(animate(video, { scale: [1.02, 1.25], y: ["0%", "6%"] }, { ease: "linear" }), range);
  scroll(animate(frame, { scale: [1, 0.94] }, { ease: "linear" }), range);
  scroll(animate(copy, { y: [0, -90], opacity: [1, 0] }, { ease: "linear" }), { target: hero, offset: ["start start", "0.7 start"] });
  scroll(animate(card, { y: [0, -160] }, { ease: "linear" }), range);
}
