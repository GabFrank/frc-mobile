import { Injectable } from "@angular/core";
import { Query } from "apollo-angular";
import { findProductoVencidoQuery } from "./graphql-query";
import { VencimientoProductoDto } from "../VencimientoProductoDto";

export interface Response {
    data: VencimientoProductoDto [];
}

@Injectable({
    providedIn: 'root',
})

export class findProductoVencidoGQL extends Query<Response> {
    document = findProductoVencidoQuery;
}