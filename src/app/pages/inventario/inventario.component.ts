import { NuevoInventarioComponent } from './nuevo-inventario/nuevo-inventario.component';
import { ModalService } from './../../services/modal.service';
import { descodificarQr, QrData } from './../../generic/utils/qrUtils';
import { NotificacionService, TipoNotificacion } from 'src/app/services/notificacion.service';
import { BarcodeScanner } from '@awesome-cordova-plugins/barcode-scanner/ngx';
import { untilDestroyed, UntilDestroy } from '@ngneat/until-destroy';
import { DialogoService } from './../../services/dialogo.service';
import { InventarioService } from './inventario.service';
import { CargandoService } from './../../services/cargando.service';
import { ScannerService } from '../../components/qr-scanner-dialog/scanner.service';
import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { TipoEntidad } from 'src/app/domains/enums/tipo-entidad.enum';

@UntilDestroy()
@Component({
  selector: 'app-inventario',
  templateUrl: './inventario.component.html',
  styleUrls: ['./inventario.component.scss'],
  providers: [BarcodeScanner]
})
export class InventarioComponent implements OnInit {


 constructor(private scannerService: ScannerService,
    private cargandoService: CargandoService,
    private inventarioService: InventarioService,
    private dialog: DialogoService,
    private router: Router,
    private route: ActivatedRoute,
    private activatedRoute: ActivatedRoute,
    private barcodeScanner: BarcodeScanner,
    private notificacionService: NotificacionService,
    private modalService: ModalService
  ) { }

  async ngOnInit() {

  }

  async onScanQr() {
    let loading = await this.cargandoService.open('Abriendo camara...')
    setTimeout(() => {
      this.cargandoService.close(loading)
    }, 1000);
    this.barcodeScanner.scan().then(async barcodeData => {
      this.notificacionService.open('Escaneado con éxito!', TipoNotificacion.SUCCESS, 1)
      let codigo: string = barcodeData.text;
      let qrData: QrData = descodificarQr(codigo);
      if (qrData.tipoEntidad == TipoEntidad.INVENTARIO && qrData.sucursalId != null && qrData.idCentral != null) {
        (await this.inventarioService.onGetInventario(qrData.idCentral))
          .pipe(untilDestroyed(this))
          .subscribe(res => {
            if (res != null && res.sucursal.id == qrData.sucursalId) {
              this.dialog.open('Atención!!', `Desea abrir el inventario de la sucursal ${res.sucursal.nombre}`, true).then(res2 => {
                if(res2.role=='aceptar'){
                  this.router.navigate(['list/info', res.id], { relativeTo: this.route });
                }
              })
            } else {
              this.notificacionService.openItemNoEncontrado()
            }
          })
      } else {
        this.notificacionService.openItemNoEncontrado()
      }
    }).catch(err => {
      this.notificacionService.openAlgoSalioMal()
    });
  }

  onNuevoInventario(){
    this.modalService.openModal(NuevoInventarioComponent).then(res => {
      console.log(res)
      if(res.data?.inventario!=null){
        this.router.navigate(['list/info', res.data.inventario.id], { relativeTo: this.route });
      } else {

      }
    })
  }

}
