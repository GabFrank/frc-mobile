import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BarcodeScanner } from '@awesome-cordova-plugins/barcode-scanner/ngx';
import { Platform } from '@ionic/angular';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { SucursalService } from 'src/app/domains/empresarial/sucursal/sucursal.service';
import { NotificacionService, TipoNotificacion } from 'src/app/services/notificacion.service';
import { TipoEntidad } from './../../../domains/enums/tipo-entidad.enum';
import { CargandoService } from './../../../services/cargando.service';
import { PopOverService } from './../../../services/pop-over.service';
import { IngresarCodigoPopComponent } from './../ingresar-codigo-pop/ingresar-codigo-pop.component';
import { TransferenciaService } from './../transferencia.service';

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
    this.barcodeScanner.scan().then(async barcodeData => {
      this.notificacionService.open('Escaneado con éxito!', TipoNotificacion.SUCCESS, 1)
      let codigo: string = barcodeData.text;
      let arr = codigo.split('-')
      let prefix = arr[2]
      let sucId: number = +arr[1]
      let transferenciaId = arr[3]
      if (prefix == TipoEntidad.TRANSFERENCIA && transferenciaId != null) {
        (await this.transferenciaService.onGetTransferencia(+transferenciaId))
          .pipe(untilDestroyed(this))
          .subscribe(res => {
            if (res != null) {
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
