import { Component } from '@angular/core';

/**
 * Pantalla padre del módulo de devoluciones: lista las opciones con nombres
 * claros (nueva, historial, transferir a sucursal = colecta interna, entregar
 * a proveedor = retiro). Mismo patrón que el hub de transferencias.
 */
@Component({
  selector: 'app-devolucion-home',
  templateUrl: './devolucion-home.component.html',
  styleUrls: ['./devolucion-home.component.scss'],
})
export class DevolucionHomeComponent {
  opciones = [
    {
      titulo: 'Nueva devolución',
      descripcion: 'Registrar productos a devolver',
      icono: 'add-circle-outline',
      link: ['nueva'],
    },
    {
      titulo: 'Ver historial',
      descripcion: 'Devoluciones cargadas y su estado',
      icono: 'list-outline',
      link: ['historial'],
    },
    {
      titulo: 'Transferir a sucursal',
      descripcion: 'Colectar separados y llevarlos a un depósito',
      icono: 'cube-outline',
      link: ['colecta'],
    },
    {
      titulo: 'Entregar a proveedor',
      descripcion: 'Retiro consolidado por proveedor',
      icono: 'business-outline',
      link: ['/operaciones/retiro-proveedor'],
    },
    {
      titulo: 'Historial de colectas',
      descripcion: 'Colectas internas: reimprimir o revertir',
      icono: 'swap-horizontal-outline',
      link: ['historial-colectas'],
    },
    {
      titulo: 'Historial de retiros',
      descripcion: 'Retiros a proveedor: reimprimir o revertir',
      icono: 'receipt-outline',
      link: ['historial-retiros'],
    },
  ];
}
