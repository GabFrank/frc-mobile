import { Component, OnInit } from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import { CajaService } from './caja.service';
import { ActivatedRoute, Router } from '@angular/router';
import { SucursalService } from 'src/app/domains/empresarial/sucursal/sucursal.service';
import { MainService } from 'src/app/services/main.service';
import { ModalService } from 'src/app/services/modal.service';
import { GenericListDialogComponent, GenericListDialogData } from 'src/app/components/generic-list-dialog/generic-list-dialog.component';
import { Conteo } from '../conteo/conteo.model';
import { Maletin } from '../maletin/maletin.model';
import { Sucursal } from 'src/app/domains/empresarial/sucursal/sucursal.model';
import { BuscarMaletinDialogComponent } from './buscar-maletin-dialog/buscar-maletin-dialog.component';
import { AdicionarConteoDialogComponent } from '../conteo/adicionar-conteo-dialog/adicionar-conteo-dialog.component';
import { PdvCaja, PdvCajaEstado } from './caja.model';
import { DialogoService } from 'src/app/services/dialogo.service';

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-caja',
  templateUrl: './caja.component.html',
  styleUrls: ['./caja.component.scss'],
  providers: []
})
export class CajaComponent implements OnInit {

  tentativas = 0;
  dialog: any;


  constructor(
    private cajaService: CajaService,
    private router: Router,
    private route: ActivatedRoute,
    private sucursalService: SucursalService,
    private mainService: MainService,
    private modalService: ModalService,
    private dialogoService: DialogoService
  ) { }

  ngOnInit() { }

  async buscarCaja() {
    const sucursal = await this.seleccionarSucursal();
    if (sucursal != null) {
      await this.buscarCajaEnSucursal(sucursal);
    }
  }

  async buscarCajaEnSucursal(sucursal: Sucursal) {
    (await this.cajaService.onGetByUsuarioIdAndAbiertoPorSucursal(
      this.mainService.usuarioActual?.id,
      sucursal.id
    )).subscribe(async caja => {
      if (caja != null) {
        const sucursalId = caja?.sucursal?.id || caja?.sucursalId || sucursal.id;
        (await this.cajaService.onGetByIdFromFilial(caja.id, sucursalId)).subscribe(cajaDetalle => {
          this.cajaService.selectedCaja = cajaDetalle ?? caja;
          this.router.navigate(['info'], { relativeTo: this.route });
        });
      } else {
        this.dialogoService.open(
          'Sin caja abierta',
          `No hay caja abierta en ${sucursal.nombre} para este usuario.`,
          false
        );
      }
    });
  }

  private seleccionarSucursal(): Promise<Sucursal | null> {
    return new Promise(async (resolve) => {
      (await this.sucursalService.onGetAllSucursales()).subscribe(res => {
        if (res.length === 0) {
          resolve(null);
          return;
        }
        const sucursales = res.filter(s => s.id != 0);
        const data: GenericListDialogData = {
          titulo: 'Lista de sucursales',
          tableData: [
            { id: 'id', nombre: 'ID', width: 3 },
            { id: 'nombre', nombre: 'Sucursal', width: 9 }
          ],
          inicialData: sucursales,
          search: false
        };
        this.modalService.openModal(GenericListDialogComponent, data).then(sucursalRes => {
          resolve(sucursalRes?.['data'] ?? null);
        });
      });
    });
  }

  async abrirCaja() {
    this.cajaService.selectedCaja = null;
    let selectedConteo: Conteo;
    let selectedMaletin: Maletin;

    const selectedSucursal = await this.seleccionarSucursal();
    if (selectedSucursal == null) {
      return;
    }
    selectedMaletin = (await this.modalService.openModal(BuscarMaletinDialogComponent, { sucursalId: selectedSucursal.id }))['data'];
    if (selectedMaletin != null) {
      selectedConteo = (await this.modalService.openModal(AdicionarConteoDialogComponent, { apertura: true }))['data']['conteo'];
      if (selectedConteo != null) {
        let newCaja = new PdvCaja;
        newCaja.maletin = selectedMaletin;
        newCaja.usuario = this.mainService.usuarioActual;
        newCaja.sucursalId = selectedSucursal.id;
        newCaja.activo = true;
        newCaja.estado = PdvCajaEstado['En proceso'];
        newCaja.fechaApertura = new Date();
        (await this.cajaService.onAbrirCaja(newCaja.toInput(), selectedConteo.toInput(), selectedConteo.toInpuList())).subscribe(saveRes => {
          if (saveRes?.exito) {
            this.dialogoService.open('Caja Abierta', 'La caja se abrió correctamente en la sucursal.', false);
            this.buscarCajaEnSucursal(selectedSucursal);
          } else {
            this.dialogoService.open('Error', 'No se pudo conectar a la filial o falló la apertura de caja.', false);
          }
        }, err => {
          this.dialogoService.open('Error', 'Ocurrió un error en el servidor central.', false);
        });
      }
    }
  }

  async buscarHistoricoDeCajas() {
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
            const sucursalId = this.cajaService.selectedCaja?.sucursal?.id || this.cajaService.selectedCaja?.sucursalId;
            (await this.cajaService.onGetByIdFromFilial(this.cajaService.selectedCaja?.id, sucursalId)).subscribe(res2 => {
              if (res2 != null) {
                this.cajaService.selectedCaja = res2;
                this.router.navigate(['info'], { relativeTo: this.route });
              }
            })
          }
        })
      }
    })
  }

}

