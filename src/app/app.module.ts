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
import { NgxQRCodeModule } from 'ngx-qrcode2';
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
import { NgxCurrencyDirective } from 'ngx-currency';

import { BarcodeScannerService } from './services/barcode-scanner.service';
import { HomeModule } from './pages/home/home.module';

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

const errorLink = onError(({ graphQLErrors, networkError }) => { });

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
    NgxCurrencyDirective,
    FuncionarioModule,
    NgxQRCodeModule,
    HttpClientModule,
    CommonModule,
    HomeModule
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
        const http = ApolloLink.from([
          basic,
          auth,
          httpLink.create({
            uri: uri
          })
        ]);
        const ws = new WebSocketLink(wsClient);
        const link = errorLink.concat(
          split(
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
    ],
    BarcodeScannerService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }

export function appInit(appConfigService: MainService) {
  return () => appConfigService.load();
}
