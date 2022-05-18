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

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private notificacionService: NotificacionService,
    private popoverService: PopOverService,
    private transferenciaService: TransferenciaService,
    private barcodeScanner: BarcodeScanner,
    private cargandoService: CargandoService
  ) { }

  ngOnInit() { }

  goTo(link) {
    this.router.navigate([link], { relativeTo: this.route });
  }

  async onScanQr() {
    this.cargandoService.open('Abriendo camara...')
    setTimeout(() => {
      this.cargandoService.close()
    }, 1000);
    this.barcodeScanner.scan().then(barcodeData => {
      this.notificacionService.open('Escaneado con éxito!', TipoNotificacion.SUCCESS, 1)
      let codigo: string = barcodeData.text;
      let arr = codigo.split('-')
      let prefix = arr[2]
      let sucId: number = +arr[1]
      let transferenciaId = arr[3]
      if (prefix == TipoEntidad.TRANSFERENCIA && sucId != null && transferenciaId != null) {
        this.transferenciaService.onGetTransferencia(+transferenciaId)
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
    }).catch(err => {
      this.notificacionService.openAlgoSalioMal()
    });
  }

  ingresarCodigo() {
    this.popoverService.open(IngresarCodigoPopComponent).then(res => {
      if (res != null) {
        let codigo: string = res.data;
        let arr = codigo.split('-')
        let prefix = arr[0]
        let sucId: number = +arr[1]
        let transferenciaId = arr[2]
        if (prefix == TipoEntidad.TRANSFERENCIA && sucId != null && transferenciaId != null) {
          this.transferenciaService.onGetTransferencia(+transferenciaId)
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
