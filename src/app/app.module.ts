import { CommonModule, registerLocaleData } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import localePY from '@angular/common/locales/es-PY';
import {
  APP_INITIALIZER,
  CUSTOM_ELEMENTS_SCHEMA,
  Injectable,
  LOCALE_ID,
  NgModule
} from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  BrowserModule,
  HAMMER_GESTURE_CONFIG,
  HammerGestureConfig,
  HammerModule
} from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';
import {
  ApolloClientOptions,
  ApolloLink,
  InMemoryCache,
  split
} from '@apollo/client/core';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import { WebSocketLink } from '@apollo/client/link/ws';
import { getMainDefinition } from '@apollo/client/utilities';
import { FingerprintAIO } from '@ionic-native/fingerprint-aio/ngx';
import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { NgxQRCodeModule } from '@techiediaries/ngx-qrcode';
import { APOLLO_OPTIONS, ApolloModule } from 'apollo-angular';
import { HttpLink } from 'apollo-angular/http';
import { BehaviorSubject } from 'rxjs';
import { environment, serverAdress } from 'src/environments/environment';
import { SubscriptionClient } from 'subscriptions-transport-ws';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { CambiarContrasenhaDialogComponent } from './dialog/login/cambiar-contrasenha-dialog/cambiar-contrasenha-dialog.component';
import { LoginComponent } from './dialog/login/login.component';
import { FuncionarioModule } from './pages/funcionario/funcionario.module';
import { InventarioModule } from './pages/inventario/inventario.module';
import { StockPorSucursalDialogComponent } from './pages/operaciones/movimiento-stock/stock-por-sucursal-dialog/stock-por-sucursal-dialog.component';
import { ProductoModule } from './pages/producto/producto.module';
import { TransferenciasModule } from './pages/transferencias/transferencias.module';
import { MainService } from './services/main.service';
import { NgxCurrencyModule } from 'ngx-currency';
import { MarcacionModule } from './pages/marcacion/marcacion.module';
import { EnumToStringPipe } from './generic/utils/pipes/enum-to-string';

registerLocaleData(localePY);

switch (localStorage.getItem('serverIp')) {
  case null:
    localStorage.setItem('serverIp', serverAdress.serverIp);
    localStorage.setItem('serverPort', serverAdress.serverPort);
    break;
  case '':
    localStorage.setItem('serverIp', serverAdress.serverIp);
    localStorage.setItem('serverPort', serverAdress.serverPort);
    break;
  case 'null':
    localStorage.setItem('serverIp', serverAdress.serverIp);
    localStorage.setItem('serverPort', serverAdress.serverPort);
    break;
  default:
    break;
}

const uri = `http://${localStorage.getItem('serverIp')}:${localStorage.getItem(
  'serverPort'
)}/graphql`;
const wUri = `ws://${localStorage.getItem('serverIp')}:${localStorage.getItem(
  'serverPort'
)}/subscriptions`;

const errorLink = onError(({ graphQLErrors, networkError }) => {});

const wsClient = new SubscriptionClient(wUri, {
  reconnect: true
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
  overrides = <any>{
    // I will only use the swap gesture so
    // I will deactivate the others to avoid overlaps
    pinch: { enable: false },
    rotate: { enable: false }
  };
}

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  declarations: [
    AppComponent,
    LoginComponent,
    CambiarContrasenhaDialogComponent,
    StockPorSucursalDialogComponent
  ],
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
    HttpClientModule,
    CommonModule
  ],
  exports: [],
  providers: [
    FingerprintAIO,
    {
      provide: HAMMER_GESTURE_CONFIG,
      useClass: HammerConfig
    },
    { provide: LOCALE_ID, useValue: 'es-PY' },
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
                'Access-Control-Allow-Origin': '*'
              }
            };
          }
        });
        // Create an http link:
        const http = ApolloLink.from([
          basic,
          auth,
          httpLink.create({
            uri: uri
          })
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
          cache: new InMemoryCache()
        };
      },
      deps: [HttpLink]
    },
    [
      MainService,
      {
        provide: APP_INITIALIZER,
        useFactory: appInit,
        deps: [MainService],
        multi: true
      }
    ]
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}

export function appInit(appConfigService: MainService) {
  return () => appConfigService.load();
}
