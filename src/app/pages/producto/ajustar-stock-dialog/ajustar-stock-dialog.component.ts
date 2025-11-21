import { AfterViewInit, Component, Input, OnInit, ViewChild } from '@angular/core';
import { IonInput, ModalController } from '@ionic/angular';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Producto } from 'src/app/domains/productos/producto.model';
import { Sucursal } from 'src/app/domains/empresarial/sucursal/sucursal.model';
import { MovimientoStockService } from '../../operaciones/movimiento-stock/movimiento-stock.service';
import { MovimientoStockInput } from '../../operaciones/movimiento-stock/movimiento-stock.model';
import { TipoMovimiento } from '../../operaciones/movimiento-stock/movimiento-stock.enums';
import { MainService } from 'src/app/services/main.service';
import { NotificacionService } from 'src/app/services/notificacion.service';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';


@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-ajustar-stock-dialog',
  templateUrl: './ajustar-stock-dialog.component.html',
  styleUrls: ['./ajustar-stock-dialog.component.scss']
})
export class AjustarStockDialogComponent implements OnInit, AfterViewInit {

  @ViewChild('inputElement', { static: false }) inputEl!: IonInput;

  @Input() sucursal: Sucursal;
  @Input() producto: Producto;
  @Input() stockActual: number = 0;

  form: FormGroup;
  cantidadControl: FormControl;
  diferencia: number = 0;
  isSaving = false;
  isLoadingStock = false;

  constructor(
    private fb: FormBuilder,
    private modalCtrl: ModalController,
    private movimientoStockService: MovimientoStockService,
    private mainService: MainService,
    private notificacionService: NotificacionService
  ) {}

  ngOnInit() {
    this.initForm();
    this.loadStockActual();
    this.setFocusOnInput();
  }

  initForm(): void {
    this.cantidadControl = this.fb.control(this.stockActual, Validators.required);
    this.form = this.fb.group({
      cantidad: this.cantidadControl
    });

    this.cantidadControl.valueChanges.pipe(untilDestroyed(this)).subscribe(() => {
      this.calcularDiferencia();
    });
    this.calcularDiferencia();
  }

  ngAfterViewInit() {
    this.setFocusOnInput();
  }

  async loadStockActual(): Promise<void> {
    if (!this.producto?.id || !this.sucursal?.id) {
      this.calcularDiferencia();
      return;
    }

    this.isLoadingStock = true;

    try {
      const stock$ = await this.movimientoStockService.onGetStockPorProducto(this.producto.id, this.sucursal.id);
      stock$.pipe(untilDestroyed(this)).subscribe({
        next: (stock) => {
          this.stockActual = stock ?? 0;
          this.cantidadControl.setValue(this.stockActual);
          this.isLoadingStock = false;
        },
        error: () => {
          this.isLoadingStock = false;
        }
      });
    } catch (error) {
      this.isLoadingStock = false;
    }
  }

  calcularDiferencia() {
    const nuevaCantidad: number = Number(this.cantidadControl.value) || 0;
    this.diferencia = nuevaCantidad - (this.stockActual || 0);
  }

  async onGuardar() {
    if (this.form.invalid) {
      this.cantidadControl.markAsTouched();
      this.notificacionService.warn('Complete todos los campos requeridos');
      return;
    }

    if (this.diferencia === 0) {
      this.notificacionService.warn('No hay diferencia para ajustar');
      return;
    }

    if (!this.producto?.id || !this.sucursal?.id) {
      this.notificacionService.warn('Faltan datos del producto o la sucursal');
      return;
    }

    const usuarioId = this.mainService.usuarioActual?.id ?? Number(localStorage.getItem('usuarioId'));
    if (!usuarioId) {
      this.notificacionService.warn('No se encontró el usuario actual');
      return;
    }

    const movimientoStockInput: MovimientoStockInput = {
      sucursalId: this.sucursal.id,
      productoId: this.producto.id,
      tipoMovimiento: TipoMovimiento.AJUSTE,
      referencia: this.producto.id,
      cantidad: this.diferencia,
      estado: true,
      usuarioId
    };

    this.isSaving = true;

    try {
      const save$ = await this.movimientoStockService.onSaveMovimientoStock(movimientoStockInput);
      save$.pipe(untilDestroyed(this)).subscribe({
        next: (movimientoGuardado) => {
          this.isSaving = false;
          this.modalCtrl.dismiss({
            ajustado: true,
            movimiento: movimientoGuardado,
            nuevaCantidad: this.cantidadControl.value,
            diferencia: this.diferencia
          });
        },
        error: () => {
          this.isSaving = false;
        }
      });
    } catch (error) {
      this.isSaving = false;
    }
  }

  onCancelar() {
    this.modalCtrl.dismiss(null);
  }

  setFocusOnInput() {
    if (this.inputEl) {
      setTimeout(() => {
        this.inputEl.setFocus();
      }, 100);
    }
  }

}
