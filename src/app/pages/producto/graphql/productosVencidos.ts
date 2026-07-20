import { Injectable } from "@angular/core";
import { Query } from "apollo-angular";
import { productosVencidosQuery } from "./graphql-query";
import { ProductoVencidoViewPage } from "../../inventario/inventario.model";

export interface ProductosVencidosResponse {
  data: ProductoVencidoViewPage;
}

@Injectable({
  providedIn: "root",
})
export class ProductosVencidosGQL extends Query<ProductosVencidosResponse> {
  override document = productosVencidosQuery;
}
