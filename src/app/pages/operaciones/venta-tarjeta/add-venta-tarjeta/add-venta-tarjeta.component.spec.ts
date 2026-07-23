import { Block } from '@pantrist/capacitor-plugin-ml-kit-text-recognition';
import { RegistroVentaTarjetaComponent } from './add-venta-tarjeta.component';

/**
 * Helper para construir un Block de ML Kit a partir de líneas simplificadas
 * { text, left, centerY, height? }. Solo se pueblan los campos que usa
 * `reconstruirLineas` (text y boundingBox); el resto se completa con valores
 * dummy porque el tipo los exige.
 */
function block(lines: Array<{ text: string; left: number; centerY: number; height?: number }>): Block {
  return {
    text: lines.map(l => l.text).join(' '),
    recognizedLanguage: 'es',
    cornerPoints: null,
    boundingBox: { left: 0, top: 0, right: 0, bottom: 0 },
    lines: lines.map(l => {
      const height = l.height ?? 30;
      const top = l.centerY - height / 2;
      const bottom = l.centerY + height / 2;
      return {
        text: l.text,
        recognizedLanguage: 'es',
        cornerPoints: null,
        boundingBox: { left: l.left, top, right: l.left + 100, bottom },
        elements: []
      };
    })
  };
}

describe('RegistroVentaTarjetaComponent.reconstruirLineas', () => {
  // No usamos TestBed: el método es puro y no toca el DOM ni las dependencias
  // inyectadas por constructor, así que evitamos el setup completo de Angular.
  const component: any = Object.create(RegistroVentaTarjetaComponent.prototype);
  const reconstruir = (blocks: Block[], textoPlano = ''): string =>
    component.reconstruirLineas(blocks, textoPlano);

  it('une en el mismo renglón una etiqueta y su valor cuando ML Kit los separa en bloques distintos', () => {
    const blocks: Block[] = [
      block([{ text: 'BOLETA:', left: 50, centerY: 100 }]),
      block([{ text: '5492315926', left: 400, centerY: 102 }])
    ];

    const texto = reconstruir(blocks);

    expect(texto).toBe('BOLETA: 5492315926');
  });

  it('mantiene en renglones separados líneas verticalmente lejanas', () => {
    const blocks: Block[] = [
      block([{ text: 'BOLETA: 123456', left: 50, centerY: 100, height: 30 }]),
      block([{ text: 'C. AUT: 654321', left: 50, centerY: 200, height: 30 }])
    ];

    const texto = reconstruir(blocks);

    expect(texto).toBe('BOLETA: 123456\nC. AUT: 654321');
  });

  it('ordena las palabras del renglón por posición horizontal (left) independientemente del orden de entrada', () => {
    const blocks: Block[] = [
      block([{ text: 'FINAL', left: 500, centerY: 50 }]),
      block([{ text: 'INICIO', left: 10, centerY: 50 }])
    ];

    const texto = reconstruir(blocks);

    expect(texto).toBe('INICIO FINAL');
  });

  it('cae al texto plano si no hay blocks', () => {
    expect(reconstruir([], 'texto de fallback')).toBe('texto de fallback');
    expect(reconstruir(null as any, 'texto de fallback')).toBe('texto de fallback');
  });

  it('cae al texto plano si los blocks no tienen lines', () => {
    const blocks: Block[] = [{
      text: '',
      recognizedLanguage: 'es',
      cornerPoints: null,
      boundingBox: { left: 0, top: 0, right: 0, bottom: 0 },
      lines: []
    }];

    expect(reconstruir(blocks, 'texto de fallback')).toBe('texto de fallback');
  });

  it('agrupa múltiples renglones con distintas alturas de línea usando la mediana como umbral', () => {
    const blocks: Block[] = [
      block([{ text: 'TICKET', left: 10, centerY: 40, height: 40 }]),
      block([
        { text: 'BOLETA:', left: 20, centerY: 120, height: 20 },
        { text: '999888', left: 200, centerY: 122, height: 20 }
      ]),
      block([{ text: 'GRACIAS', left: 20, centerY: 300, height: 20 }])
    ];

    const texto = reconstruir(blocks);

    expect(texto).toBe('TICKET\nBOLETA: 999888\nGRACIAS');
  });
});
