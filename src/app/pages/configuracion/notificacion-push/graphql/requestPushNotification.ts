import { Injectable } from "@angular/core";
import { Query } from "apollo-angular";
import { requestPushNotificationQuery } from "./graphql-query";

@Injectable({
  providedIn: "root",
})
export class RequestPushNotificationGQL extends Query<boolean> {
  document = requestPushNotificationQuery;
}
