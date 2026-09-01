/**
 * Los comandos meta de la seccion 11.
 *
 * En el chat todos los contestaba el modelo. Aca la mayoria los contesta el
 * codigo leyendo la base: son mas rapidos, mas baratos y —sobre todo— no se
 * los inventa nadie. `!dados` deja de ser un acto de fe y `!ficha` no puede
 * contradecir a la ficha.
 */

import type { ModoVoz } from '../tipos.js';

export type Comando =
  | { tipo: 'estado' }
  | { tipo: 'ficha' }
  | { tipo: 'dados' }
  | { tipo: 'saber'; tema: string }
  | { tipo: 'npc'; nombre: string }
  | { tipo: 'hilos' }
  | { tipo: 'resumen' }
  | { tipo: 'mapa' }
  | { tipo: 'pausa'; texto: string }
  | { tipo: 'voz'; modo: ModoVoz | null }
  | { tipo: 'ajustar'; que: string }
  | { tipo: 'fuera'; texto: string }
  | { tipo: 'corregir'; que: string }
  | { tipo: 'guardar' }
  | { tipo: 'desconocido'; nombre: string };

export type TipoComando = Comando['tipo'];

/**
 * Quien contesta cada comando.
 *
 * `codigo`   — lo resuelve el servidor leyendo la base. No cuesta una llamada.
 * `director` — hace falta el modelo (juicio, no datos).
 * `ajuste`   — cambia la configuracion de la campana y ademas se le avisa al Director.
 */
export const RESUELVE: Record<TipoComando, 'codigo' | 'director' | 'ajuste'> = {
  estado: 'codigo',
  ficha: 'codigo',
  dados: 'codigo',
  hilos: 'codigo',
  mapa: 'codigo',
  npc: 'codigo',
  resumen: 'codigo',
  // Separar hecho, rumor y suposicion es criterio, no una consulta.
  saber: 'director',
  corregir: 'director',
  pausa: 'director',
  fuera: 'director',
  voz: 'ajuste',
  ajustar: 'ajuste',
  guardar: 'codigo',
  desconocido: 'codigo',
};

/**
 * Seccion 11 — `!pausa` y `!ajustar` tienen prioridad absoluta: si se usan, la
 * ficcion se detiene de inmediato.
 */
export const PRIORIDAD_ABSOLUTA: readonly TipoComando[] = ['pausa', 'ajustar'];

export const AYUDA: Record<Exclude<TipoComando, 'desconocido'>, string> = {
  estado: 'Heridas, cansancio, que llevas, tiempo transcurrido, donde estas.',
  ficha: 'Ficha completa con atributos y especialidades, en claro, por una vez.',
  dados: 'La tirada oculta de la ultima accion: fue mala suerte o hiciste algo mal.',
  saber: 'Que sabe tu personaje de algo, separando hecho, rumor y suposicion.',
  npc: 'Quien era este. Se usa: !npc <nombre>',
  hilos: 'Promesas, deudas, amenazas en marcha, relojes corriendo.',
  resumen: 'El "hasta ahora" de la campana.',
  mapa: 'Enlace al tablero y estado actual de la exploracion.',
  pausa: 'Paramos y hablamos jugador y Director sobre la partida.',
  voz: 'Cambia entre modo asistido y estricto. Sin nada detras, dice en cual estamos.',
  ajustar: 'Va lento, mas combate, baja la crudeza. Se usa: !ajustar <cosa>',
  fuera: 'Comentario suelto sin cortar la escena. Se usa: !fuera <texto>',
  corregir: 'Solo para errores del Director. No deshace decisiones ni tiradas.',
  guardar: 'Vuelca todo a la base y al tablero antes de cerrar.',
};

const CON_ARGUMENTO = new Set(['npc', 'saber', 'ajustar', 'fuera', 'corregir', 'pausa', 'voz']);

/**
 * Reconoce un comando meta. Devuelve null si el texto es una accion normal.
 *
 * Va con `!` porque `/` esta ocupada por los comandos del programa (seccion 11).
 */
export function analizar(entrada: string): Comando | null {
  const texto = entrada.trim();
  if (!texto.startsWith('!')) return null;

  const corte = texto.search(/\s/);
  const nombre = (corte === -1 ? texto.slice(1) : texto.slice(1, corte)).toLowerCase();
  const resto = corte === -1 ? '' : texto.slice(corte + 1).trim();

  switch (nombre) {
    case 'estado': return { tipo: 'estado' };
    case 'ficha': return { tipo: 'ficha' };
    case 'dados': return { tipo: 'dados' };
    case 'hilos': return { tipo: 'hilos' };
    case 'resumen': return { tipo: 'resumen' };
    case 'mapa': return { tipo: 'mapa' };
    case 'guardar': return { tipo: 'guardar' };
    case 'saber': return { tipo: 'saber', tema: resto };
    case 'npc': return { tipo: 'npc', nombre: resto };
    case 'ajustar': return { tipo: 'ajustar', que: resto };
    case 'fuera': return { tipo: 'fuera', texto: resto };
    case 'corregir': return { tipo: 'corregir', que: resto };
    case 'pausa': return { tipo: 'pausa', texto: resto };
    case 'voz': {
      const modo = resto.toLowerCase();
      if (modo.startsWith('asis')) return { tipo: 'voz', modo: 'asistido' };
      if (modo.startsWith('estric')) return { tipo: 'voz', modo: 'estricto' };
      return { tipo: 'voz', modo: null };
    }
    default:
      return { tipo: 'desconocido', nombre };
  }
}

/** Si el comando necesita un argumento y no lo trae, esto dice como se usa. */
export function faltaArgumento(comando: Comando): string | null {
  if (!CON_ARGUMENTO.has(comando.tipo)) return null;
  const vacio =
    (comando.tipo === 'npc' && !comando.nombre) ||
    (comando.tipo === 'saber' && !comando.tema) ||
    (comando.tipo === 'ajustar' && !comando.que) ||
    (comando.tipo === 'corregir' && !comando.que) ||
    (comando.tipo === 'fuera' && !comando.texto);
  if (!vacio) return null;
  return `El comando !${comando.tipo} necesita algo detras. ${AYUDA[comando.tipo as keyof typeof AYUDA]}`;
}

/**
 * Seccion 11 — `!corregir` tiene alcance estricto. Estos son los cuatro casos
 * que cubre; fuera de ahi se dice claramente y no se aplica. La comprobacion
 * real la hace el Director con la escena delante, pero el recordatorio viaja
 * siempre con el comando para que no se ablande.
 */
export const ALCANCE_CORREGIR = [
  'Malinterprete la accion.',
  'Contradije el canon: un muerto que revive, geografia cambiada, un NPC con informacion que no podia tener.',
  'Cruce una linea roja sin darme cuenta.',
  'Narre por dentro del personaje estando en modo estricto.',
].join('\n');
