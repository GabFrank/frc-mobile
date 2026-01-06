import { Injectable } from "@angular/core";
import { Query } from "apollo-angular";
import { countClientesTotalQuery } from "./alertas-queries";

@Injectable({
    providedIn: "root",
})
export class CountClientesTotalGQL extends Query<any> {
    override document = countClientesTotalQuery;
}
