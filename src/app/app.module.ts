import { FuncionarioModule } from './pages/funcionario/funcionario.module';
import { ProductoModule } from './pages/producto/producto.module';
import { ComponentsModule } from './components/components.module';
import { TransferenciasModule } from './pages/transferencias/transferencias.module';
import { InventarioModule } from './pages/inventario/inventario.module';
import { APP_INITIALIZER, Injectable, LOCALE_ID, NgModule } from '@angular/core';
import { BrowserModule, HammerGestureConfig, HammerModule, HAMMER_GESTURE_CONFIG } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';
import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { onError } from '@apollo/client/link/error';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { serverAdress } from 'src/environments/environment';
import { ApolloModule, APOLLO_OPTIONS } from 'apollo-angular';
import { setContext } from '@apollo/client/link/context';
import { HttpLink } from 'apollo-angular/http';
import {
  ApolloClientOptions,
  ApolloLink,
  InMemoryCache,
  split,
} from '@apollo/client/core';
import { getMainDefinition } from '@apollo/client/utilities';
import { HttpClientModule } from '@angular/common/http';
import { MainService } from './services/main.service';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { LoginComponent } from './dialog/login/login.component';
import { NgxCurrencyModule } from 'ngx-currency';
import { SubscriptionClient } from 'subscriptions-transport-ws';
import { BehaviorSubject } from 'rxjs';
import { WebSocketLink } from "@apollo/client/link/ws";
import localePY from "@angular/common/locales/es-PY";
import {
  registerLocaleData,
} from "@angular/common";
import { NgxQRCodeModule } from '@techiediaries/ngx-qrcode';
import { CambiarContrasenhaDialogComponent } from './dialog/login/cambiar-contrasenha-dialog/cambiar-contrasenha-dialog.component';
import { AdicionarConteoDialogComponent } from './pages/operaciones/conteo/adicionar-conteo-dialog/adicionar-conteo-dialog.component';

registerLocaleData(localePY);




const uri = `http://${serverAdress.serverIp}:${serverAdress.serverPort}`;
const wUri = `ws://${serverAdress.serverIp}:${serverAdress.serverPort}/subscriptions`;

const errorLink = onError(({ graphQLErrors, networkError }) => {
});

const wsClient = new SubscriptionClient(wUri, {
  reconnect: true,
  inactivityTimeout: 5
});

export const connectionStatusSub = new BehaviorSubject<any>(null);

wsClient.onConnected(() => {
  connectionStatusSub.next(true);
});
wsClient.onDisconnected(() => {
  if (connectionStatusSub.value != false) {
    connectionStatusSub.next(false);
  }
});
wsClient.onReconnected(() => {
  connectionStatusSub.next(true);
});

@Injectable()
export class HammerConfig extends HammerGestureConfig {
  overrides = <any> {
      // I will only use the swap gesture so
      // I will deactivate the others to avoid overlaps
      'pinch': { enable: false },
      'rotate': { enable: false }
  }
}

@NgModule({
  declarations: [AppComponent, LoginComponent, CambiarContrasenhaDialogComponent],
  entryComponents: [],
  imports: [
    BrowserModule,
    IonicModule.forRoot(),
    AppRoutingModule,
    HttpClientModule,
    ApolloModule,
    ReactiveFormsModule,
    FormsModule,
    InventarioModule,
    TransferenciasModule,
    ProductoModule,
    HammerModule,
    NgxCurrencyModule,
    FuncionarioModule,
    NgxQRCodeModule,
    HttpClientModule
    ],
  exports: [
  ],
  providers: [
    {
      provide: HAMMER_GESTURE_CONFIG,
      useClass: HammerConfig
    },
    { provide: LOCALE_ID, useValue: "es-PY" },
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    {
      provide: APOLLO_OPTIONS,
      useFactory(httpLink: HttpLink): ApolloClientOptions<any> {
        const basic = setContext((operation, context) => ({
          // headers: {
          //   Accept: 'charset=utf-8'
          // }
        }));

        const auth = setContext((operation, context) => {
          const token = localStorage.getItem('token');
          if (token === null) {
            return {};
          } else {
            return {
              headers: {
                Authorization: `Token ${token}`,
                "Access-Control-Allow-Origin": "*"
              },
            };
          }
        });

        // Create an http link:
        const http = ApolloLink.from([
          basic,
          auth,
          httpLink.create({
            uri: `http://${serverAdress.serverIp}:${serverAdress.serverPort}/graphql`,
          }),
        ]);

        // Create a WebSocket link:
        const ws = new WebSocketLink(wsClient);

        // using the ability to split links, you can send data to each link
        // depending on what kind of operation is being sent
        const link = errorLink.concat(
          split(
            // split based on operation type

            ({ query }) => {
              const definition = getMainDefinition(query);
              return (
                definition.kind === 'OperationDefinition' &&
                definition.operation === 'subscription'
              );
            },
            ws,
            http
          )
        );

        return {
          link,
          cache: new InMemoryCache(),
        };
      },
      deps: [HttpLink],
    },
    [
      MainService,
      {
        provide: APP_INITIALIZER,
        useFactory: appInit,
        deps: [MainService],
        multi: true,
      },
    ],
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}

export function appInit(appConfigService: MainService) {
  return () => appConfigService.load();
}
