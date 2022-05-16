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

@UntilDestroy()
@Component({
  selector: 'app-transferencia',
  templateUrl: './transferencia.component.html',
  styleUrls: ['./transferencia.component.scss'],
})
export class TransferenciaComponent implements OnInit {

  showScanner = true;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private scannerService: ScannerService,
    private notificacionService: NotificacionService,
    private modalService: ModalService,
    private popoverService: PopOverService,
    private transferenciaService: TransferenciaService
  ) { }

  ngOnInit() { }

  goTo(link) {
    this.router.navigate([link], { relativeTo: this.route });
  }

  onScanQr() {
    this.scannerService.scan()
  }

  ingresarCodigo() {
    this.popoverService.open(IngresarCodigoPopComponent).then(res => {
      if (res != null) {
        let codigo: string = res.data;
        let arr = codigo.split('-')
        let prefix = arr[0]
        let sucId = arr[1]
        let transferenciaId = arr[2]
        if (prefix==TipoEntidad.TRANSFERENCIA && sucId != null && transferenciaId != null) {
          this.transferenciaService.onGetTransferencia(+transferenciaId)
            .pipe(untilDestroyed(this))
            .subscribe(res => {
              this.router.navigate(['list/info', res.id], { relativeTo: this.route });
            })
        }
      }
    })
  }

}
