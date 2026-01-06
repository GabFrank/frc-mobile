import { Injectable } from "@angular/core";
import { Query } from "apollo-angular";
import { countStockTotalQuery } from "./alertas-queries";

@Injectable({
    providedIn: "root",
})
export class CountStockTotalGQL extends Query<any> {
    override document = countStockTotalQuery;
}
