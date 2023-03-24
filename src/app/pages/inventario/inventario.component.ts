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
import { Platform } from '@ionic/angular';
import { Inventario } from './inventario.model';
import { MainService } from 'src/app/services/main.service';
import { SucursalService } from 'src/app/domains/empresarial/sucursal/sucursal.service';
import { GenericListDialogComponent, TableData, GenericListDialogData } from 'src/app/components/generic-list-dialog/generic-list-dialog.component';
import { Sucursal } from 'src/app/domains/empresarial/sucursal/sucursal.model';

@UntilDestroy()
@Component({
  selector: 'app-inventario',
  templateUrl: './inventario.component.html',
  styleUrls: ['./inventario.component.scss'],
  providers: [BarcodeScanner]
})
export class InventarioComponent implements OnInit {

  isWeb = false;

  constructor(private scannerService: ScannerService,
    private cargandoService: CargandoService,
    private inventarioService: InventarioService,
    private dialog: DialogoService,
    private router: Router,
    private route: ActivatedRoute,
    private activatedRoute: ActivatedRoute,
    private barcodeScanner: BarcodeScanner,
    private notificacionService: NotificacionService,
    private modalService: ModalService,
    private mainService: MainService,
    private sucursalService: SucursalService
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
          .subscribe((res: Inventario) => {
            if (res != null && res.sucursal.id == qrData.sucursalId && res.usuario?.id == this.mainService.usuarioActual?.id) {
              this.dialog.open('Atención!!', `Desea abrir el inventario de la sucursal ${res.sucursal.nombre}`, true).then(res2 => {
                if (res2.role == 'aceptar') {
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

  async onNuevoInventario() {
    (await this.sucursalService.onGetAllSucursales()).subscribe((res: Sucursal[]) => {
      if (res.length > 0) {
        let tableData: TableData[] = [
          {
            id: 'id',
            nombre: 'Id',
            width: 20
          },
          {
            id: 'nombre',
            nombre: 'Nombre',
            width: 80
          }
        ];
        let data: GenericListDialogData = {
          tableData: tableData,
          titulo: 'Seleccionar sucursal',
          search: true,
          inicialData: res.filter(s => s.id != 0)
        }

        this.modalService.openModal(GenericListDialogComponent, data).then(res2 => {
          if (res2 != null) {
            console.log(res2);
            this.modalService.openModal(NuevoInventarioComponent, res2).then(res => {
              if(res.data?.inventario?.id!=null){
                this.router.navigate(['list/info', res.data.inventario.id], { relativeTo: this.route });
              } else {

              }
            })
          }
        })
      }
    })

  }

}
