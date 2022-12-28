import { Location } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { EstadoVentaCredito, VentaCredito } from 'src/app/domains/venta-credito/venta-credito.model';
import { VentaCreditoService } from 'src/app/graphql/financiero/venta-credito/venta-credito.service';
import { ClienteService } from 'src/app/graphql/personas/cliente/graphql/cliente.service';
import { MainService } from 'src/app/services/main.service';
import { MenuActionService } from 'src/app/services/menu-action.service';

@Component({
  selector: 'app-list-convenio',
  templateUrl: './list-convenio.component.html',
  styleUrls: ['./list-convenio.component.scss'],
})
export class ListConvenioComponent implements OnInit {

  ventaCreditoList: VentaCredito[] = []
  totalVentaCredito = 0;
  totalAbiertos = 0;
  selectedEstado = EstadoVentaCredito.ABIERTO;
  constructor(
    private ventaCreditoService: VentaCreditoService,
    private mainService: MainService,
    private clienteService: ClienteService,
    private _location: Location,
    private menuActionService: MenuActionService
  ) { }

  async ngOnInit() {
    (await this.clienteService.onGetByPersonaId(this.mainService.usuarioActual.persona.id)).subscribe(async res => {
      console.log(res);
      if (res != null) {
        (await this.ventaCreditoService.onGetPorClienteId(res.id, this.selectedEstado, 0, this.totalVentaCredito)).subscribe(res3 => {
          this.ventaCreditoList = res3;
          this.totalVentaCredito = this.ventaCreditoList.length;
          this.calcularTotal()
        })
      }
    })
  }

  calcularTotal() {
    this.ventaCreditoList.forEach(vc => {
      this.totalAbiertos += vc.valorTotal;
    })
  }

  onItemClick(ventaCredito: VentaCredito) {
    this.menuActionService.presentActionSheet(
      [
        {
          texto: 'Ver detalles de compra',
          role: 'venta'
        }
      ]
    ).then(res => {
      if (res['role'] == 'venta') {

      }
    })
  }

  onBack() {
    this._location.back()
  }

  openFilterMenu() {

  }

}
