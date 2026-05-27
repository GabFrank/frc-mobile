import { Injectable } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { from, Observable, of } from 'rxjs';
import {
  catchError,
  concatMap,
  defaultIfEmpty,
  filter,
  finalize,
  map,
  switchMap,
  take,
} from 'rxjs/operators';
import { Presentacion } from 'src/app/domains/productos/presentacion.model';
import { Producto } from 'src/app/domains/productos/producto.model';
import {
  codigosParaBuscar,
  esCodigoPesable,
  parseCodigoPesable,
} from 'src/app/generic/utils/barcodeUtils';
import { CodigoService } from '../codigo/codigo.service';
import { CargandoService } from '../../services/cargando.service';
import {
  productoTienePresentaciones,
  resolverPresentacionPorCodigo,
} from './producto-presentacion.util';
import { ProductoService } from './producto.service';

export interface ResultadoBusquedaPesable {
  producto: Producto;
  presentacion: Presentacion;
  peso: number;
}

@UntilDestroy()
@Injectable({
  providedIn: 'root',
})
export class ProductoBusquedaService {
  constructor(
    private productoService: ProductoService,
    private codigoService: CodigoService,
    private cargandoService: CargandoService
  ) {}

  /**
   * Prueba productoPorCodigo con cada candidato; si falla, productoSearch por nombre.
   */
  buscarPorCodigoOTexto(texto: string, offset?: number): Observable<Producto[]> {
    const trimmed = texto?.trim() ?? '';
    if (!trimmed) {
      return of([]);
    }

    if (offset != null && offset > 0) {
      return this.ejecutarBusquedaTexto(trimmed, offset);
    }

    const codigos = codigosParaBuscar(trimmed);
    if (codigos.length === 0) {
      return this.ejecutarBusquedaTexto(trimmed, offset);
    }

    return this.conCargando(
      this.buscarProductoPorCodigos(codigos).pipe(
        switchMap((producto) =>
          producto ? of([producto]) : this.ejecutarBusquedaTexto(trimmed, 0)
        )
      )
    );
  }

  /**
   * Busca producto de balanza: código completo → código interno (5 dígitos).
   */
  buscarProductoPesable(codigoCompleto: string): Observable<ResultadoBusquedaPesable | null> {
    const { codigoInterno, peso } = parseCodigoPesable(codigoCompleto);

    return this.buscarProductoPorCodigos([codigoCompleto]).pipe(
      switchMap((producto) => {
        if (!producto) {
          return this.buscarPesablePorCodigoInterno(codigoInterno, peso);
        }
        return this.asegurarProductoConPresentaciones(producto).pipe(
          switchMap((productoCompleto) => {
            if (productoCompleto?.balanza) {
              const presentacion = resolverPresentacionPorCodigo(
                productoCompleto,
                codigoCompleto,
                codigoInterno
              );
              if (presentacion) {
                return of({ producto: productoCompleto, presentacion, peso });
              }
            }
            return this.buscarPesablePorCodigoInterno(codigoInterno, peso);
          })
        );
      })
    );
  }

  /**
   * Intenta varios códigos en secuencia (p. ej. mostrar precio).
   */
  buscarProductoPorEscaneo(textoEscaneado: string): Observable<Producto | null> {
    const candidatos = codigosParaBuscar(textoEscaneado);
    const lista =
      candidatos.length > 0 ? candidatos : [textoEscaneado.trim()].filter(Boolean);

    return this.buscarProductoPorCodigos(lista).pipe(
      switchMap((producto) =>
        producto ? this.asegurarProductoConPresentaciones(producto) : of(null)
      )
    );
  }

  esBusquedaPesable(texto: string): boolean {
    return esCodigoPesable(texto);
  }

  private buscarProductoPorCodigos(codigos: string[]): Observable<Producto | null> {
    if (codigos.length === 0) {
      return of(null);
    }

    return from(codigos).pipe(
      concatMap((codigo) =>
        from(this.productoService.onGetProductoPorCodigo(codigo)).pipe(
          switchMap((obs) => obs),
          take(1),
          map((producto) => producto ?? null),
          catchError(() => of(null))
        )
      ),
      filter((producto): producto is Producto => producto != null),
      take(1),
      defaultIfEmpty(null)
    );
  }

  private buscarPesablePorCodigoInterno(
    codigoInterno: string,
    peso: number
  ): Observable<ResultadoBusquedaPesable | null> {
    return from(this.codigoService.onGetCodigoPorCodigo(codigoInterno)).pipe(
      switchMap((obs) => obs),
      map((codigos) => {
        if (!codigos?.length) {
          return null;
        }
        const entrada = codigos.find((c) => c.presentacion) ?? codigos[0];
        const presentacion = entrada?.presentacion;
        const producto = presentacion?.producto;
        if (!presentacion || !producto) {
          return null;
        }
        return { producto, presentacion, peso };
      }),
      catchError(() => of(null))
    );
  }

  private asegurarProductoConPresentaciones(producto: Producto): Observable<Producto> {
    if (productoTienePresentaciones(producto) || !producto?.id) {
      return of(producto);
    }
    return from(this.productoService.getProducto(producto.id)).pipe(
      switchMap((obs) => obs),
      map((completo) => completo ?? producto),
      catchError(() => of(producto))
    );
  }

  private ejecutarBusquedaTexto(texto: string, offset?: number): Observable<Producto[]> {
    return from(this.productoService.onSearch(texto, offset)).pipe(
      switchMap((obs) => obs),
      take(1),
      map((lista) => lista ?? []),
      catchError(() => of([]))
    );
  }

  private conCargando<T>(source: Observable<T>): Observable<T> {
    return new Observable((subscriber) => {
      let loading: any;
      this.cargandoService.open().then((l) => {
        loading = l;
        source
          .pipe(
            untilDestroyed(this),
            take(1),
            finalize(() => this.cargandoService.close(loading))
          )
          .subscribe({
            next: (v) => subscriber.next(v),
            error: (e) => subscriber.error(e),
            complete: () => subscriber.complete(),
          });
      });
    });
  }
}
