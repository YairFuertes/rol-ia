/**
 * El motor de resolucion (secciones 4.5, 4.6 y 5 del reglamento).
 *
 * Esto es lo que en el chat hacia el modelo "de cabeza" y hacia mal: un modelo
 * de lenguaje no tiene azar. Aca la tirada es real, los modificadores salen de
 * la ficha guardada y el grado se calcula. Al Director le llega el resultado ya
 * resuelto y solo le queda narrarlo, que es lo unico que sabe hacer mejor que
 * el codigo.
 */

import type { Dificultad, Grado, Nivel } from '../tipos.js';

/** Seccion 4.6 — modificadores por nivel. `nulo` no tira. */
export const MODIFICADOR_NIVEL: Record<Exclude<Nivel, 'nulo'>, number> = {
  flojo: -3,
  normal: 0,
  bueno: 3,
  excepcional: 6,
};

/** Seccion 4.6 — una especialidad aplicable suma esto. */
export const BONO_ESPECIALIDAD = 3;

/** Seccion 4.6 — dificultades. */
export const OBJETIVO: Record<Dificultad, number> = {
  rutinaria: 8,
  complicada: 12,
  dificil: 16,
  heroica: 20,
  casi_imposible: 25,
};

/** Preparacion, informacion previa y ventaja de terreno: de +1 a +4 (seccion 4.6). */
export const VENTAJA_MAXIMA = 4;

export interface Accion {
  /** Que se intenta hacer, en una linea. Va al registro para `!dados`. */
  descripcion: string;
  nivel: Nivel;
  /** Seccion 4.3 — la especialidad se suma solo cuando de verdad aplica. */
  especialidadAplica: boolean;
  /** Nombre de la especialidad que aplico, para el registro y la progresion. */
  especialidad?: string;
  dificultad: Dificultad;
  /** Seccion 5 — un buen plan no elimina la tirada, la mejora. De 0 a 4. */
  ventaja: number;
  /** Por que se gano esa ventaja. Obliga a justificarla dentro de la ficcion. */
  motivoVentaja?: string;
}

export type Ajuste =
  /** Seccion 4.5 — Nulo: no hay tirada, fracaso automatico con consecuencia. */
  | 'sin_tirada_nulo'
  /** Seccion 4.5 — lo rutinario para un experto no se tira: simplemente lo sabe. */
  | 'sin_tirada_experto'
  /** Seccion 4.5 — el suelo sube: un experto no hace el ridiculo. */
  | 'suelo_experto'
  /** Seccion 4.5 — el techo baja: un inepto no consigue exitos limpios. */
  | 'techo_inepto';

export interface Resultado {
  grado: Grado;
  /** El d20, o null cuando la regla dice que no se tira. */
  tirada: number | null;
  modificador: number;
  total: number | null;
  objetivo: number;
  /** total - objetivo. Null cuando no hubo tirada. */
  margen: number | null;
  /** El grado que habria salido antes de aplicar suelo o techo. */
  gradoCrudo: Grado | null;
  ajuste: Ajuste | null;
  /** Desglose en claro. Es lo que devuelve `!dados` (seccion 11). */
  desglose: string[];
}

/** Un d20. Se inyecta para poder probar el motor sin azar. */
export type Dado = () => number;

export const d20: Dado = () => {
  // randomInt uniforme, sin el sesgo de modulo de Math.random()*20.
  const rango = new Uint32Array(1);
  const limite = Math.floor(0xffffffff / 20) * 20;
  let n: number;
  do {
    crypto.getRandomValues(rango);
    n = rango[0]!;
  } while (n >= limite);
  return (n % 20) + 1;
};

/** Dado fijo, para pruebas. */
export const dadoFijo = (valor: number): Dado => () => valor;

/** Dado que devuelve una secuencia y despues repite el ultimo valor. */
export const dadoSecuencia = (valores: number[]): Dado => {
  let i = 0;
  return () => valores[Math.min(i++, valores.length - 1)]!;
};

function gradoPorMargen(margen: number): Grado {
  if (margen >= 5) return 'exito_limpio';
  if (margen >= 0) return 'exito_con_coste';
  if (margen > -5) return 'fracaso_con_avance';
  return 'fracaso_duro';
}

const ORDEN: Grado[] = [
  'fracaso_duro',
  'fracaso_con_avance',
  'exito_con_coste',
  'exito_limpio',
];

/** Sube el grado hasta un minimo. Seccion 4.5, suelo de experto. */
function subirHasta(grado: Grado, minimo: Grado): Grado {
  return ORDEN.indexOf(grado) < ORDEN.indexOf(minimo) ? minimo : grado;
}

/** Baja el grado hasta un maximo. Seccion 4.5, techo de inepto. */
function bajarHasta(grado: Grado, maximo: Grado): Grado {
  return ORDEN.indexOf(grado) > ORDEN.indexOf(maximo) ? maximo : grado;
}

