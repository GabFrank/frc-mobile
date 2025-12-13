import { Injectable } from "@angular/core";
import { Query } from "apollo-angular";
import { productosVencidosQuery } from "./graphql-query";
import { InventarioProductoItem } from "../../inventario/inventario.model";
import { PageInfo } from "src/app/app.component";

export interface ProductosVencidosPage extends PageInfo<InventarioProductoItem> {}

export interface ProductosVencidosResponse {
  productosVencidos: ProductosVencidosPage;
}

@Injectable({
  providedIn: "root",
})
export class ProductosVencidosGQL extends Query<ProductosVencidosResponse> {
  override document = productosVencidosQuery;
}

