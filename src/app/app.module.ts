import { TransferenciasModule } from './pages/transferencias/transferencias.module';
import { BarcodeScanner } from '@ionic-native/barcode-scanner/ngx';
import { InventarioModule } from './pages/inventario/inventario.module';
import { APP_INITIALIZER, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
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
import { BarcodeQrScannerComponent } from './components/barcode-qr-scanner/barcode-qr-scanner.component';

const uri = `http://${serverAdress.serverIp}:${serverAdress.serverPort}`;

const errorLink = onError(({ graphQLErrors, networkError }) => {
  console.log(graphQLErrors, networkError);
  // if (graphQLErrors)
  //   graphQLErrors.map(({ message, locations, path }) =>
  //     errorObs.next({message, locations, path})
  //     console.log(
  //       `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`,
  //     ),
  //   );

  // if (networkError) console.log(`[Network error]: ${networkError}`);
});

@NgModule({
  declarations: [AppComponent, LoginComponent, BarcodeQrScannerComponent],
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
    TransferenciasModule
  ],
  providers: [
    BarcodeScanner,
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
        // const ws = new WebSocketLink(wsClient);

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
            http,
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