export function resolver(accion: Accion, dado: Dado = d20): Resultado {
  const objetivo = OBJETIVO[accion.dificultad];
  const ventaja = Math.max(0, Math.min(VENTAJA_MAXIMA, Math.trunc(accion.ventaja)));
  const desglose: string[] = [];

  // Seccion 4.5 — Nulo: no hay tirada. El mago no gana un duelo a espada, nunca.
  if (accion.nivel === 'nulo') {
    return {
      grado: 'fracaso_duro',
      tirada: null,
      modificador: 0,
      total: null,
      objetivo,
      margen: null,
      gradoCrudo: null,
      ajuste: 'sin_tirada_nulo',
      desglose: [
        `Nivel nulo: la tarea exige una formacion que el personaje no tiene.`,
        `Sin tirada. Fracaso automatico con consecuencia (seccion 4.5).`,
      ],
    };
  }

  const bonoNivel = MODIFICADOR_NIVEL[accion.nivel];
  const bonoEspecialidad = accion.especialidadAplica ? BONO_ESPECIALIDAD : 0;
  const modificador = bonoNivel + bonoEspecialidad + ventaja;

  const experto = accion.nivel === 'excepcional' && accion.especialidadAplica;

  // Seccion 4.5 — lo rutinario no se tira para un experto: simplemente lo sabe.
  if (experto && accion.dificultad === 'rutinaria') {
    return {
      grado: 'exito_limpio',
      tirada: null,
      modificador,
      total: null,
      objetivo,
      margen: null,
      gradoCrudo: null,
      ajuste: 'sin_tirada_experto',
      desglose: [
        `Excepcional con especialidad aplicable ante una tarea rutinaria.`,
        `No se tira: lo sabe hacer (seccion 4.5).`,
      ],
    };
  }

  const tirada = dado();
  const total = tirada + modificador;
  const margen = total - objetivo;
  const gradoCrudo = gradoPorMargen(margen);
  let grado = gradoCrudo;
  let ajuste: Ajuste | null = null;

  desglose.push(`d20: ${tirada}`);
  desglose.push(`nivel ${accion.nivel}: ${bonoNivel >= 0 ? '+' : ''}${bonoNivel}`);
  if (bonoEspecialidad) {
    desglose.push(`especialidad${accion.especialidad ? ` (${accion.especialidad})` : ''}: +${bonoEspecialidad}`);
  }
  if (ventaja) {
    desglose.push(`ventaja${accion.motivoVentaja ? ` (${accion.motivoVentaja})` : ''}: +${ventaja}`);
  }
  desglose.push(`total ${total} contra ${accion.dificultad} ${objetivo} — margen ${margen >= 0 ? '+' : ''}${margen}`);

  // Seccion 4.5 — el suelo sube: un experto no hace el ridiculo.
  if (experto) {
    grado = subirHasta(grado, 'exito_con_coste');
    if (grado !== gradoCrudo) {
      ajuste = 'suelo_experto';
      desglose.push(`suelo de experto: sube a exito con coste (seccion 4.5)`);
    }
  }

  // Seccion 4.5 — el techo baja: para un flojo no hay exitos limpios.
  if (accion.nivel === 'flojo') {
    const bajado = bajarHasta(grado, 'exito_con_coste');
    if (bajado !== grado) {
      grado = bajado;
      ajuste = 'techo_inepto';
      desglose.push(`techo de inepto: baja a exito con coste (seccion 4.5)`);
    }
  }

  return { grado, tirada, modificador, total, objetivo, margen, gradoCrudo, ajuste, desglose };
}

/** Seccion 5 — que significa cada grado, en la voz del reglamento. */
export const SIGNIFICADO: Record<Grado, string> = {
  exito_limpio: 'Consigue lo que queria.',
  exito_con_coste: 'Lo consigue, pero pierde algo: tiempo, un recurso, el sigilo, un aliado, una ventaja.',
  fracaso_con_avance: 'No lo consigue, pero la situacion cambia y aprende algo. El fallo mueve la historia hacia adelante.',
  fracaso_duro: 'No lo consigue y la situacion empeora.',
};

/**
 * La instruccion que se le pasa al Director. No lleva numeros: el modelo narra
 * el grado, no la tirada (seccion 5, "nunca muestro numeros").
 */
export function instruccionParaDirector(accion: Accion, r: Resultado): string {
  const lineas = [
    `RESOLUCION DE "${accion.descripcion}"`,
    `Grado: ${r.grado.replace(/_/g, ' ')}. ${SIGNIFICADO[r.grado]}`,
  ];
  if (r.ajuste === 'sin_tirada_nulo') {
    lineas.push(
      'El personaje no tiene la formacion para esto. Narralo como fracaso con consecuencia,',
      'sin insinuar que estuvo cerca. Si no se le aviso antes dentro de la ficcion, avisale ahora',
      'y deja que confirme en vez de resolver (seccion 4.5).',
    );
  }
  if (r.ajuste === 'sin_tirada_experto') {
    lineas.push('Es rutina para el. No lo presentes como logro: describilo con ojos de experto.');
  }
  if (r.ajuste === 'suelo_experto') {
    lineas.push('Un experto no hace el ridiculo: el coste es de circunstancias, no de torpeza suya.');
  }
  if (r.ajuste === 'techo_inepto') {
    lineas.push('Se le nota la falta de mano. Narralo, no lo anuncies.');
  }
  lineas.push('Narra solo la ficcion. No menciones dados, grados ni numeros.');
  return lineas.join('\n');
}
