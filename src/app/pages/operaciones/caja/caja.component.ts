import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BarcodeScanner } from '@awesome-cordova-plugins/barcode-scanner/ngx';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { GenericListDialogComponent, GenericListDialogData } from 'src/app/components/generic-list-dialog/generic-list-dialog.component';
import { SucursalService } from 'src/app/domains/empresarial/sucursal/sucursal.service';
import { descodificarQr, QrData } from 'src/app/generic/utils/qrUtils';
import { DialogoService } from 'src/app/services/dialogo.service';
import { MainService } from 'src/app/services/main.service';
import { ModalService } from 'src/app/services/modal.service';
import { NotificacionService, TipoNotificacion } from 'src/app/services/notificacion.service';
import { Maletin } from '../maletin/maletin.model';
import { MaletinService } from '../maletin/maletin.service';
import { BuscarMaletinDialogComponent } from './buscar-maletin-dialog/buscar-maletin-dialog.component';
import { PdvCaja } from './caja.model';
import { CajaService } from './caja.service';

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-caja',
  templateUrl: './caja.component.html',
  styleUrls: ['./caja.component.scss'],
  providers: [BarcodeScanner]
})
export class CajaComponent implements OnInit {

  tentativas = 0;
  inventarioService: any;
  dialog: any;

  constructor(
    private cajaService: CajaService,
    private router: Router,
    private route: ActivatedRoute,
    private sucursalService: SucursalService,
    private barcodeScaner: BarcodeScanner,
    private dialogoService: DialogoService,
    private notificacionService: NotificacionService,
    private mainService: MainService,
    private modalService: ModalService,
    private maletinService: MaletinService
  ) { }

  ngOnInit() { }

  async buscarCaja() {
    (await this.cajaService.onGetByUsuarioIdAndAbierto(this.mainService.usuarioActual?.id)).subscribe(res => {
      console.log(res);
      if (res.length > 0) {
        console.log(res);

        let data: GenericListDialogData = {
          titulo: 'Lista de cajas',
          tableData: [
            {
              id: 'id',
              nombre: 'ID',
              width: 3
            },
            {
              id: 'sucursal',
              nombre: 'Sucursal',
              nested: true,
              nestedId: 'nombre',
              width: 9
            },
            {
              id: 'fechaApertura',
              nombre: 'Fecha de apertura',
              width: 12
            }
          ],
          inicialData: res,
          search: false
        }
        console.log(data);

        this.modalService.openModal(GenericListDialogComponent, data).then(res => {
          if (res != null) {
            this.cajaService.selectedCaja = res['data'];
            this.router.navigate(['info'], { relativeTo: this.route });
          }
        })
      }
    })
  }

  async abrirCaja() {
    this.modalService.openModal(BuscarMaletinDialogComponent).then(res => {
      if(res!=null){
        // this.veri
      }
    })
  }

  async buscarHistoricoDeCajas(){
    (await this.cajaService.onGetByUsuarioId(this.mainService.usuarioActual?.id)).subscribe(res => {
      if (res.length > 0) {
        let data: GenericListDialogData = {
          titulo: 'Lista de cajas',
          tableData: [
            {
              id: 'id',
              nombre: 'ID',
              width: 3
            },
            {
              id: 'sucursal',
              nombre: 'Sucursal',
              nested: true,
              nestedId: 'nombre',
              width: 9
            },
            {
              id: 'fechaApertura',
              nombre: 'Fecha de apertura',
              width: 12
            },
            {
              id: 'fechaCierre',
              nombre: 'Fecha de cierre',
              width: 12
            }
          ],
          inicialData: res,
          search: false
        }
        this.modalService.openModal(GenericListDialogComponent, data).then(async res => {
          if (res != null) {
            this.cajaService.selectedCaja = res['data'];
            (await this.cajaService.onGetById(this.cajaService.selectedCaja?.id, this.cajaService.selectedCaja?.sucursal?.id)).subscribe(res2 => {
              if(res2!=null){
                this.cajaService.selectedCaja = res2;
                this.router.navigate(['info'], { relativeTo: this.route });
              }
            })
          }
        })
      }
    })
  }

  // async verificarMaletin(maletin: Maletin) {
  //   (await this.maletinService
  //     .onGetPorDescripcion(maletin.descripcion, this.cajaService.selectedCaja.sucursal.id)).pipe(untilDestroyed(this))
  //     .subscribe((res) => {
  //       if (res != null) {
  //         let maletinEncontrado: Maletin = res;
  //         if (maletinEncontrado.abierto == true) {
  //           this.notificacionService.warn('Este maletín está siendo utilizado')
  //           this.seleccionarMaletin(null);
  //         } else {
  //           this.notificacionService.success('Verificado con éxito')
  //           this.seleccionarMaletin(maletinEncontrado);
  //         }
  //       } else {
  //         this.notificacionService.danger('Maletín no encontrado')
  //         this.seleccionarMaletin(null);
  //       }
  //     });
  // }
}
