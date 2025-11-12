import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { productosAgrupadosPorNotas } from './pedidos-queries.graphql';

export interface ProductoAgrupadoDTO {
  producto: { id: number; nombre: string; imagen?: string };
  cantidadTotalEsperada: number;
  presentacionConsolidada?: { id: number; descripcion?: string };
  distribuciones: Array<{ 
    id: number; 
    cantidad: number;
    notaRecepcionItem: {
      id: number;
      notaRecepcion: {
        id: number;
        numero: number;
      };
    };
  }>;
}

@Injectable({ providedIn: 'root' })
export class ProductosAgrupadosPorNotasQuery extends Query<{ data: ProductoAgrupadoDTO[] }> {
  override document = productosAgrupadosPorNotas;
}