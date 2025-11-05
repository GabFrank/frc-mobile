import { Location } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { IonAccordionGroup } from '@ionic/angular';
import { Sucursal } from 'src/app/domains/empresarial/sucursal/sucursal.model';
import { SucursalService } from 'src/app/domains/empresarial/sucursal/sucursal.service';
import { MainService } from 'src/app/services/main.service';
import { NotificacionService, TipoNotificacion } from 'src/app/services/notificacion.service';
import { TransferenciaService } from '../transferencia.service';
import { CargandoService } from 'src/app/services/cargando.service';
import { TransferenciaEstado, TipoTransferencia, EtapaTransferencia } from '../transferencia.model';

@UntilDestroy()
@Component({
  selector: 'app-nueva-transferencia',
  templateUrl: './nueva-transferencia.component.html',
  styleUrls: ['./nueva-transferencia.component.scss']
})
export class NuevaTransferenciaComponent implements OnInit {
  @ViewChild('group', { static: false }) accordionGroup: IonAccordionGroup;
  allSucursales: Sucursal[] = [];
  sucursalesDestinoDisponibles: Sucursal[] = [];

  selectedOrigen: Sucursal | null = null;
  selectedDestino: Sucursal | null = null;
  origenDisplayText = 'Seleccione sucursal origen';
  destinoDisplayText = 'Primero seleccione origen';
  destinoHeaderColor = 'light';

  isFormValid = false;
  private isCreating: boolean = false;
  private isNavigating: boolean = false;

  form = new UntypedFormGroup({
    sucursalOrigen: new UntypedFormControl(null, Validators.required),
    sucursalDestino: new UntypedFormControl(null, Validators.required)
  });

  constructor(
    private location: Location,
    private sucursalService: SucursalService,
    private notificacionService: NotificacionService,
    public mainService: MainService,
    private router: Router,
    private transferenciaService: TransferenciaService,
    private cargandoService: CargandoService
  ) { }

  async ngOnInit() {
    await this.cargarSucursales();
    this.form.statusChanges.pipe(untilDestroyed(this)).subscribe(() => this.validateForm());
  }

  private async cargarSucursales() {
    try {
      (await this.sucursalService.onGetAllSucursales())
        .pipe(untilDestroyed(this))
        .subscribe((res) => {
          this.allSucursales = res || [];
          this.inicializarSucursalOrigen();
        });
    } catch (error) {
      console.error('Error al cargar sucursales:', error);
      this.notificacionService.open('Error al cargar sucursales', TipoNotificacion.DANGER, 2);
    }
  }

  private inicializarSucursalOrigen() {
    if (this.mainService?.sucursalActual) {
      this.selectOrigen(this.mainService.sucursalActual, false);
    }
  }

  onBack() {
    this.location.back();
  }

  selectOrigen(sucursal: Sucursal, validate: boolean = true) {
    this.selectedOrigen = sucursal;
    this.form.get('sucursalOrigen')?.setValue(sucursal);

    if (this.selectedDestino?.id === sucursal.id) {
      this.selectedDestino = null;
      this.form.get('sucursalDestino')?.setValue(null);
    }

    this.sucursalesDestinoDisponibles = this.allSucursales.filter(s => s.id !== sucursal.id);

    this.origenDisplayText = sucursal.nombre;
    this.destinoDisplayText = this.selectedDestino ? this.selectedDestino.nombre : 'Seleccione sucursal destino';
    this.destinoHeaderColor = this.selectedDestino ? 'success' : 'medium';

    if (validate) this.validateForm();
    if (this.accordionGroup) {
      this.accordionGroup.value = undefined as any;
    }
  }

  selectDestino(sucursal: Sucursal) {
    if (this.selectedOrigen?.id === sucursal.id) {
      this.notificacionService.open('La sucursal destino no puede ser igual a la origen', TipoNotificacion.WARN, 2);
      return;
    }

    this.selectedDestino = sucursal;
    this.form.get('sucursalDestino')?.setValue(sucursal);
    this.destinoDisplayText = sucursal.nombre;
    this.destinoHeaderColor = 'success';

    this.validateForm();
    if (this.accordionGroup) {
      this.accordionGroup.value = undefined as any;
    }
  }

  private validateForm() {
    this.isFormValid =
      this.selectedOrigen !== null &&
      this.selectedDestino !== null &&
      this.selectedOrigen.id !== this.selectedDestino?.id &&
      this.form.valid;
  }

  async onContinuarAGestionProductos() {
    if (!this.isFormValid || this.isCreating || this.isNavigating) {
      this.form.markAllAsTouched();
      if (!this.selectedOrigen) {
        this.notificacionService.open('Seleccione la sucursal origen', TipoNotificacion.WARN, 2);
      } else if (!this.selectedDestino) {
        this.notificacionService.open('Seleccione la sucursal destino', TipoNotificacion.WARN, 2);
      }
      return;
    }

    await this.crearTransferencia();
  }

  private async crearTransferencia() {
    if (this.isCreating) return;
    this.isCreating = true;
    const loading = await this.cargandoService.open('Creando transferencia...');
    try {
      const transferenciaInput = {
        sucursalOrigenId: this.selectedOrigen!.id,
        sucursalDestinoId: this.selectedDestino!.id,
        estado: TransferenciaEstado.ABIERTA,
        tipo: TipoTransferencia.MANUAL,
        etapa: EtapaTransferencia.PRE_TRANSFERENCIA_CREACION
      };

      const observable = await this.transferenciaService.onSaveTransferencia(transferenciaInput);

      observable.pipe(untilDestroyed(this)).subscribe({
        next: (nuevaTransferencia) => {
          this.cargandoService.close(loading);
          this.isCreating = false;

          if (nuevaTransferencia?.id) {
            this.isNavigating = true;
            this.router.navigate(['transferencias', 'gestion-productos'], {
              state: {
                sucursalOrigen: this.selectedOrigen,
                sucursalDestino: this.selectedDestino,
                transferenciaId: nuevaTransferencia.id
              }
            });
            setTimeout(() => { this.isNavigating = false; }, 300);
          } else {
            this.notificacionService.open('Error al crear la transferencia', TipoNotificacion.DANGER, 2);
          }
        },
        error: (error) => {
          console.error('Error creando transferencia:', error);
          this.cargandoService.close(loading);
          this.isCreating = false;
          this.notificacionService.open('Error al crear la transferencia', TipoNotificacion.DANGER, 2);
        }
      });

    } catch (error) {
      console.error('Error en creación de transferencia:', error);
      this.cargandoService.close(loading);
      this.isCreating = false;
      this.notificacionService.open('Error al crear la transferencia', TipoNotificacion.DANGER, 2);
    }
  }
}
