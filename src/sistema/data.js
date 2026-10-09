// Datos HIPOTÉTICOS para la demo. Zonas y universidades reales como referencia,
// pero cuartos, caseros, precios y reseñas son inventados.

// Fotos de los cuartos: src/assets/cuartos/<ciudad>/<zona>-<número>.jpg
// Para cambiar la foto de un cuarto, reemplaza el archivo con el mismo nombre.
const FOTOS = import.meta.glob("../assets/cuartos/*/*.jpg", { eager: true, import: "default" });
const foto = (ruta) => {
  const url = FOTOS[`../assets/cuartos/${ruta}`];
  if (!url) console.error(`Falta la foto src/assets/cuartos/${ruta}`);
  return url;
};

export const ZONES = [
  {
    id: "gdl-olimpica",
    coords: [20.64586, -103.33038], // colonia (OpenStreetMap)
    uniCoords: [20.65958, -103.32393], // campus
    name: "Colonia Olímpica",
    city: "Guadalajara",
    state: "Jalisco",
    country: "México",
    university: "UdeG CUCEI",
    aliases: ["udg", "udeg", "cucei", "guadalajara", "gdl", "olimpica"],
    currency: "$",
    guide: {
      rent: 3900,
      transport: "Tren ligero y rutas al campus a 5 min",
      food: "Comida corrida desde $75",
      laundry: "Lavandería a $90 la carga",
      safety: 3.6,
    },
    alerts: ["Anuncios que piden depósito por transferencia antes de la visita."],
  },
  {
    id: "gdl-granja",
    coords: [20.67942, -103.44816], // colonia (OpenStreetMap)
    uniCoords: [20.73974, -103.38169], // campus
    name: "Ciudad Granja",
    city: "Guadalajara",
    state: "Jalisco",
    country: "México",
    university: "UdeG CUCEA",
    aliases: ["udg", "udeg", "cucea", "guadalajara", "gdl", "zapopan"],
    currency: "$",
    guide: {
      rent: 4300,
      transport: "Camión directo al campus en 15 min",
      food: "Fondas y mercado a 2 cuadras",
      laundry: "Lavandería a $85 la carga",
      safety: 3.9,
    },
    alerts: [],
  },
  {
    id: "pue-san-manuel",
    coords: [19.00732, -98.19948], // colonia (OpenStreetMap)
    uniCoords: [18.99216, -98.2015], // campus
    name: "San Manuel",
    city: "Puebla",
    state: "Puebla",
    country: "México",
    university: "BUAP Ciudad Universitaria",
    aliases: ["buap", "cu", "puebla"],
    currency: "$",
    guide: {
      rent: 3400,
      transport: "Caminando a CU en 10 min",
      food: "Cocinas económicas desde $65",
      laundry: "Lavandería a $70 la carga",
      safety: 3.4,
    },
    alerts: [
      "Fotos repetidas en varios anuncios de la calle 14 Sur.",
      "Cobro de “cuota de mantenimiento” no incluida en el anuncio.",
    ],
  },
  {
    id: "pue-cholula",
    coords: [19.02205, -98.28727], // colonia (OpenStreetMap)
    uniCoords: [19.05446, -98.28497], // campus
    name: "San Andrés Cholula",
    city: "Puebla",
    state: "Puebla",
    country: "México",
    university: "UDLAP",
    aliases: ["udlap", "cholula", "puebla"],
    currency: "$",
    guide: {
      rent: 4800,
      transport: "Bici o caminando al campus en 12 min",
      food: "Muchas opciones, algo más caras",
      laundry: "Lavandería a $95 la carga",
      safety: 4.1,
    },
    alerts: [],
  },
  {
    id: "cdmx-copilco",
    coords: [19.33967, -99.18557], // colonia (OpenStreetMap)
    uniCoords: [19.32155, -99.18492], // campus
    name: "Copilco",
    city: "Ciudad de México",
    state: "Ciudad de México",
    country: "México",
    university: "UNAM Ciudad Universitaria",
    aliases: ["unam", "cu", "copilco", "coyoacan", "cdmx", "ciudad de mexico", "df"],
    currency: "$",
    guide: {
      rent: 4500,
      transport: "Metro Copilco y caminando a CU en 10 min",
      food: "Comida corrida desde $80",
      laundry: "Lavandería a $100 la carga",
      safety: 3.6,
    },
    alerts: ["Caseros que piden 3 meses de depósito para “apartar” el cuarto."],
  },
  {
    id: "cdmx-lindavista",
    coords: [19.48806, -99.13507], // colonia (OpenStreetMap)
    uniCoords: [19.49956, -99.13813], // campus
    name: "Lindavista",
    city: "Ciudad de México",
    state: "Ciudad de México",
    country: "México",
    university: "IPN Zacatenco",
    aliases: ["ipn", "poli", "politecnico", "zacatenco", "lindavista", "cdmx", "ciudad de mexico", "df"],
    currency: "$",
    guide: {
      rent: 4300,
      transport: "Caminando o en camión a Zacatenco en 12 min",
      food: "Fondas y mercado de la colonia",
      laundry: "Lavandería a $95 la carga",
      safety: 3.8,
    },
    alerts: [],
  },
  {
    id: "mty-tecnologico",
    coords: [25.64885, -100.29377], // colonia (OpenStreetMap)
    uniCoords: [25.65073, -100.28932], // campus
    name: "Colonia Tecnológico",
    city: "Monterrey",
    state: "Nuevo León",
    country: "México",
    university: "Tec de Monterrey",
    aliases: ["tec", "itesm", "tec de monterrey", "tecnologico", "monterrey", "nuevo leon", "mty"],
    currency: "$",
    guide: {
      rent: 9500,
      transport: "Caminando al Tec en 8 min",
      food: "Muchas opciones, precios altos",
      laundry: "Lavandería a $110 la carga",
      safety: 4.0,
    },
    alerts: ["Rentas que suben cada semestre sin aviso previo."],
  },
  {
    id: "mty-anahuac",
    coords: [25.71926, -100.28242], // colonia (OpenStreetMap)
    uniCoords: [25.72637, -100.31231], // campus
    name: "Anáhuac, San Nicolás",
    city: "Monterrey",
    state: "Nuevo León",
    country: "México",
    university: "UANL Ciudad Universitaria",
    aliases: ["uanl", "anahuac", "san nicolas", "monterrey", "nuevo leon", "mty"],
    currency: "$",
    guide: {
      rent: 5800,
      transport: "Caminando a CU de la UANL en 10 min",
      food: "Taquerías y comida corrida desde $80",
      laundry: "Lavandería a $90 la carga",
      safety: 3.9,
    },
    alerts: [],
  },
  {
    id: "xal-zona-uv",
    coords: [19.51775, -96.91653], // colonia (OpenStreetMap)
    uniCoords: [19.51016, -96.91615], // campus
    name: "Zona Universitaria",
    city: "Xalapa",
    state: "Veracruz",
    country: "México",
    university: "Universidad Veracruzana",
    aliases: ["uv", "universidad veracruzana", "zona uv", "xalapa", "veracruz"],
    currency: "$",
    guide: {
      rent: 3300,
      transport: "Caminando a la Zona UV en 10 min",
      food: "Comida corrida desde $65",
      laundry: "Lavandería a $75 la carga",
      safety: 3.7,
    },
    alerts: ["Cuartos anunciados como “amueblados” que llegan vacíos."],
  },
];

