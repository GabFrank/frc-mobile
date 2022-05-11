import { CargandoService } from './../../services/cargando.service';
import { LoginService } from 'src/app/services/login.service';
import { TipoNotificacion } from './../../services/notificacion.service';
import { MainService } from './../../services/main.service';
import { Inventario, InventarioEstado, InventarioProducto, InventarioProductoItem, Sector } from './inventario.model';
import { Injectable } from '@angular/core';
import { NotificacionService } from 'src/app/services/notificacion.service';
import { Producto } from 'src/app/domains/productos/producto.model';
import { DialogoService } from 'src/app/services/dialogo.service';
import { Route, Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class InventarioService {

  selectedInventario: Inventario;

  constructor(private loginService: LoginService,
    private notificacionService: NotificacionService,
    private dialog: DialogoService,
    private cargandoService: CargandoService,
    private router: Router
  ) { }

  getInventarioProducto(id): InventarioProducto {
    return this.selectedInventario?.inventarioProductoList.find(p => {
      if (p?.id == id) {
        return true
      }
    });
  }

  crearInventario() {
    this.dialog.open('Atención!!', 'Desea iniciar el inventario?', true).then(async res => {
      switch (res['role']) {
        case 'aceptar':
          let loading = await this.cargandoService.open('Creando sesion de inventario');
          let inventario = new Inventario();
          inventario.id = 432;
          inventario.abierto = true;
          inventario.estado = InventarioEstado.ABIERTO;
          inventario.fechaInicio = new Date();
          inventario.usuario = this.loginService.usuarioActual;

          //productos
          let producto1 = new Producto;
          producto1.id = 12;
          producto1.descripcion = 'BRAHMA DUPLO MALTE BOT 330 ML';
          let producto2 = new Producto;
          producto2.id = 44;
          producto2.descripcion = 'BRAHMA LITRO RETORNABLE';
          let producto3 = new Producto;
          producto3.id = 543;
          producto3.descripcion = 'BRAHMA SUB ZERO LATA 269 ML ';
          let producto4 = new Producto;
          producto4.id = 98;
          producto4.descripcion = 'BUDWEISER 66 BOT 330 ML';

          //inventarioProducto
          let invProd1 = new InventarioProducto;
          invProd1.id = 1;
          invProd1.inventario = inventario;
          invProd1.producto = producto1;

          let invProd2 = new InventarioProducto;
          invProd2.id = 2;
          invProd2.inventario = inventario;
          invProd2.producto = producto2;

          let invProd3 = new InventarioProducto;
          invProd3.id = 3;
          invProd3.inventario = inventario;
          invProd3.producto = producto3;

          let invProd4 = new InventarioProducto;
          invProd4.id = 4;
          invProd4.inventario = inventario;
          invProd4.producto = producto4;

          //sectores
          let sector1 = new Sector(1, 'CAMARA FRIA', true)
          let sector2 = new Sector(1, 'DEPOSITO', true)
          let sector3 = new Sector(1, 'VISICOOLER', true)

          // InventarioProductoItem
          let invProItem1 = new InventarioProductoItem(1, invProd1, sector1, 12, 40, '10-09-2022', this.loginService.usuarioActual, new Date())
          let invProItem2 = new InventarioProductoItem(2, invProd1, sector2, 12, 80, '01-11-2022', this.loginService.usuarioActual, new Date())
          let invProItem3 = new InventarioProductoItem(3, invProd1, sector3, 1, 38, '10-09-2022', this.loginService.usuarioActual, new Date())
          let invProItem4 = new InventarioProductoItem(4, invProd2, sector1, 12, 20, '10-05-2022', this.loginService.usuarioActual, new Date())
          let invProItem5 = new InventarioProductoItem(5, invProd3, sector2, 12, 120, '01-05-2022', this.loginService.usuarioActual, new Date())

          invProd1.inventarioProductoItemList.push(invProItem1, invProItem2, invProItem3)
          invProd2.inventarioProductoItemList.push(invProItem4, invProItem5)
          invProd3.inventarioProductoItemList.push(invProItem4, invProItem5)
          invProd4.inventarioProductoItemList.push(invProItem4, invProItem5)

          inventario.inventarioProductoList.push(invProd1, invProd2, invProd3, invProd4);

          this.notificacionService.open('Inventario creado con éxito', TipoNotificacion.SUCCESS, 2)
          this.selectedInventario = inventario; await loading.dismiss()
          this.router.navigate(['/inventario/session-info']);
          break;
        case 'cancelar':
        default:
          this.router.navigate(['']);
          break;
      }
    })

  }
}
