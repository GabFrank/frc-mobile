import { DialogoService } from './../../../services/dialogo.service';
import { LoginService } from 'src/app/services/login.service';
import { Router } from '@angular/router';
import { NotificacionService, TipoNotificacion } from 'src/app/services/notificacion.service';
import { Inventario, InventarioEstado, TipoInventario } from './../inventario.model';
import { untilDestroyed, UntilDestroy } from '@ngneat/until-destroy';
import { descodificarQr, QrData } from './../../../generic/utils/qrUtils';
import { ModalService } from './../../../services/modal.service';
import { BarcodeScanner } from '@awesome-cordova-plugins/barcode-scanner/ngx';
import { InventarioService } from './../inventario.service';
import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { SucursalService } from 'src/app/domains/empresarial/sucursal/sucursal.service';
import { Sucursal } from 'src/app/domains/empresarial/sucursal/sucursal.model';

@UntilDestroy()
@Component({
  selector: 'app-nuevo-inventario',
  templateUrl: './nuevo-inventario.component.html',
  styleUrls: ['./nuevo-inventario.component.scss'],
  providers: [
    BarcodeScanner
  ]
})
export class NuevoInventarioComponent implements OnInit {

  selectedSucursal: Sucursal;
  selectedInventario: Inventario;
  isNew = false;

  constructor(
    private inventarioService: InventarioService,
    private barcodeScanner: BarcodeScanner,
    private modalService: ModalService,
    private notificacionService: NotificacionService,
    private router: Router,
    private sucursalService: SucursalService,
    public loginService: LoginService,
    private dialogoService: DialogoService
  ) { }

  ngOnInit() {

  }

  async cargarDatos(sucId) {
    (await this.sucursalService.onGetSucursal(sucId))
      .pipe(untilDestroyed(this))
      .subscribe(async res => {
        if (res != null) {
          this.selectedSucursal = res;
          (await this.inventarioService.onGetInventarioAbiertoPorSucursal(sucId))
            .pipe(untilDestroyed(this))
            .subscribe(res2 => {
              if (res2.length > 0) {
                this.selectedInventario = res2[0];
                this.modalService.closeModal({ inventario: this.selectedInventario })
                this.notificacionService.open('Hay un inventario abierto en esta sucursal', TipoNotificacion.WARN, 2)
              } else {
                this.isNew = true;
              }
            })
        }
      })

  }

  onScanQr() {
    this.barcodeScanner.scan().then(async barcodeData => {
      if (barcodeData.text != null) {
        let qrData: QrData;
        qrData = descodificarQr(barcodeData.text)
        ;(await this.inventarioService.onGetInventarioAbiertoPorSucursal(qrData.sucursalId))
          .pipe(untilDestroyed(this))
          .subscribe(res => {
            if (res.length > 0) {
              this.selectedInventario = res[0];
              this.cargarDatos(this.selectedInventario?.id)
            }
          })
      } else {

      }
    })
  }

  onBack() {
    this.modalService.closeModal(null)
  }

  onCancel() {
    this.onBack()
  }
  onAceptar() {
    let inventario = new Inventario;
    inventario.abierto = true;
    inventario.estado = InventarioEstado.ABIERTO;
    inventario.sucursal = this.selectedSucursal;
    inventario.tipo = TipoInventario.ZONA;
    inventario.usuario = this.loginService.usuarioActual;
    this.dialogoService.open('Atención!!', 'Estas iniciando un nuevo inventario. Desea continuar?').then(async res => {
      if (res.role = 'aceptar') {
        (await this.inventarioService.onSaveInventario(inventario.toInput()))
          .pipe(untilDestroyed(this))
          .subscribe(res => {
            if (res != null) {
              this.modalService.closeModal({ inventario: res })
            }
          })
      }
    })
  }


}
