import { describe, expect, it } from 'vitest';
import {
  BONO_ESPECIALIDAD,
  MODIFICADOR_NIVEL,
  OBJETIVO,
  d20,
  dadoFijo,
  instruccionParaDirector,
  resolver,
  type Accion,
} from '../lib/motor/dados.js';

const base: Accion = {
  descripcion: 'forzar la cerradura',
  nivel: 'normal',
  especialidadAplica: false,
  dificultad: 'complicada',
  ventaja: 0,
};

describe('los cuatro grados por margen (seccion 5)', () => {
  // Normal (+0) contra complicada (12).
  it('superar por 5 o mas es exito limpio', () => {
    expect(resolver(base, dadoFijo(17)).grado).toBe('exito_limpio');
  });
  it('superar por poco es exito con coste', () => {
    expect(resolver(base, dadoFijo(12)).grado).toBe('exito_con_coste');
    expect(resolver(base, dadoFijo(16)).grado).toBe('exito_con_coste');
  });
  it('fallar por poco es fracaso con avance', () => {
    expect(resolver(base, dadoFijo(11)).grado).toBe('fracaso_con_avance');
    expect(resolver(base, dadoFijo(8)).grado).toBe('fracaso_con_avance');
  });
  it('fallar por 5 o mas es fracaso duro', () => {
    expect(resolver(base, dadoFijo(7)).grado).toBe('fracaso_duro');
    expect(resolver(base, dadoFijo(1)).grado).toBe('fracaso_duro');
  });
  it('nunca devuelve si o no', () => {
    for (let cara = 1; cara <= 20; cara++) {
      expect(['exito_limpio', 'exito_con_coste', 'fracaso_con_avance', 'fracaso_duro'])
        .toContain(resolver(base, dadoFijo(cara)).grado);
    }
  });
});

describe('modificadores (seccion 4.6)', () => {
  it('suma nivel, especialidad y ventaja', () => {
    const r = resolver(
      { ...base, nivel: 'bueno', especialidadAplica: true, ventaja: 2 },
      dadoFijo(10),
    );
    expect(r.modificador).toBe(MODIFICADOR_NIVEL.bueno + BONO_ESPECIALIDAD + 2);
    expect(r.total).toBe(10 + r.modificador);
    expect(r.objetivo).toBe(OBJETIVO.complicada);
  });

  it('recorta la ventaja a +4', () => {
    expect(resolver({ ...base, ventaja: 99 }, dadoFijo(10)).modificador).toBe(4);
    expect(resolver({ ...base, ventaja: -5 }, dadoFijo(10)).modificador).toBe(0);
  });

  it('la especialidad solo suma cuando aplica', () => {
    const sin = resolver({ ...base, especialidadAplica: false }, dadoFijo(10));
    const con = resolver({ ...base, especialidadAplica: true }, dadoFijo(10));
    expect(con.modificador - sin.modificador).toBe(BONO_ESPECIALIDAD);
  });
});

describe('nivel nulo (seccion 4.5)', () => {
  const nulo = resolver({ ...base, nivel: 'nulo' }, dadoFijo(20));

  it('no tira', () => {
    expect(nulo.tirada).toBeNull();
    expect(nulo.total).toBeNull();
  });

  it('es fracaso duro pase lo que pase', () => {
    expect(nulo.grado).toBe('fracaso_duro');
    expect(nulo.ajuste).toBe('sin_tirada_nulo');
  });

  it('el aviso al Director pide confirmacion dentro de la ficcion', () => {
    expect(instruccionParaDirector({ ...base, nivel: 'nulo' }, nulo)).toContain('confirme');
  });
});

describe('suelo de experto (seccion 4.5)', () => {
  const experto: Accion = {
    ...base,
    nivel: 'excepcional',
    especialidadAplica: true,
    dificultad: 'heroica',
  };

  it('un experto no hace el ridiculo ni con un 1', () => {
    const r = resolver(experto, dadoFijo(1));
    expect(r.gradoCrudo).toBe('fracaso_duro');
    expect(r.grado).toBe('exito_con_coste');
    expect(r.ajuste).toBe('suelo_experto');
  });

  it('el suelo no le regala un exito limpio', () => {
    for (let cara = 1; cara <= 20; cara++) {
      const r = resolver(experto, dadoFijo(cara));
      if (r.ajuste === 'suelo_experto') expect(r.grado).toBe('exito_con_coste');
    }
  });

  it('lo rutinario no se tira: simplemente lo sabe', () => {
    const r = resolver({ ...experto, dificultad: 'rutinaria' }, dadoFijo(1));
    expect(r.tirada).toBeNull();
    expect(r.grado).toBe('exito_limpio');
    expect(r.ajuste).toBe('sin_tirada_experto');
  });

  it('excepcional sin especialidad aplicable no tiene suelo', () => {
    const r = resolver({ ...experto, especialidadAplica: false }, dadoFijo(1));
    expect(r.grado).toBe('fracaso_duro');
    expect(r.ajuste).toBeNull();
  });
});

describe('techo de inepto (seccion 4.5)', () => {
  const flojo: Accion = { ...base, nivel: 'flojo', dificultad: 'rutinaria' };

  it('no hay exitos limpios: lo mejor es con coste', () => {
    const r = resolver(flojo, dadoFijo(20));
    expect(r.gradoCrudo).toBe('exito_limpio');
    expect(r.grado).toBe('exito_con_coste');
    expect(r.ajuste).toBe('techo_inepto');
  });

  it('el techo no lo protege de fallar mal', () => {
    const r = resolver({ ...flojo, dificultad: 'heroica' }, dadoFijo(1));
    expect(r.grado).toBe('fracaso_duro');
  });
});

describe('el desglose es lo que devuelve !dados (seccion 11)', () => {
  it('deja rastro de cada sumando', () => {
    const r = resolver(
      { ...base, nivel: 'bueno', especialidadAplica: true, especialidad: 'Lenguas muertas', ventaja: 2, motivoVentaja: 'leyo el archivo antes' },
      dadoFijo(14),
    );
    const texto = r.desglose.join('\n');
    expect(texto).toContain('d20: 14');
    expect(texto).toContain('Lenguas muertas');
    expect(texto).toContain('leyo el archivo antes');
    expect(texto).toContain('margen');
  });

  it('la instruccion al Director no filtra numeros', () => {
    const accion = { ...base, nivel: 'bueno' as const };
    const r = resolver(accion, dadoFijo(14));
    const instruccion = instruccionParaDirector(accion, r);
    expect(instruccion).not.toMatch(/\bd20\b|\b14\b|\b12\b/);
    expect(instruccion).toContain('No menciones dados');
  });
});

describe('el d20 de verdad', () => {
  it('cae siempre entre 1 y 20 y cubre todas las caras', () => {
    const vistas = new Set<number>();
    for (let i = 0; i < 4000; i++) {
      const cara = d20();
      expect(Number.isInteger(cara)).toBe(true);
      expect(cara).toBeGreaterThanOrEqual(1);
      expect(cara).toBeLessThanOrEqual(20);
      vistas.add(cara);
    }
    expect(vistas.size).toBe(20);
  });

  it('reparte parejo, que es justo lo que un modelo de lenguaje no hace', () => {
    const cuenta = new Array(21).fill(0);
    const n = 60000;
    for (let i = 0; i < n; i++) cuenta[d20()]++;
    const esperado = n / 20;
    for (let cara = 1; cara <= 20; cara++) {
      expect(Math.abs(cuenta[cara] - esperado) / esperado).toBeLessThan(0.15);
    }
  });
});
