import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { BarcodeQrScannerComponent } from './components/barcode-qr-scanner/barcode-qr-scanner.component';
import { HomeComponent } from './pages/home/home/home.component';
import { SalirComponent } from './pages/salir/salir.component';

const routes: Routes = [
  {
    path: '',
    component: HomeComponent
  },
  {
    path: 'inventario',
    loadChildren: () => import('./pages/inventario/inventario.module').then(m => m.InventarioModule)
  },
  {
    path: 'salir',
    component: SalirComponent
  },
  {
    path: 'scanner',
    component: BarcodeQrScannerComponent
  },
  {
    path: 'transferencias',
    loadChildren: () => import('./pages/transferencias/transferencias.module').then(m => m.TransferenciasModule)
  }
];
@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}
