import { Location } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { UntypedFormControl, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Sucursal } from 'src/app/domains/empresarial/sucursal/sucursal.model';
import { SucursalService } from 'src/app/domains/empresarial/sucursal/sucursal.service';
import { Usuario } from 'src/app/domains/personas/usuario.model';
import { DialogoService } from 'src/app/services/dialogo.service';
import { MainService } from 'src/app/services/main.service';
import { ModalService } from 'src/app/services/modal.service';
import { NotificacionService } from 'src/app/services/notificacion.service';
import { PopOverService, PopoverSize } from 'src/app/services/pop-over.service';
import { BuscarMaletinData, BuscarMaletinDialogComponent } from '../caja/buscar-maletin-dialog/buscar-maletin-dialog.component';
import { PdvCaja, PdvCajaInput } from '../caja/caja.model';
import { CajaService } from '../caja/caja.service';
import { AdicionarConteoDialogComponent } from '../conteo/adicionar-conteo-dialog/adicionar-conteo-dialog.component';
import { ConteoService } from '../conteo/conteo.service';
import { Maletin } from '../maletin/maletin.model';
import { MaletinService } from '../maletin/maletin.service';

@UntilDestroy()
@Component({
  selector: 'app-caja-info',
  templateUrl: './caja-info.component.html',
  styleUrls: ['./caja-info.component.scss'],
})
export class CajaInfoComponent implements OnInit {

  selectedCaja: PdvCaja;
  selectedUsuario: Usuario;
  selectedMaletin: Maletin;
  tentativas = 0;
  isApertura = false;
  descripcionMaletinControl = new UntypedFormControl(null, [Validators.required])

  constructor(
    private route: ActivatedRoute,
    private cajaService: CajaService,
    private mainService: MainService,
    private _location: Location,
    private modalService: ModalService,
    private dialogoService: DialogoService,
    private maletinService: MaletinService,
    private notificacionService: NotificacionService,
    private popoverService: PopOverService,
    private conteoService: ConteoService
  ) { }

  ngOnInit() {
    if (this.cajaService.selectedCaja != null) {
      this.onSelectCaja(this.cajaService.selectedCaja);
      console.log(this.selectedCaja);
    } else {
      this.onBack()
    }
  }

  onSelectCaja(caja: PdvCaja) {
    this.selectedCaja = caja;
    this.selectedUsuario = this.selectedCaja?.usuario;
    this.selectedMaletin = this.selectedCaja?.maletin;
  }

  onBack() {
    this._location.back()
  }

  adicionarConteoCierre() {
    this.modalService.openModal(AdicionarConteoDialogComponent).then(res => {
      console.log(res);
      if (res['data'] != null) {
        this.selectedCaja.conteoCierre = res['data'];
        this.conteoService.onSave(res['data'], this.selectedCaja?.id, false, this.selectedCaja?.sucursal?.id).subscribe(res2 => {
          if(res2!=null){
            this.selectedCaja.conteoCierre = res2;
          }
        })
      }
    })
  }

  adicionarConteoApertura() {
    this.modalService.openModal(AdicionarConteoDialogComponent, true).then(res => {
      if (res['data'] != null) {
        this.cajaService.selectedCaja.conteoCierre = res['data'];
        this.selectedCaja.conteoCierre = res['data'];
      }
    })
  }

  async verificarMaletin() {
    (await this.maletinService
      .onGetPorDescripcion(this.descripcionMaletinControl.value)).pipe(untilDestroyed(this))
      .subscribe((res) => {
        if (res != null) {
          let maletinEncontrado: Maletin = res;
          if (maletinEncontrado.abierto == true) {
            this.notificacionService.warn('Este maletín está siendo utilizado')
            this.seleccionarMaletin(null);
          } else {
            this.notificacionService.success('Verificado con éxito')
            this.seleccionarMaletin(maletinEncontrado);
          }
        } else {
          this.notificacionService.danger('Maletín no encontrado')
          this.seleccionarMaletin(null);
        }
      });
  }

  seleccionarMaletin(maletin: Maletin) {
    if (maletin != null) {
      this.descripcionMaletinControl.setValue(maletin.descripcion);
      this.selectedMaletin = maletin;
      this.crearNuevaCaja();
    } else {
      this.descripcionMaletinControl.setValue(null);
    }
  }

  crearNuevaCaja() {
    setTimeout(async () => {
      let input = new PdvCajaInput;
      input.maletinId = this.selectedMaletin.id;
      input.activo = true;
      (await this.cajaService.onSavePorSucursal(input, this.cajaService.selectedCaja.sucursal?.id))
        .pipe(untilDestroyed(this))
        .subscribe(res => {
          if (res != null) {
            this.selectedCaja = res;
            this.selectedCaja.sucursal = this.cajaService.selectedCaja.sucursal;
            this.cajaService.selectedCaja = this.selectedCaja;
            this.notificacionService.success('Caja creada con éxito!!')
            this.adicionarConteoApertura()
          }
        })
    }, 1000);
  }

}
