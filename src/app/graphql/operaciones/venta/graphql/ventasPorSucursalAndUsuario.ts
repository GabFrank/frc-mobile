import { Injectable } from "@angular/core";
import { Query } from "apollo-angular";
import { ventasPorSucursalAndUsuarioQuery } from "./graphql-query";

@Injectable({
    providedIn: "root",
})
export class VentasPorSucursalAndUsuarioGQL extends Query<any> {
    document = ventasPorSucursalAndUsuarioQuery;
}
