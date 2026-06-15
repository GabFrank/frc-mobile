import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { DialogoService } from 'src/app/services/dialogo.service';
import { ModalService } from 'src/app/services/modal.service';
import { MonedaBillete } from '../../moneda/moneda-billetes/moneda-billetes.model';
import { Moneda } from '../../moneda/moneda.model';
import { MonedaService } from '../../moneda/moneda.service';
import { ConteoMoneda } from '../conteo-moneda/conteo-moneda.model';
import { Conteo } from '../conteo.model';

@UntilDestroy()
@Component({
  selector: 'app-adicionar-conteo-cierre-dialog',
  templateUrl: './adicionar-conteo-cierre-dialog.component.html',
  styleUrls: ['./adicionar-conteo-cierre-dialog.component.scss'],
})
export class AdicionarConteoCierreDialogComponent implements OnInit {

  @ViewChild('rs') rsInput: ElementRef;

  @Input()
  data: any;

  moneda = 'gs';
  totalGs = 0;
  totalRs = 0;
  totalDs = 0;

  gsFormGroup: UntypedFormGroup;
  rsFormGroup: UntypedFormGroup;
  dsFormGroup: UntypedFormGroup;
  conteoMonedaList: ConteoMoneda[];
  guaraniList: MonedaBillete[];
  realList: MonedaBillete[];
  dolarList: MonedaBillete[];
  guarani: Moneda;
  real: Moneda;
  dolar: Moneda;

  constructor(
    private modalService: ModalService,
    private dialogoService: DialogoService,
    private monedaService: MonedaService
  ) {
    this.gsFormGroup = new UntypedFormGroup({
      '500': new UntypedFormControl(null, [Validators.min(0)]),
      '1000': new UntypedFormControl(null, [Validators.min(0)]),
      '2000': new UntypedFormControl(null, [Validators.min(0)]),
      '5000': new UntypedFormControl(null, [Validators.min(0)]),
      '10000': new UntypedFormControl(null, [Validators.min(0)]),
      '20000': new UntypedFormControl(null, [Validators.min(0)]),
      '50000': new UntypedFormControl(null, [Validators.min(0)]),
      '100000': new UntypedFormControl(null, [Validators.min(0)]),
    });
    this.rsFormGroup = new UntypedFormGroup({
      '0.05': new UntypedFormControl(null, [Validators.min(0)]),
      '0.1': new UntypedFormControl(null, [Validators.min(0)]),
      '0.25': new UntypedFormControl(null, [Validators.min(0)]),
      '0.5': new UntypedFormControl(null, [Validators.min(0)]),
      '1': new UntypedFormControl(null, [Validators.min(0)]),
      '2': new UntypedFormControl(null, [Validators.min(0)]),
      '5': new UntypedFormControl(null, [Validators.min(0)]),
      '10': new UntypedFormControl(null, [Validators.min(0)]),
      '20': new UntypedFormControl(null, [Validators.min(0)]),
      '50': new UntypedFormControl(null, [Validators.min(0)]),
      '100': new UntypedFormControl(null, [Validators.min(0)]),
      '200': new UntypedFormControl(null, [Validators.min(0)]),
    });
    this.dsFormGroup = new UntypedFormGroup({
      '1': new UntypedFormControl(null, [Validators.min(0)]),
      '5': new UntypedFormControl(null, [Validators.min(0)]),
      '10': new UntypedFormControl(null, [Validators.min(0)]),
      '20': new UntypedFormControl(null, [Validators.min(0)]),
      '50': new UntypedFormControl(null, [Validators.min(0)]),
      '100': new UntypedFormControl(null, [Validators.min(0)]),
    });

    this.cargarMonedas();
  }

  ngOnInit() {
    this.gsFormGroup.valueChanges.pipe(untilDestroyed(this)).subscribe(() => {
      this.sumarGs();
    });
    this.rsFormGroup.valueChanges.pipe(untilDestroyed(this)).subscribe(() => {
      this.sumarRs();
    });
    this.dsFormGroup.valueChanges.pipe(untilDestroyed(this)).subscribe(() => {
      this.sumarDs();
    });
  }

  async cargarMonedas() {
    (await this.monedaService.onGetAll()).pipe(untilDestroyed(this)).subscribe((res) => {
      if (res != null) {
        const monedaList: Moneda[] = res;
        monedaList.forEach((m) => {
          switch (m.denominacion) {
            case 'GUARANI':
              this.guarani = m;
              this.guaraniList = m.monedaBilleteList;
              break;
            case 'REAL':
              this.real = m;
              this.realList = m.monedaBilleteList;
              break;
            case 'DOLAR':
              this.dolar = m;
              this.dolarList = m.monedaBilleteList;
              break;
            default:
              break;
          }
        });
      }
    });
  }

  onBack() {
    this.modalService.closeModal(null);
  }

  tabClick(e) {
    this.moneda = e;
  }

  sumarGs() {
    this.totalGs = 0;
    Object.keys(this.gsFormGroup.controls).forEach(key => {
      this.totalGs += this.gsFormGroup.controls[key].value * +key;
    });
  }

  sumarRs() {
    this.totalRs = 0;
    Object.keys(this.rsFormGroup.controls).forEach(key => {
      this.totalRs += this.rsFormGroup.controls[key].value * +key;
    });
  }

  sumarDs() {
    this.totalDs = 0;
    Object.keys(this.dsFormGroup.controls).forEach(key => {
      this.totalDs += this.dsFormGroup.controls[key].value * +key;
    });
  }

  onGuardar() {
    const conteo = new Conteo();
    conteo.totalGs = this.totalGs;
    conteo.totalRs = this.totalRs;
    conteo.totalDs = this.totalDs;
    conteo.conteoMonedaList = this.createMonedaBilletes();
    this.dialogoService.open('Atención', 'Estas seguro que deseas guardar este conteo de cierre?').then(res => {
      if (res.role == 'aceptar') {
        this.modalService.closeModal({ conteo });
      }
    });
  }

  onCancel() {
    this.modalService.closeModal(null);
  }

  createMonedaBilletes() {
    this.conteoMonedaList = [];
    this.guaraniList?.forEach((e) => {
      const conteoMoneda = new ConteoMoneda();
      const cantidad = this.gsFormGroup.get(`${e.valor}`)?.value;
      if (cantidad != null) {
        conteoMoneda.cantidad = cantidad;
        conteoMoneda.monedaBilletes = e;
        this.conteoMonedaList.push(conteoMoneda);
      }
    });
    this.realList?.forEach((e) => {
      const conteoMoneda = new ConteoMoneda();
      const cantidad = this.rsFormGroup.get(`${e.valor}`)?.value;
      if (cantidad != null) {
        conteoMoneda.cantidad = cantidad;
        conteoMoneda.monedaBilletes = e;
        this.conteoMonedaList.push(conteoMoneda);
      }
    });
    this.dolarList?.forEach((e) => {
      const conteoMoneda = new ConteoMoneda();
      const cantidad = this.dsFormGroup.get(`${e.valor}`)?.value;
      if (cantidad != null) {
        conteoMoneda.cantidad = cantidad;
        conteoMoneda.monedaBilletes = e;
        this.conteoMonedaList.push(conteoMoneda);
      }
    });
    return this.conteoMonedaList;
  }

}