const r = (author, career, stay, text) => ({ author, career, stay, text });

export const ROOMS = [
  // Colonia Olímpica
  {
    id: "r1", zone: "gdl-olimpica", img: foto("guadalajara/colonia-olimpica-1.jpg"),
    title: "Cuarto individual con escritorio",
    type: "individual", minutes: 6, mode: "caminando",
    priceAd: 3500, priceReal: 3850, includes: ["Agua", "Internet"],
    scores: { limpieza: 4.5, casero: 4.6, ruido: 3.8, internet: 4.2, seguridad: 3.9 },
    deposit: "devuelto", landlord: "Doña Lupita",
    alert: null,
    reviews: [
      r("Andrea M.", "Ing. Química", "2 semestres", "Doña Lupita es muy atenta y el cuarto es tal cual las fotos. La luz se paga aparte."),
      r("Bruno T.", "Informática", "1 año", "Buen internet para clases en línea. Se escucha la calle en la mañana."),
    ],
  },
  {
    id: "r2", zone: "gdl-olimpica", img: foto("guadalajara/colonia-olimpica-2.jpg"),
    title: "Cuarto en casa compartida con 4 estudiantes",
    type: "compartido", minutes: 9, mode: "caminando",
    priceAd: 2600, priceReal: 2900, includes: ["Agua", "Luz", "Internet"],
    scores: { limpieza: 3.4, casero: 3.9, ruido: 2.8, internet: 3.5, seguridad: 3.6 },
    deposit: "parcial", landlord: "Sr. Ramírez",
    alert: null,
    reviews: [
      r("Kevin L.", "Ing. Civil", "1 semestre", "Barato y cerca, pero los fines de semana hay fiesta. Descontaron $400 del depósito por pintura."),
    ],
  },
  {
    id: "r3", zone: "gdl-olimpica", img: foto("guadalajara/colonia-olimpica-3.jpg"),
    title: "Departamento pequeño para 2",
    type: "departamento", minutes: 12, mode: "en camión",
    priceAd: 7500, priceReal: 8300, includes: ["Agua"],
    scores: { limpieza: 4.0, casero: 2.9, ruido: 4.1, internet: 3.0, seguridad: 3.8 },
    deposit: "no", landlord: "Inmobiliaria Arcos",
    alert: "Dos estudiantes reportan que no devolvieron el depósito al salir.",
    reviews: [
      r("Sofía R.", "Biomédica", "1 año", "El depa está bien, pero al salir no nos regresaron el depósito y dejaron de contestar."),
    ],
  },

  // Ciudad Granja
  {
    id: "r4", zone: "gdl-granja", img: foto("guadalajara/ciudad-granja-1.jpg"),
    title: "Cuarto con baño propio en casa familiar",
    type: "individual", minutes: 15, mode: "en camión",
    priceAd: 4200, priceReal: 4200, includes: ["Agua", "Luz", "Internet", "Lavadora"],
    scores: { limpieza: 4.8, casero: 4.7, ruido: 4.5, internet: 4.0, seguridad: 4.3 },
    deposit: "devuelto", landlord: "Familia Cuevas",
    alert: null,
    reviews: [
      r("Mariana O.", "Contaduría", "3 semestres", "Se siente como casa. Todo incluido, sin cobros extra. Hay reglas de visitas."),
    ],
  },
  {
    id: "r5", zone: "gdl-granja", img: foto("guadalajara/ciudad-granja-2.jpg"),
    title: "Cuarto en depa compartido con 2 roomies",
    type: "compartido", minutes: 18, mode: "en camión",
    priceAd: 3300, priceReal: 3700, includes: ["Agua"],
    scores: { limpieza: 3.9, casero: 3.5, ruido: 3.9, internet: 3.7, seguridad: 4.0 },
    deposit: "devuelto", landlord: "Sra. Orozco",
    alert: null,
    reviews: [
      r("Diego P.", "Negocios", "1 año", "Buen ambiente con los roomies. El precio real sube por luz y gas."),
    ],
  },

  // San Manuel
  {
    id: "r6", zone: "pue-san-manuel", img: foto("puebla/san-manuel-1.jpg"),
    title: "Cuarto individual cerca de CU",
    type: "individual", minutes: 7, mode: "caminando",
    priceAd: 2800, priceReal: 3150, includes: ["Agua", "Internet"],
    scores: { limpieza: 4.1, casero: 4.3, ruido: 3.5, internet: 3.9, seguridad: 3.4 },
    deposit: "devuelto", landlord: "Sr. Tlapale",
    alert: null,
    reviews: [
      r("Itzel G.", "Medicina", "2 semestres", "Muy cerca de CU. De noche es mejor regresar acompañada por la calle de atrás."),
    ],
  },
  {
    id: "r7", zone: "pue-san-manuel", img: foto("puebla/san-manuel-2.jpg"),
    title: "Cuarto amueblado en edificio de estudiantes",
    type: "compartido", minutes: 5, mode: "caminando",
    priceAd: 2500, priceReal: 3100, includes: ["Agua"],
    scores: { limpieza: 3.0, casero: 2.6, ruido: 2.9, internet: 2.8, seguridad: 3.2 },
    deposit: "parcial", landlord: "Administración Torre 14",
    alert: "El anuncio usa fotos de otro edificio. Reportado 3 veces.",
    reviews: [
      r("Luis A.", "Derecho", "1 semestre", "No se parecía a las fotos y cobran una cuota de mantenimiento que no mencionaron."),
    ],
  },
  {
    id: "r8", zone: "pue-san-manuel", img: foto("puebla/san-manuel-3.jpg"),
    title: "Departamento para 3 con patio",
    type: "departamento", minutes: 11, mode: "caminando",
    priceAd: 8400, priceReal: 8900, includes: ["Agua"],
    scores: { limpieza: 4.2, casero: 4.0, ruido: 4.2, internet: 3.6, seguridad: 3.7 },
    deposit: "devuelto", landlord: "Sra. Méndez",
    alert: null,
    reviews: [
      r("Fernanda C.", "Arquitectura", "1 año", "Dividido entre 3 sale barato. El patio es perfecto para maquetas."),
    ],
  },

  // San Andrés Cholula
  {
    id: "r9", zone: "pue-cholula", img: foto("puebla/san-andres-cholula-1.jpg"),
    title: "Estudio independiente",
    type: "departamento", minutes: 12, mode: "en bici",
    priceAd: 8500, priceReal: 9200, includes: ["Agua", "Internet"],
    scores: { limpieza: 4.6, casero: 4.4, ruido: 4.4, internet: 4.5, seguridad: 4.3 },
    deposit: "devuelto", landlord: "Sr. Aguilar",
    alert: null,
    reviews: [
      r("Emilio V.", "Animación", "2 semestres", "Tranquilo y con buen internet. Se agradece tener cocina propia."),
    ],
  },
  {
    id: "r10", zone: "pue-cholula", img: foto("puebla/san-andres-cholula-2.jpg"),
    title: "Cuarto en casa con 3 estudiantes",
    type: "compartido", minutes: 10, mode: "caminando",
    priceAd: 4000, priceReal: 4350, includes: ["Agua", "Luz"],
    scores: { limpieza: 4.0, casero: 4.2, ruido: 3.6, internet: 3.8, seguridad: 4.0 },
    deposit: "devuelto", landlord: "Sra. Huerta",
    alert: null,
    reviews: [
      r("Camila N.", "Relaciones Internacionales", "1 año", "Casa bonita y la dueña resuelve rápido cualquier falla."),
    ],
  },

  // Copilco
  {
    id: "r11", zone: "cdmx-copilco", img: foto("cdmx/copilco-1.jpg"),
    // Recorrido 360° (panorama parcial: cubre unos 210° de ancho)
    tour360: {
      src: foto("cdmx/copilco-1-360.jpg"),
      still: foto("cdmx/copilco-1-360-inicio.jpg"),
      projection: "equirect",
      haov: 210,
      start: { u: 0.5, pitch: -5, fov: 72 },
      hotspots: [
        { id: "cama", u: 0.48, v: 0.77, icon: "ph-bed", title: "Cama matrimonial", text: "Base tapizada y colchón de 2024. Buró y lámpara de cada lado." },
        { id: "balcon", u: 0.26, v: 0.49, icon: "ph-frame-corners", title: "Balcón", text: "Puerta doble al balcón con vista al jardín. Entra mucha luz en la mañana." },
        { id: "comoda", u: 0.49, v: 0.52, icon: "ph-archive", title: "Cómoda y espejo", text: "Cómoda de 3 cajones para ropa doblada, con espejo redondo." },
        { id: "puerta", u: 0.567, v: 0.47, icon: "ph-door-open", title: "Puerta al pasillo", text: "El baño compartido está a tres pasos, al fondo del pasillo." },
        { id: "buro", u: 0.81, v: 0.7, icon: "ph-lamp", title: "Buró con lámpara", text: "Contacto doble junto a la cama para cargar el celular y la laptop." },
      ],
    },
    title: "Habitación individual con baño compartido",
    type: "individual", minutes: 10, mode: "caminando",
    priceAd: 4200, priceReal: 4600, includes: ["Agua", "Internet"],
    scores: { limpieza: 4.3, casero: 4.1, ruido: 3.9, internet: 4.0, seguridad: 3.9 },
    deposit: "devuelto", landlord: "Sra. Chávez",
    alert: null,
    reviews: [
      r("Daniela Q.", "Economía", "1 año", "Barrio tranquilo, la señora es estricta con los horarios pero justa."),
    ],
  },
  {
    id: "r12", zone: "cdmx-copilco", img: foto("cdmx/copilco-2.jpg"),
    title: "Estudio amueblado",
    type: "departamento", minutes: 12, mode: "en Metro",
    priceAd: 7800, priceReal: 8400, includes: ["Agua"],
    scores: { limpieza: 4.0, casero: 3.1, ruido: 4.0, internet: 3.4, seguridad: 4.0 },
    deposit: null, landlord: "Sr. Paredes",
    alert: "Pide 3 meses de depósito por adelantado.",
    reviews: [
      r("Jorge H.", "Ingeniería Industrial", "1 semestre", "Lindo estudio, pero el depósito que pidió fue altísimo. Aún no sé si lo devolverá."),
    ],
  },

  // Colonia Tecnológico
  {
    id: "r13", zone: "mty-tecnologico", img: foto("monterrey/colonia-tecnologico-1.jpg"),
    title: "Estudio cerca del Tec",
    type: "departamento", minutes: 8, mode: "caminando",
    priceAd: 11500, priceReal: 12300, includes: ["Mantenimiento"],
    scores: { limpieza: 4.2, casero: 3.8, ruido: 3.0, internet: 4.1, seguridad: 3.6 },
    deposit: "devuelto", landlord: "Inmobiliaria Norte",
    alert: null,
    reviews: [
      r("Joaquín R.", "Medicina", "2 años", "Ubicación ideal. La cuota de mantenimiento sube seguido, pregunta antes de firmar."),
    ],
  },
  {
    id: "r14", zone: "mty-tecnologico", img: foto("monterrey/colonia-tecnologico-2.jpg"),
    title: "Habitación en departamento compartido",
    type: "compartido", minutes: 9, mode: "caminando",
    priceAd: 8000, priceReal: 8800, includes: ["Internet"],
    scores: { limpieza: 3.6, casero: 3.2, ruido: 2.7, internet: 3.8, seguridad: 3.5 },
    deposit: "parcial", landlord: "Sr. Ferreyra",
    alert: "Subió el precio dos veces en 6 meses sin aviso.",
    reviews: [
      r("Valentina S.", "Psicología", "1 año", "Barato para la zona, pero el dueño cambia el precio cuando quiere."),
    ],
  },

  // Anáhuac
  {
    id: "r15", zone: "mty-anahuac", img: foto("monterrey/anahuac-san-nicolas-1.jpg"),
    title: "Habitación en casa con patio",
    type: "individual", minutes: 10, mode: "caminando",
    priceAd: 5500, priceReal: 5800, includes: ["Luz", "Internet"],
    scores: { limpieza: 4.4, casero: 4.6, ruido: 4.5, internet: 3.9, seguridad: 4.0 },
    deposit: "devuelto", landlord: "Familia Bustos",
    alert: null,
    reviews: [
      r("Tomás G.", "Derecho", "3 semestres", "Lejos pero súper tranquilo. Los dueños son muy buena gente."),
    ],
  },

  // Zona Universitaria, Xalapa
  {
    id: "r16", zone: "xal-zona-uv", img: foto("xalapa/zona-universitaria-1.jpg"),
    title: "Habitación en casa antigua",
    type: "individual", minutes: 12, mode: "caminando",
    priceAd: 3000, priceReal: 3200, includes: ["Servicios"],
    scores: { limpieza: 4.1, casero: 4.3, ruido: 3.7, internet: 3.6, seguridad: 3.5 },
    deposit: "devuelto", landlord: "Sra. Pinzón",
    alert: null,
    reviews: [
      r("Natalia B.", "Sociología", "1 año", "La casa es fría pero la señora es muy amable. A pie a la Zona UV."),
    ],
  },
  {
    id: "r17", zone: "xal-zona-uv", img: foto("xalapa/zona-universitaria-2.jpg"),
    title: "Habitación “amueblada” en departamento",
    type: "compartido", minutes: 14, mode: "en camión",
    priceAd: 2800, priceReal: 3000, includes: ["Internet"],
    scores: { limpieza: 3.2, casero: 2.5, ruido: 3.3, internet: 3.9, seguridad: 3.4 },
    deposit: "no", landlord: "Sr. Castaño",
    alert: "Se anunció amueblada y la entregaron sin cama ni escritorio.",
    reviews: [
      r("Sebastián M.", "Artes", "1 semestre", "Llegué y no había muebles. Tuve que comprar colchón la primera noche."),
    ],
  },

  // Lindavista
  {
    id: "r18", zone: "cdmx-lindavista", img: foto("cdmx/lindavista-1.jpg"),
    title: "Habitación con baño privado",
    type: "individual", minutes: 12, mode: "caminando",
    priceAd: 4800, priceReal: 5000, includes: ["Servicios", "Internet"],
    scores: { limpieza: 4.7, casero: 4.5, ruido: 3.4, internet: 4.6, seguridad: 3.9 },
    deposit: "devuelto", landlord: "Sra. Rincón",
    alert: null,
    reviews: [
      r("Laura E.", "Comunicación", "2 semestres", "Cerquita del Poli y muy limpio. La calle es ruidosa los viernes."),
    ],
  },
];
