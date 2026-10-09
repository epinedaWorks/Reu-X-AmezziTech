import type { Flujo, Infografia, Mapa, Minuta } from "./esquemas";

// Reunión ficticia para probar la app sin subir archivos.
export const REUNION_EJEMPLO = `[00:00] Hablante 1: Buenos días a todos, gracias por conectarse. Soy Laura Méndez y hoy vamos a revisar el lanzamiento del nuevo portal de clientes. Están Carlos de tecnología, Ana de mercadeo y Jorge de atención al cliente.

[00:21] Hablante 2: Buenos días Laura. Carlos aquí. Del lado técnico el portal está al noventa por ciento. Nos falta terminar la integración con el sistema de pagos y hacer las pruebas de carga.

[00:40] Hablante 1: ¿Cuánto tiempo necesitan para eso, Carlos?

[00:44] Hablante 2: Dos semanas para la integración de pagos. Las pruebas de carga las podemos hacer en paralelo la segunda semana.

[01:02] Hablante 3: Ana de mercadeo. Nosotros necesitamos al menos diez días antes del lanzamiento para preparar la campaña en redes y el correo a clientes. Si el portal sale el 15 de noviembre, empezamos el 5.

[01:20] Hablante 4: Jorge, de atención al cliente. Mi preocupación es la capacitación del equipo. Necesitamos un manual y al menos dos sesiones de entrenamiento antes de abrir el portal.

[01:38] Hablante 1: Muy bien. Entonces propongo que la fecha de lanzamiento sea el 15 de noviembre, siempre y cuando las pruebas de carga salgan bien. Si fallan, movemos el lanzamiento una semana. ¿Están de acuerdo?

[01:52] Hablante 2: De acuerdo.

[01:54] Hablante 3: De acuerdo.

[01:55] Hablante 4: Sí, de acuerdo.

[02:00] Hablante 1: Perfecto. Carlos, tú te encargas de la integración de pagos y de las pruebas de carga, con fecha 30 de octubre. Ana, la campaña lista para el 5 de noviembre. Jorge, el manual y las capacitaciones para el 10 de noviembre. Yo voy a confirmar con dirección el presupuesto de la campaña.

[02:25] Hablante 4: Una pregunta, ¿vamos a tener un chat de soporte dentro del portal desde el primer día?

[02:31] Hablante 1: Eso todavía no está decidido. Lo dejamos pendiente para la próxima reunión. Nos vemos el próximo jueves a las 9 para revisar avances. Gracias a todos.`;

// Resultado fijo para REUX_LLM=demo (sirve para probar la interfaz sin modelo).
export const MINUTA_EJEMPLO: Minuta = {
  titulo: "Revisión del lanzamiento del portal de clientes",
  fecha: "",
  hora: "",
  lugar: "Reunión virtual",
  participantes: [
    { nombre: "Laura Méndez", rol: "Coordinadora de la reunión" },
    { nombre: "Carlos", rol: "Tecnología" },
    { nombre: "Ana", rol: "Mercadeo" },
    { nombre: "Jorge", rol: "Atención al cliente" },
  ],
  objetivo: "Revisar el avance y definir la fecha de lanzamiento del nuevo portal de clientes.",
  resumen_ejecutivo:
    "Se revisó el estado del nuevo portal de clientes, que se encuentra al 90 % de avance técnico. Se acordó lanzarlo el 15 de noviembre, condicionado al resultado de las pruebas de carga. Cada área asumió tareas con fechas definidas y quedó pendiente decidir si habrá chat de soporte desde el primer día.",
  agenda: ["Avance técnico del portal", "Plan de mercadeo", "Capacitación de atención al cliente", "Fecha de lanzamiento"],
  temas: [
    {
      titulo: "Avance técnico",
      resumen: "Carlos informó que el portal está al 90 % y detalló el trabajo restante.",
      puntos: ["Falta la integración con el sistema de pagos", "Las pruebas de carga se harán en paralelo", "Se estimaron dos semanas de trabajo"],
    },
    {
      titulo: "Campaña de mercadeo",
      resumen: "Ana indicó los tiempos que necesita mercadeo antes del lanzamiento.",
      puntos: ["Se requieren diez días previos al lanzamiento", "Campaña en redes sociales y correo a clientes"],
    },
    {
      titulo: "Capacitación de atención al cliente",
      resumen: "Jorge señaló la necesidad de preparar al equipo de soporte.",
      puntos: ["Elaborar un manual del portal", "Realizar al menos dos sesiones de entrenamiento"],
    },
  ],
  acuerdos: [
    "Lanzar el portal el 15 de noviembre si las pruebas de carga son satisfactorias.",
    "Si las pruebas de carga fallan, el lanzamiento se moverá una semana.",
  ],
  tareas: [
    { tarea: "Completar la integración de pagos y las pruebas de carga", responsable: "Carlos", fecha_limite: "30 de octubre" },
    { tarea: "Tener lista la campaña de lanzamiento", responsable: "Ana", fecha_limite: "5 de noviembre" },
    { tarea: "Preparar el manual y las capacitaciones", responsable: "Jorge", fecha_limite: "10 de noviembre" },
    { tarea: "Confirmar con dirección el presupuesto de la campaña", responsable: "Laura Méndez", fecha_limite: "" },
  ],
  pendientes: ["Definir si el portal tendrá chat de soporte desde el primer día."],
  proxima_reunion: "Próximo jueves a las 9:00 para revisar avances.",
};

