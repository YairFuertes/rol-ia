/**
 * Tipos compartidos por todo el proyecto.
 *
 * El vocabulario sale del reglamento (CLAUDE.md). Cuando una regla concreta
 * respalda un tipo, la seccion va citada en el comentario.
 */

/** Seccion 4.1 — los cuatro atributos. */
export type Atributo = 'cuerpo' | 'destreza' | 'mente' | 'presencia';

export const ATRIBUTOS: readonly Atributo[] = ['cuerpo', 'destreza', 'mente', 'presencia'];

/** Seccion 4.2 — la escala. `nulo` no se reparte al crear: aparece por falta de formacion. */
export type Nivel = 'nulo' | 'flojo' | 'normal' | 'bueno' | 'excepcional';

/** Seccion 4.6 — dificultades. */
export type Dificultad = 'rutinaria' | 'complicada' | 'dificil' | 'heroica' | 'casi_imposible';

/** Seccion 5 — cuatro grados de resultado, nunca si o no. */
export type Grado =
  | 'exito_limpio'
  | 'exito_con_coste'
  | 'fracaso_con_avance'
  | 'fracaso_duro';

/** Seccion 9.1 — modo de voz. Sin eleccion explicita, va asistido (seccion 3.2). */
export type ModoVoz = 'asistido' | 'estricto';

/** Seccion 13.3 — los tres estados de un lugar en el mapa. */
export type EstadoLugar = 'visitado' | 'conocido' | 'rumor';

export type TipoLugar =
  | 'ciudad'
  | 'pueblo'
  | 'fortaleza'
  | 'ruina'
  | 'bosque'
  | 'montana'
  | 'agua'
  | 'camino'
  | 'interior'
  | 'otro';

export interface Especialidad {
  nombre: string;
  /** Sube por uso (seccion 12). Cuenta de usos superados. */
  usos: number;
}

export interface Personaje {
  id: string;
  campanaId: string;
  nombre: string;
  concepto: string;
  /** Seccion 4.2 — reparto forzoso: uno de cada nivel entre los cuatro atributos. */
  atributos: Record<Atributo, Nivel>;
  especialidades: Especialidad[];
  trasfondo: string;
  debilidad: string;
  /** Seccion 6 — el dano estorba y es persistente. */
  heridas: string[];
  cansancio: 'entero' | 'tocado' | 'agotado';
  condiciones: string[];
  inventario: ObjetoInventario[];
}

export interface ObjetoInventario {
  nombre: string;
  cantidad: number;
  /** Seccion 13.1 — lo consumible va marcado. */
  consumible: boolean;
  nota?: string;
}

export interface Npc {
  id: string;
  campanaId: string;
  nombre: string;
  /** Seccion 8 — deseo, miedo y metodo propios. */
  deseo: string;
  miedo: string;
  metodo: string;
  /** Como ve al personaje ahora mismo. Tienen memoria. */
  actitud: string;
  /** Lo que sabe. No maneja informacion que no haya podido obtener. */
  sabe: string[];
  vivo: boolean;
  /** Para no cargar en el prompt NPC que no vienen al caso. */
  presente: boolean;
  ultimaAparicion: string | null;
}

export interface Lugar {
  id: string;
  campanaId: string;
  nombre: string;
  tipo: TipoLugar;
  /** Coordenadas 0-100 sobre el lienzo del mapa. La pagina lo dibuja (seccion 13.2). */
  x: number;
  y: number;
  estado: EstadoLugar;
  /** Ids de otros lugares conectados. */
  conexiones: string[];
  /** Nivel del mapa al que pertenece: el mundo, una ciudad o un interior. */
  nivel: 'mundo' | 'ciudad' | 'interior';
  /** Para ciudades e interiores: id del lugar que los contiene. */
  contenedor: string | null;
  /** Seccion 13.3 — los interiores van por pisos, como pestanas del mismo plano. */
  piso?: string;
  nota: string;
}

export interface Hilo {
  id: string;
  campanaId: string;
  descripcion: string;
  tipo: 'promesa' | 'deuda' | 'amenaza' | 'reloj';
  /** Un reloj que corre: cuantos pasos quedan antes de que ocurra. */
  pasosRestantes: number | null;
  abierto: boolean;
}

export interface EntradaBitacora {
  id: string;
  campanaId: string;
  capitulo: number;
  /** Seccion 14.2 — se escribe en telegrama, no en prosa. */
  texto: string;
  creadaEn: string;
}

export type AutorMensaje = 'jugador' | 'director' | 'sistema';

export interface Mensaje {
  id: string;
  campanaId: string;
  autor: AutorMensaje;
  texto: string;
  /** Las tres opciones + la libre que cerraron el turno (seccion 9.4). */
  opciones?: string[];
  /** Id de la tirada que resolvio este turno, si hubo. */
  tiradaId?: string | null;
  creadoEn: string;
}

export interface Campana {
  id: string;
  nombre: string;
  /** Seccion 3.2 — la ficha de apertura. */
  premisa: string;
  tono: string;
  intensidad: string;
  escala: string;
  lineasRojas: string[];
  modoVoz: ModoVoz;
  /** Reglas propias del mundo, fijadas una vez y cumplidas siempre (seccion 7). */
  reglasDelMundo: string[];
  capituloActual: number;
  /** Resumen acumulado de los capitulos cerrados. Sustituye al historial viejo. */
  resumen: string;
  proveedorIa: string;
  modeloIa: string;
  creadaEn: string;
  actualizadaEn: string;
}
