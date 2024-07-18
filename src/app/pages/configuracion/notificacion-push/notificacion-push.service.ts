import { Injectable } from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import { NotificacionPush, NotificacionPushInput } from './notificacion-push.model';
import { GenericCrudService } from 'src/app/generic/generic-crud.service';
import { RequestPushNotificationGQL } from './graphql/requestPushNotification';
import { request } from 'http';
import { Observable } from 'rxjs';

@UntilDestroy()
@Injectable({
  providedIn: 'root'
})
export class NotificacionPushService {
  constructor(
    private genericCrudService: GenericCrudService,
    private requestPushNotificationGQL: RequestPushNotificationGQL
  ) {}

  async sendNotificacionPush(notificacionInput: NotificacionPushInput): Promise<Observable<NotificacionPush>>{
    return await this.genericCrudService.onCustomGet(this.requestPushNotificationGQL, {entity: notificacionInput});
  }
}
