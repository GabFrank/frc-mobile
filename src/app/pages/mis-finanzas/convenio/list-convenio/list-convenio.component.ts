import { Location } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import {
  GenericListDialogComponent,
  GenericListDialogData,
  TableData
} from 'src/app/components/generic-list-dialog/generic-list-dialog.component';
import { Cliente } from 'src/app/domains/cliente/cliente.model';
import {
  EstadoVentaCredito,
  VentaCredito
} from 'src/app/domains/venta-credito/venta-credito.model';
import { Venta } from 'src/app/domains/venta/venta.model';
import { VentaCreditoService } from 'src/app/graphql/financiero/venta-credito/venta-credito.service';
import { VentaService } from 'src/app/graphql/operaciones/venta/venta.service';
import { ClienteService } from 'src/app/graphql/personas/cliente/graphql/cliente.service';
import { MainService } from 'src/app/services/main.service';
import { MenuActionService } from 'src/app/services/menu-action.service';
import { ModalService } from 'src/app/services/modal.service';

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-list-convenio',
  templateUrl: './list-convenio.component.html',
  styleUrls: ['./list-convenio.component.scss']
})
export class ListConvenioComponent implements OnInit {
  ventaCreditoList: VentaCredito[] = [];
  totalVentaCredito = 0;
  totalAbiertos = 0;
  selectedEstado = EstadoVentaCredito.ABIERTO;
  selectedCliente: Cliente;

  constructor(
    private ventaCreditoService: VentaCreditoService,
    private mainService: MainService,
    private clienteService: ClienteService,
    private _location: Location,
    private menuActionService: MenuActionService,
    private ventaService: VentaService,
    private modalService: ModalService,
    private route: ActivatedRoute
  ) {}

  async ngOnInit() {
    (
      await this.clienteService.onGetByPersonaId(
        this.mainService.usuarioActual?.persona.id
      )
    ).subscribe(async (res) => {
      this.selectedCliente = res;
      if (res != null) {
        (
          await this.ventaCreditoService.onGetPorClienteId(
            res.id,
            this.selectedEstado,
            0,
            1000
          )
        ).subscribe((res3) => {
          this.ventaCreditoList = res3.getContent;
          this.totalVentaCredito = res3.getTotalElements;
          this.calcularTotal();
        });
      }
    });
  }

  calcularTotal() {
    this.ventaCreditoList.forEach((vc) => {
      this.totalAbiertos += vc.valorTotal;
    });
  }

  onItemClick(ventaCredito: VentaCredito) {}

  onBack() {
    this._location.back();
  }

  openFilterMenu() {}

  async openVentaDetalle(venta: Venta) {
    (await this.ventaService.onGetPorId(venta.id, venta.sucursalId)).subscribe(
      (res: Venta) => {
        if (res != null) {
          let tableData: TableData[] = [
            {
              id: 'producto',
              nombre: 'Producto',
              width: 100,
              nested: true,
              nestedId: 'descripcion'
            },
            {
              id: 'presentacion',
              nombre: 'Presentación',
              width: 100,
              nested: true,
              nestedId: 'cantidad'
            },
            {
              id: 'cantidad',
              nombre: 'cantidad',
              width: 100
            },
            {
              id: 'valorTotal',
              nombre: 'Total',
              width: 100
            }
          ];
          let data: GenericListDialogData = {
            tableData: tableData,
            titulo: 'Detalle de venta',
            search: false,
            inicialData: res.ventaItemList
          };

          this.modalService.openModal(GenericListDialogComponent, data);
        }
      }
    );
  }
}
