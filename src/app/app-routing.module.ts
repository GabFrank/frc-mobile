import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
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
    path: 'producto',
    loadChildren: () => import('./pages/producto/producto.module').then(m => m.ProductoModule)
  },
  {
    path: 'pre-registro',
    loadChildren: () => import('./pages/funcionario/funcionario.module').then(m => m.FuncionarioModule)
  },
  {
    path: 'marcacion',
    loadChildren: () => import('./pages/marcacion/marcacion.module').then(m => m.MarcacionModule)
  },
  {
    path: 'salir',
    component: SalirComponent
  },
  {
    path: 'transferencias',
    loadChildren: () => import('./pages/transferencias/transferencias.module').then(m => m.TransferenciasModule)
  },
  {
    path: 'splash',
    loadChildren: () => import('./splash/splash.module').then( m => m.SplashPageModule)
  },
  {
    path: 'operaciones',
    loadChildren: () => import('./pages/operaciones/operaciones.module').then( m => m.OperacionesModule)
  },
  {
    path: 'informaciones-personales',
    loadChildren: () => import('./pages/informaciones-personales/informaciones-personales.module').then( m => m.InformacionesPersonalesModule)
  },
  {
    path: 'mis-finanzas',
    loadChildren: () => import('./pages/mis-finanzas/mis-finanzas.module').then( m => m.MisFinanzasModule)
  }
];
@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}
