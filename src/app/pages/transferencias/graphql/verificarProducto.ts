import { Mutation } from "apollo-angular";
import { verificarProducto } from "./graphql-query";
import { Injectable } from "@angular/core";
import { TransferenciaItem } from "../transferencia.model";

@Injectable({
    providedIn: 'root'
})


export class VerificarProductoGQL extends Mutation<TransferenciaItem>{ 
    document = verificarProducto;
}