export const FLUJO_EJEMPLO: Flujo = {
  titulo: "Lanzamiento del portal",
  nodos: [
    { id: "n1", texto: "Portal al 90 %", tipo: "inicio" },
    { id: "n2", texto: "Integrar sistema de pagos", tipo: "proceso" },
    { id: "n3", texto: "Pruebas de carga", tipo: "proceso" },
    { id: "n4", texto: "¿Pruebas satisfactorias?", tipo: "decision" },
    { id: "n5", texto: "Mover lanzamiento una semana", tipo: "proceso" },
    { id: "n6", texto: "Campaña de mercadeo desde 5 nov", tipo: "proceso" },
    { id: "n7", texto: "Capacitar a atención al cliente", tipo: "proceso" },
    { id: "n8", texto: "Lanzamiento 15 de noviembre", tipo: "fin" },
  ],
  conexiones: [
    { desde: "n1", hacia: "n2", etiqueta: "" },
    { desde: "n2", hacia: "n3", etiqueta: "" },
    { desde: "n3", hacia: "n4", etiqueta: "" },
    { desde: "n4", hacia: "n6", etiqueta: "Sí" },
    { desde: "n4", hacia: "n5", etiqueta: "No" },
    { desde: "n5", hacia: "n3", etiqueta: "Reintentar" },
    { desde: "n6", hacia: "n7", etiqueta: "" },
    { desde: "n7", hacia: "n8", etiqueta: "" },
  ],
};

export const MAPA_EJEMPLO: Mapa = {
  centro: "Lanzamiento del portal de clientes",
  ramas: [
    {
      titulo: "Avance técnico",
      icono: "tecnologia",
      ideas: [
        { texto: "Portal al 90 %", detalles: [] },
        { texto: "Integración de pagos", detalles: ["Dos semanas", "Carlos"] },
        { texto: "Pruebas de carga en paralelo", detalles: [] },
      ],
    },
    {
      titulo: "Mercadeo",
      icono: "comunicacion",
      ideas: [
        { texto: "Campaña en redes", detalles: ["Desde el 5 de noviembre"] },
        { texto: "Correo a clientes", detalles: [] },
      ],
    },
    {
      titulo: "Atención al cliente",
      icono: "personas",
      ideas: [
        { texto: "Manual del portal", detalles: [] },
        { texto: "Dos capacitaciones", detalles: ["Antes del 10 de noviembre"] },
      ],
    },
    {
      titulo: "Acuerdos",
      icono: "acuerdo",
      ideas: [
        { texto: "Lanzamiento 15 de noviembre", detalles: ["Si las pruebas pasan"] },
        { texto: "Si fallan, una semana después", detalles: [] },
      ],
    },
    {
      titulo: "Pendientes",
      icono: "pregunta",
      ideas: [
        { texto: "¿Chat de soporte el primer día?", detalles: [] },
        { texto: "Presupuesto de campaña", detalles: ["Laura confirma con dirección"] },
      ],
    },
  ],
};

export const INFOGRAFIA_EJEMPLO: Infografia = {
  titulo: "Nuevo portal de clientes",
  subtitulo: "Plan de lanzamiento y responsables por área",
  evento: "",
  frase_clave: "El portal está al 90 % y saldrá el 15 de noviembre si las pruebas de carga son exitosas.",
  bloques: [
    {
      titulo: "Avance técnico",
      icono: "tecnologia",
      texto: "Tecnología completará la integración de pagos y las pruebas de carga en las próximas dos semanas.",
      puntos: ["Integración con el sistema de pagos", "Pruebas de carga en paralelo", "Entrega el 30 de octubre"],
    },
    {
      titulo: "Campaña de lanzamiento",
      icono: "comunicacion",
      texto: "Mercadeo necesita diez días antes del lanzamiento para preparar la comunicación.",
      puntos: ["Campaña en redes sociales", "Correo a clientes", "Arranca el 5 de noviembre"],
    },
    {
      titulo: "Equipo de soporte",
      icono: "personas",
      texto: "Atención al cliente se preparará con un manual y capacitaciones antes de abrir el portal.",
      puntos: ["Manual del portal", "Dos sesiones de entrenamiento"],
    },
    {
      titulo: "Siguientes pasos",
      icono: "meta",
      texto: "Laura confirmará el presupuesto y en la próxima reunión se decidirá sobre el chat de soporte.",
      puntos: ["Presupuesto con dirección", "Decisión sobre chat de soporte"],
    },
  ],
  cifras: [
    { valor: "90 %", etiqueta: "de avance técnico" },
    { valor: "15 nov", etiqueta: "fecha de lanzamiento" },
    { valor: "4", etiqueta: "áreas involucradas" },
  ],
  destacados: [
    { texto: "Pruebas de carga", icono: "alerta" },
    { texto: "Pagos integrados", icono: "dinero" },
    { texto: "Equipo capacitado", icono: "personas" },
    { texto: "Lanzamiento 15 nov", icono: "fecha" },
  ],
  conclusion:
    "El lanzamiento del portal está encaminado: cada área tiene tareas y fechas claras, y la única condición es que las pruebas de carga salgan bien.",
};
