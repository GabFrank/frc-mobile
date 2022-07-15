import { CargandoService } from './../../../services/cargando.service';
import { TipoEntidad } from './../../../domains/enums/tipo-entidad.enum';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TransferenciaService } from './../transferencia.service';
import { IngresarCodigoPopComponent } from './../ingresar-codigo-pop/ingresar-codigo-pop.component';
import { PopOverService } from './../../../services/pop-over.service';
import { QrScannerDialogComponent } from './../../../components/qr-scanner-dialog/qr-scanner-dialog.component';
import { ModalService } from './../../../services/modal.service';
import { NotificacionService, TipoNotificacion } from 'src/app/services/notificacion.service';
import { BarcodeFormat, ScannerService } from '../../../components/qr-scanner-dialog/scanner.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Component, OnInit } from '@angular/core';
import { BarcodeScanner, BarcodeScannerOptions } from '@awesome-cordova-plugins/barcode-scanner/ngx';
import { Platform } from '@ionic/angular';
import { MainService } from 'src/app/services/main.service';
import { SucursalService } from 'src/app/domains/empresarial/sucursal/sucursal.service';

declare let window: any; // Don't forget this part!


@UntilDestroy()
@Component({
  selector: 'app-transferencia',
  templateUrl: './transferencia.component.html',
  styleUrls: ['./transferencia.component.scss'],
  providers: [BarcodeScanner]
})
export class TransferenciaComponent implements OnInit {

  hideContent = false;

  showScanner = true;

  isWeb = false;


  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private notificacionService: NotificacionService,
    private popoverService: PopOverService,
    private transferenciaService: TransferenciaService,
    private barcodeScanner: BarcodeScanner,
    private cargandoService: CargandoService,
    private plf: Platform,
    private sucursalService: SucursalService
  ) {
    this.isWeb = this.plf.platforms().includes('mobileweb')
  }

  ngOnInit() { }

  goTo(link) {
    this.router.navigate([link], { relativeTo: this.route });
  }

  async onScanQr() {
    let loading = await this.cargandoService.open('Abriendo camara...')
    setTimeout(() => {
      this.cargandoService.close(loading)
    }, 1000);
    if(!this.isWeb){
      this.barcodeScanner.scan().then(async barcodeData => {
        this.notificacionService.open('Escaneado con éxito!', TipoNotificacion.SUCCESS, 1)
        let codigo: string = barcodeData.text;
        let arr = codigo.split('-')
        let prefix = arr[2]
        let sucId: number = +arr[1]
        let transferenciaId = arr[3]
        if (prefix == TipoEntidad.TRANSFERENCIA && sucId != null && transferenciaId != null) {
          (await this.transferenciaService.onGetTransferencia(+transferenciaId))
            .pipe(untilDestroyed(this))
            .subscribe(res => {
              if (res != null && ((res.sucursalOrigen.id == sucId || res.sucursalDestino.id == sucId))) {
                this.router.navigate(['list/info', res.id], { relativeTo: this.route });
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
    } else {
      this.router.navigate(['list/info', 15], { relativeTo: this.route });
    }

  }

  ingresarCodigo() {
    this.popoverService.open(IngresarCodigoPopComponent).then(async res => {
      if (res != null) {
        let codigo: string = res.data;
        let arr = codigo.split('-')
        let prefix = arr[0]
        let sucId: number = +arr[1]
        let transferenciaId = arr[2]
        if (prefix == TipoEntidad.TRANSFERENCIA && sucId != null && transferenciaId != null) {
          (await this.transferenciaService.onGetTransferencia(+transferenciaId))
            .pipe(untilDestroyed(this))
            .subscribe(res => {
              if (res != null && (res.sucursalOrigen.id == sucId || res.sucursalDestino.id == sucId)) {
                this.router.navigate(['list/info', res.id], { relativeTo: this.route });
              } else {
                this.notificacionService.openItemNoEncontrado()
              }
            })
        } else {
          this.notificacionService.openItemNoEncontrado()
        }
      }
    })
  }

}
