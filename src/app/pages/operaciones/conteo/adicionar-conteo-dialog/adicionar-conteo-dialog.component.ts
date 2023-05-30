import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { DialogoService } from 'src/app/services/dialogo.service';
import { MainService } from 'src/app/services/main.service';
import { ModalService } from 'src/app/services/modal.service';
import { PdvCaja } from '../../caja/caja.model';
import { CajaService } from '../../caja/caja.service';
import { MonedaBillete } from '../../moneda/moneda-billetes/moneda-billetes.model';
import { Moneda } from '../../moneda/moneda.model';
import { MonedaService } from '../../moneda/moneda.service';
import { ConteoMoneda } from '../conteo-moneda/conteo-moneda.model';
import { Conteo } from '../conteo.model';
import { ConteoService } from '../conteo.service';

@UntilDestroy()
@Component({
  selector: 'app-adicionar-conteo-dialog',
  templateUrl: './adicionar-conteo-dialog.component.html',
  styleUrls: ['./adicionar-conteo-dialog.component.scss'],
})
export class AdicionarConteoDialogComponent implements OnInit {

  @ViewChild('rs') rsInput: ElementRef;

  @Input()
  data: any;

  moneda = 'gs';
  totalGs = 0;
  totalRs = 0;
  totalDs = 0;
  selectedCaja: PdvCaja;
  selectedConteo: Conteo;

  isApertura = false;

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
    private monedaService: MonedaService,
    private conteoService: ConteoService,
    private cajaService: CajaService,
    private mainService: MainService
  ) {

    if (cajaService.selectedCaja != null) {
      this.selectedCaja = cajaService.selectedCaja
    } else {
      modalService.closeModal(null)
    }
    this.gsFormGroup = new UntypedFormGroup({
      '500': new UntypedFormControl(null, [Validators.min(0)]),
      '1000': new UntypedFormControl(null, [Validators.min(0)]),
      '2000': new UntypedFormControl(null, [Validators.min(0)]),
      '5000': new UntypedFormControl(null, [Validators.min(0)]),
      '10000': new UntypedFormControl(null, [Validators.min(0)]),
      '20000': new UntypedFormControl(null, [Validators.min(0)]),
      '50000': new UntypedFormControl(null, [Validators.min(0)]),
      '100000': new UntypedFormControl(null, [Validators.min(0)]),
    })
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
    })
    this.dsFormGroup = new UntypedFormGroup({
      '1': new UntypedFormControl(null, [Validators.min(0)]),
      '5': new UntypedFormControl(null, [Validators.min(0)]),
      '10': new UntypedFormControl(null, [Validators.min(0)]),
      '20': new UntypedFormControl(null, [Validators.min(0)]),
      '50': new UntypedFormControl(null, [Validators.min(0)]),
      '100': new UntypedFormControl(null, [Validators.min(0)]),
    })

    this.cargarMonedas()
  }

  ngOnInit() {
    this.isApertura = this.data == true;

    this.gsFormGroup.valueChanges.pipe(untilDestroyed(this)).subscribe(res => {
      this.sumarGs()
    })
    this.rsFormGroup.valueChanges.pipe(untilDestroyed(this)).subscribe(res => {
      this.sumarRs()
    })
    this.dsFormGroup.valueChanges.pipe(untilDestroyed(this)).subscribe(res => {
      this.sumarDs()
    })
  }

  async cargarMonedas() {
    (await this.monedaService.onGetAll()).pipe(untilDestroyed(this)).subscribe((res) => {
      if (res != null) {
        let monedaList: Moneda[] = res;
        monedaList.forEach((m) => {
          switch (m.denominacion) {
            case "GUARANI":
              this.guarani = m;
              this.guaraniList = m.monedaBilleteList;
              break;
            case "REAL":
              this.real = m;
              this.realList = m.monedaBilleteList;
              break;
            case "DOLAR":
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
    this.modalService.closeModal(null)
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
    let conteo = new Conteo();
    conteo.totalGs = this.totalGs;
    conteo.totalRs = this.totalRs;
    conteo.totalDs = this.totalDs;
    conteo.conteoMonedaList = this.createMonedaBilletes()
    this.dialogoService.open('Atención', 'Estas seguro que deseas guardar este conteo?').then(res => {
      if (res.role == 'aceptar') {
        if (this.cajaService.selectedCaja != null) {
          this.conteoService
            .onSave(conteo, this.cajaService.selectedCaja?.id, this.isApertura, this.cajaService.selectedCaja.sucursal.id)
            .pipe(untilDestroyed(this))
            .subscribe((res) => {
              if (res != null) {
                this.modalService.closeModal(res)
              }
            });
        } else {
          this.modalService.closeModal({conteo: conteo})
        }
      }
    })
  }

  onCancel() {
    this.modalService.closeModal(null)
  }

  createMonedaBilletes() {
    this.conteoMonedaList = [];
    this.guaraniList?.forEach((e) => {
      let conteoMoneda = new ConteoMoneda();
      let cantidad = this.gsFormGroup.get(`${e.valor}`)?.value;
      if (cantidad != null) {
        conteoMoneda.cantidad = cantidad;
        conteoMoneda.monedaBilletes = e;
        this.conteoMonedaList.push(conteoMoneda);
      }
    });
    this.realList?.forEach((e) => {
      let conteoMoneda = new ConteoMoneda();
      let cantidad = this.rsFormGroup.get(
        `${e.valor}`.replace(".", "")
      )?.value;
      if (cantidad != null) {
        conteoMoneda.cantidad = cantidad;
        conteoMoneda.monedaBilletes = e;
        this.conteoMonedaList.push(conteoMoneda);
      }
    });
    this.dolarList?.forEach((e) => {
      let conteoMoneda = new ConteoMoneda();
      let cantidad = this.dsFormGroup.get(
        `${e.valor}`.replace(".", "")
      )?.value;
      if (cantidad != null) {
        conteoMoneda.cantidad = cantidad;
        conteoMoneda.monedaBilletes = e;
        this.conteoMonedaList.push(conteoMoneda);
      }
    });
    return this.conteoMonedaList;
  }

}
