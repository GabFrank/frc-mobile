import { CargandoService } from './../../services/cargando.service';
import { NotificacionService } from 'src/app/services/notificacion.service';
import { Injectable } from "@angular/core";

export class CustomResponse {
  errors: string[];
  data: CustomData;
}

export class CustomData {
  data: any;
}

import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { BehaviorSubject, Observable } from "rxjs";
import { Producto, ProductoInput } from "src/app/domains/productos/producto.model";
import { GenericCrudService } from "src/app/generic/generic-crud.service";
import { MainService } from "src/app/services/main.service";
import { AllProductosGQL } from "./graphql/allProductos";
import { ProductoPorIdGQL } from "./graphql/productoPorId";
import { ProductoForPdvGQL } from "./graphql/productoSearchForPdv";
import { SaveImagenProductoGQL } from "./graphql/saveImagenProducto";
import { SaveProductoGQL } from "./graphql/saveProducto";
import { ProductoStockBySucursalGQL } from './graphql/stockBySucursalAndProductoId';
import { ProductoPorCodigoGQL } from './graphql/productoPorCodigo';

@UntilDestroy({ checkProperties: true })
@Injectable({
  providedIn: "root",
})
export class ProductoService {
  productosSub = new BehaviorSubject<Producto[]>(null);
  buscandoProductos = false;
  productosList: Producto[];

  constructor(
    public mainService: MainService,
    private saveProducto: SaveProductoGQL,
    private productoPorId: ProductoPorIdGQL,
    private saveImage: SaveImagenProductoGQL,
    private productoSearch: ProductoForPdvGQL,
    private notificacionSnack: NotificacionService,
    private searchForPdv: ProductoForPdvGQL,
    private getAllProductos: AllProductosGQL,
    private genericService: GenericCrudService,
    private cargandoService: CargandoService,
    private getStockPorSucursal: ProductoStockBySucursalGQL,
    private productoPorCodigo: ProductoPorCodigoGQL
  ) {
    this.productosList = [];
  }

  async onSearch(texto, offset?): Promise<Observable<Producto[]>> {
    let loading = await this.cargandoService.open()
    return new Observable((obs) => {
      this.productoSearch
        .fetch(
          {
            texto,
            offset,
          },
          {
            fetchPolicy: "no-cache",
            errorPolicy: "all",
          }
        ).pipe(untilDestroyed(this))
        .subscribe((res) => {
          this.cargandoService.close(loading)
          if (res.errors == null) {
            console.log(res.data.data);
            obs.next(res.data.data);
          } else {
          }
        });
    });
  }

  onSearchLocal(texto: string) {
    return Promise.all(
      this.productosList.filter((p) => {
        let regex = new RegExp(".*" + texto.replace(" ", ".*"));
        if (
          regex.test(p.descripcion) ||
          p.descripcion.replace(" ", "").includes(texto.replace(" ", ""))
        ) {
          console.log(p.descripcion);
          return p;
        }
      })
    );
  }

  onSearchParaPdv() {}

  async onGetProductoPorId(id): Promise<Observable<Producto>> {
    return await this.genericService.onGetById(this.productoPorId, id);
  }

  onSaveProducto(input: ProductoInput): Observable<any> {
    let isNew = input?.id == null;
    return new Observable((obs) => {
      input.usuarioId = this.mainService?.usuarioActual?.id;
      this.saveProducto
        .mutate(
          {
            entity: input,
          },
          { errorPolicy: "all" }
        ).pipe(untilDestroyed(this))
        .subscribe((res) => {
          console.log(res.errors);
          if (res.errors == null) {
            obs.next(res.data.data);
            if (isNew) {
              this.productosList.push(res.data.data);
            } else {
              let index = this.productosList.findIndex(
                (p) => (p.id = input.id)
              );
              if (index != -1) {
                this.productosList[index] = res.data.data;
              }
            }
            this.notificacionSnack.openGuardadoConExito()
          } else {
            obs.next(null);
            this.notificacionSnack.openAlgoSalioMal()
          }
        });
    });
  }

  async getProducto(id): Promise<Observable<Producto>> {
    return await this.genericService.onGetById(this.productoPorId, id);
  }

  onImageSave(image: string, filename: string) {
    // return new Observable((obs) => {
    console.log("saving image");
    this.saveImage
      .mutate({
        image,
        filename,
      }).pipe(untilDestroyed(this))
      .subscribe((res) => {
        if (res.errors == null) {
          // obs.next(res.data)
          this.notificacionSnack.openGuardadoConExito()
        } else {
          this.notificacionSnack.openAlgoSalioMal()
        }
      });
    // })
  }

  async  onGetStockPorSucursal(productoId: number, sucursalId: number): Promise<Observable<number>>{
    return await this.genericService.onGet(this.getStockPorSucursal, {proId: productoId, sucId: sucursalId});
  }
  
  async onGetProductoPorCodigo(texto): Promise<Observable<Producto>> {
    return await this.genericService.onCustomGet(this.productoPorCodigo, { texto });
    }
}
