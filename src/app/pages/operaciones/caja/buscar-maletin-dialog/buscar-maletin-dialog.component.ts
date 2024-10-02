import { AfterViewInit, Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { UntypedFormControl, FormGroup, Validators } from '@angular/forms';
import { PopOverService } from 'src/app/services/pop-over.service';
import { MaletinService } from '../../maletin/maletin.service';
import { Maletin } from '../../maletin/maletin.model';
import { NotificacionService } from 'src/app/services/notificacion.service';
import { IonInput } from '@ionic/angular';
import { Location } from '@angular/common';
import { ModalService } from 'src/app/services/modal.service';
import { CajaService } from '../caja.service';

export class BuscarMaletinData {

}

@Component({
  selector: 'app-buscar-maletin-dialog',
  templateUrl: './buscar-maletin-dialog.component.html',
  styleUrls: ['./buscar-maletin-dialog.component.scss'],
})
export class BuscarMaletinDialogComponent implements OnInit, AfterViewInit {

  @ViewChild('buscarInput', { read: IonInput }) buscarInput: IonInput;

  selectedMaletin: Maletin;
  codigoControl = new UntypedFormControl(null, Validators.required)

  @Input() data: BuscarMaletinData;

  constructor(
    private modalService: ModalService,
    private maletinService: MaletinService,
    private notificacionService: NotificacionService,
    private _location: Location,
    private cajaService: CajaService
  ) {
  }

  onBack() {
    this._location.back()
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.buscarInput.setFocus();
    },500);
  }

  ngOnInit() {

  }

  async onBuscarClick() {
    (await this.maletinService.onGetPorDescripcion(this.codigoControl.value)).subscribe(res => {
      if (res != null) {
        this.selectedMaletin = res;
        if (this.selectedMaletin.abierto == true) {
          this.notificacionService.warn('Este maletin esta siendo utilizado en este momento')
          setTimeout(async () => {
            let input = await this.buscarInput.getInputElement()
            input.select()
          }, 1000);
        } else {
          this.notificacionService.success('Maletin seleccionado con éxito')
          this.modalService.closeModal(this.selectedMaletin)
        }
      } else {
        this.notificacionService.warn('Maletin no encontrado')
        setTimeout(async () => {
          let input = await this.buscarInput.getInputElement()
          input.select()
        }, 1000);
      }
    })
  }

  onCameraClick() {

  }

  onCancel() {
    this.modalService.closeModal(null)
  }

}
