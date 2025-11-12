import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { PedidoService } from './pedido.service';
import { ItemsNotaPaginadosQuery, ItemsNotaPaginadosVariables, ItemsNotaPaginadosResponse } from '../graphql/itemsNotaPaginados';
import { ResumenItemsNotaQuery, ResumenItemsNotaVariables, ResumenItemsNotaResponse } from '../graphql/resumenItemsNota';

export interface PaginationParams {
  page: number;
  size: number;
  sort?: string;
  direction?: 'ASC' | 'DESC';
}

export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  numberOfElements: number;
}

@Injectable({
  providedIn: 'root'
})
export class ItemsPaginacionService {

  private itemsSubject = new BehaviorSubject<any[]>([]);
  private totalItemsSubject = new BehaviorSubject<number>(0);
  private loadingSubject = new BehaviorSubject<boolean>(false);

  public items$ = this.itemsSubject.asObservable();
  public totalItems$ = this.totalItemsSubject.asObservable();
  public loading$ = this.loadingSubject.asObservable();

  constructor(
    private pedidoService: PedidoService,
    private itemsNotaPaginadosQuery: ItemsNotaPaginadosQuery,
    private resumenItemsNotaQuery: ResumenItemsNotaQuery
  ) {}

  /**
   * Cargar items de una nota de recepción de forma paginada
   */
  cargarItemsNota(notaId: number, params: PaginationParams): Observable<PaginatedResponse<any>> {
    this.loadingSubject.next(true);
    
    const variables: ItemsNotaPaginadosVariables = {
      notaId: notaId.toString(),
      page: params.page,
      size: params.size,
      sort: params.sort,
      direction: params.direction
    };

    return new Observable(observer => {
      this.itemsNotaPaginadosQuery.watch(variables).valueChanges.subscribe({
        next: (result) => {
          if (result.data) {
            const response: PaginatedResponse<any> = {
              content: result.data.content,
              totalElements: result.data.totalElements,
              totalPages: result.data.totalPages,
              size: result.data.size,
              number: result.data.number,
              first: result.data.first,
              last: result.data.last,
              numberOfElements: result.data.numberOfElements
            };
            
            this.itemsSubject.next(response.content);
            this.totalItemsSubject.next(response.totalElements);
            this.loadingSubject.next(false);
            observer.next(response);
          }
        },
        error: (error) => {
          console.error('Error al cargar items paginados:', error);
          this.loadingSubject.next(false);
          observer.error(error);
        }
      });
    });
  }

  /**
   * Obtener total de items sin cargar todos los datos
   */
  obtenerTotalItems(notaId: number): Observable<number> {
    // TODO: Implementar query optimizada que solo retorne el count
    return new Observable(observer => {
      observer.next(0);
      observer.complete();
    });
  }

  /**
   * Obtener resumen de items (counts por estado, etc.)
   */
  obtenerResumenItems(notaIds: number[]): Observable<any> {
    const variables: ResumenItemsNotaVariables = {
      notaIds: notaIds.map(id => id.toString())
    };

    return new Observable(observer => {
      this.resumenItemsNotaQuery.watch(variables).valueChanges.subscribe({
        next: (result) => {
          if (result.data) {
            const resumen = {
              totalItems: result.data.totalItems,
              totalCantidad: result.data.totalCantidad,
              itemsPorEstado: result.data.itemsPorEstado,
              resumenPorNota: result.data.resumenPorNota
            };
            observer.next(resumen);
          }
        },
        error: (error) => {
          console.error('Error al obtener resumen de items:', error);
          // Fallback: resumen vacío
          const resumen = {
            totalItems: 0,
            totalCantidad: 0,
            itemsPorEstado: [],
            resumenPorNota: []
          };
          observer.next(resumen);
        }
      });
    });
  }

  /**
   * Actualizar items en memoria (para operaciones CRUD)
   */
  actualizarItems(items: any[]) {
    this.itemsSubject.next(items);
  }

  /**
   * Limpiar items en memoria
   */
  limpiarItems() {
    this.itemsSubject.next([]);
    this.totalItemsSubject.next(0);
  }
} 