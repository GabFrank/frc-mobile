import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormGroup,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Persona } from 'src/app/domains/personas/persona.model';
import { Proveedor } from 'src/app/pages/personas/proveedor/proveedor.model';
import { TipoGasto } from '../../models/tipo-gasto.model';
import { ActivoBusqueda, ModuloPadreGasto } from '../../models/ente.model';
import { mostrarTarjetaCuotasActivoEnSolicitud } from '../../utils/tipo-gasto-modulo-reglas.util';
import {
  formatearMonto,
  parsearMonto,
  precisionMonedaPorId,
} from '../../utils/monto-moneda.util';
import { SolicitudGastosService } from '../../services/solicitud-gastos.service';
import { SucursalItem, DetalleGastoFormulario } from '../../interfaces';
import { NotificacionService } from 'src/app/services/notificacion.service';
import { ResumenFinancieroEnteVista } from '../../utils/ente-financial-summary.util';

type BeneficiarioTipo = 'PERSONA' | 'PROVEEDOR';

interface DetalleVista {
  monedaId: number | null;
  formaPago: string | null;
  errorMoneda: boolean;
  errorFormaPago: boolean;
  errorMonto: boolean;
}

interface ResumenTotalMoneda {
  monedaId: number;
  etiqueta: string;
  total: string;
}

@Component({
  selector: 'app-nuevo-solicitud-gastos',
  templateUrl: './nuevo-solicitud-gastos.component.html',
  styleUrls: ['./nuevo-solicitud-gastos.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NuevoSolicitudGastosComponent implements OnInit, OnDestroy {
  form!: FormGroup;
  detalles!: FormArray;
  detallesControles: FormGroup[] = [];
  detallesVista: DetalleVista[] = [];
  private detalleIds: number[] = [];
  private nextDetalleId = 1;

  beneficiarioTipo: BeneficiarioTipo = 'PROVEEDOR';
  isPersonaBenefModalOpen = false;
  isProveedorBenefModalOpen = false;
  isTipoGastoModalOpen = false;
  isSucursalModalOpen = false;
  isEnteActivoModalOpen = false;

  responsableId: number | null = null;
  textoResponsable = '';
  tipoGastoId: number | null = null;
  textoTipoGasto = '';
  moduloPadreTipoGasto: ModuloPadreGasto | null = null;
  tipoNaturalezaTipoGasto: string | null = null;
  esPagoCuotaActivoTipoGasto: boolean | null = null;
  requiereEnteActivo = false;
  etiquetaEnteActivo = '';
  etiquetaEnteActivoLower = '';
  iconoEnteActivo = 'cube-outline';
  placeholderEnteActivo = '';
  enteId: number | null = null;
  activoReferenciaId: number | null = null;
  textoEnteActivo = '';
  beneficiarioPersonaId: number | null = null;
  beneficiarioProveedorId: number | null = null;
  textoPersonaBeneficiaria = '';
  textoProveedorBeneficiario = '';
  selectedSucursal = '';
  selectedSucursalId: number | null = null;
  nivelUrgenciaValor = 'NORMAL';
  guardando = false;
  resumenFinancieroEnte: ResumenFinancieroEnteVista | null = null;
  cargandoResumenEnte = false;
  mostrarTarjetaCuotasActivo = false;

  // Estado de validación precalculado para el template (sin getters/métodos en HTML).
  intentoEnvio = false;
  puedeEnviar = false;
  errorTipoGasto = false;
  errorSucursal = false;
  errorBeneficiarioPersona = false;
  errorBeneficiarioProveedor = false;
  errorEnte = false;
  errorMonedasRepetidas = false;
  resumenPorMoneda: ResumenTotalMoneda[] = [];

  private readonly destruir$ = new Subject<void>();

  constructor(
    public servicio: SolicitudGastosService,
    private notificacion: NotificacionService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private router: Router,
  ) {}

  async ngOnInit(): Promise<void> {
    this.construirFormulario();
    try {
      await this.servicio.cargarDatosIniciales();
    } catch {
    }
    const responsable = this.servicio.obtenerResponsableSesion();
    this.responsableId = responsable.id;
    this.textoResponsable = responsable.texto;
    this.recalcularVista();
    this.cdr.markForCheck();
  }

  ngOnDestroy(): void {
    this.destruir$.next();
    this.destruir$.complete();
  }

  agregarDetalleGasto(): void {
    this.detalles.push(this.crearDetalle());
    this.sincronizarDetalles();
    this.cdr.markForCheck();
  }

  quitarDetalleGasto(indice: number): void {
    if (this.detalles.length === 1) {
      return;
    }
    this.detalles.removeAt(indice);
    this.detalleIds.splice(indice, 1);
    this.sincronizarDetalles();
    this.cdr.markForCheck();
  }

  alCambiarMonedaDetalle(indice: number, valor: unknown): void {
    const grupo = this.detallesControles[indice];
    if (!grupo) {
      return;
    }
    const monedaId = this.normalizarNumero(valor);
    grupo.get('monedaId')?.setValue(monedaId);
    grupo.get('monedaId')?.markAsTouched();
    this.reformatearMonto(grupo, monedaId);
    this.cdr.markForCheck();
  }

  alCambiarFormaPagoDetalle(indice: number, valor: unknown): void {
    const grupo = this.detallesControles[indice];
    if (!grupo) {
      return;
    }
    grupo.get('formaPago')?.setValue(valor == null ? null : String(valor));
    grupo.get('formaPago')?.markAsTouched();
    this.cdr.markForCheck();
  }

  alPerderFocoMonto(indice: number): void {
    const grupo = this.detallesControles[indice];
    if (!grupo) {
      return;
    }
    grupo.get('montoTexto')?.markAsTouched();
    const monedaId = this.normalizarNumero(grupo.get('monedaId')?.value);
    this.reformatearMonto(grupo, monedaId);
    this.cdr.markForCheck();
  }

  abrirModalPersonaBeneficiaria(event?: Event): void {
    event?.stopPropagation();
    this.isPersonaBenefModalOpen = true;
    this.cdr.markForCheck();
  }

  cerrarModalPersonaBeneficiaria(): void {
    this.isPersonaBenefModalOpen = false;
    this.cdr.markForCheck();
  }

  abrirModalProveedorBeneficiario(event?: Event): void {
    event?.stopPropagation();
    this.isProveedorBenefModalOpen = true;
    this.cdr.markForCheck();
  }

  cerrarModalProveedorBeneficiario(): void {
    this.isProveedorBenefModalOpen = false;
    this.cdr.markForCheck();
  }

  abrirModalTipoGasto(event?: Event): void {
    event?.stopPropagation();
    this.servicio.actualizarConfigTipoGasto();
    this.isTipoGastoModalOpen = true;
    this.cdr.markForCheck();
  }

  cerrarModalTipoGasto(): void {
    this.isTipoGastoModalOpen = false;
    this.cdr.markForCheck();
  }

  abrirModalSucursal(event?: Event): void {
    event?.stopPropagation();
    this.servicio.actualizarConfigSucursal();
    this.isSucursalModalOpen = true;
    this.cdr.markForCheck();
  }

  cerrarModalSucursal(): void {
    this.isSucursalModalOpen = false;
    this.cdr.markForCheck();
  }

  abrirModalEnteActivo(event?: Event): void {
    event?.stopPropagation();
    this.servicio.prepararConfigActivo(this.moduloPadreTipoGasto);
    this.isEnteActivoModalOpen = true;
    this.cdr.markForCheck();
  }

  cerrarModalEnteActivo(): void {
    this.isEnteActivoModalOpen = false;
    this.cdr.markForCheck();
  }

  seleccionarPersonaBeneficiaria(persona: Persona): void {
    this.beneficiarioPersonaId = persona.id;
    this.textoPersonaBeneficiaria = (persona.nombre || '').toString().toUpperCase();
    this.form.get('beneficiarioPersonaId')?.setValue(persona.id);
    this.form.get('beneficiarioPersonaId')?.markAsTouched();
    this.cerrarModalPersonaBeneficiaria();
    this.recalcularVista();
    this.cdr.markForCheck();
  }

  seleccionarProveedorBeneficiario(proveedor: Proveedor): void {
    this.beneficiarioProveedorId = proveedor.id;
    this.textoProveedorBeneficiario = (proveedor.persona?.nombre || '').toString().toUpperCase();
    this.form.get('beneficiarioProveedorId')?.setValue(proveedor.id);
    this.form.get('beneficiarioProveedorId')?.markAsTouched();
    this.cerrarModalProveedorBeneficiario();
    this.recalcularVista();
    this.cdr.markForCheck();
  }

  seleccionarTipoGasto(tipo: TipoGasto): void {
    const tipoCompleto = this.servicio.tiposGasto.find((item) => Number(item.id) === Number(tipo.id)) ?? tipo;
    this.tipoGastoId = Number(tipoCompleto.id);
    this.textoTipoGasto = (tipoCompleto.descripcion || '').toString().toUpperCase();
    this.moduloPadreTipoGasto = tipoCompleto.moduloPadre ?? null;
    this.tipoNaturalezaTipoGasto = tipoCompleto.tipoNaturaleza ?? null;
    this.esPagoCuotaActivoTipoGasto = tipoCompleto.esPagoCuotaActivo ?? null;
    this.form.get('tipoGastoId')?.setValue(this.tipoGastoId);
    this.form.get('tipoGastoId')?.markAsTouched();
    this.limpiarEnteActivo();
    this.limpiarResumenFinanciero();
    this.actualizarUiEnteActivo();
    this.servicio.prepararConfigActivo(this.moduloPadreTipoGasto);
    this.cerrarModalTipoGasto();
    this.recalcularVista();
    this.cdr.markForCheck();
  }

  async seleccionarEnteActivo(activo: ActivoBusqueda): Promise<void> {
    if (!this.moduloPadreTipoGasto) {
      return;
    }
    try {
      const ente = await this.servicio.resolverEnteDesdeActivo(this.moduloPadreTipoGasto, Number(activo.id));
      this.enteId = ente.id ?? null;
      this.activoReferenciaId = Number(activo.id);
      this.textoEnteActivo = this.servicio.textoActivoSeleccionado(this.moduloPadreTipoGasto, activo);
      this.form.get('enteId')?.setValue(this.enteId);
      this.form.get('enteId')?.markAsTouched();
      this.cerrarModalEnteActivo();
      await this.cargarResumenFinancieroEnte();
      this.recalcularVista();
      this.cdr.markForCheck();
    } catch (err) {
      const mensaje = this.servicio.extraerMensajeError(err);
      this.notificacion.danger(mensaje || 'No se pudo vincular el activo seleccionado');
      this.cdr.markForCheck();
    }
  }

  alCambiarUrgencia(valor: unknown): void {
    const urgencia = valor == null ? 'NORMAL' : String(valor);
    this.nivelUrgenciaValor = urgencia;
    this.form.get('nivelUrgencia')?.setValue(urgencia);
    this.cdr.markForCheck();
  }

  seleccionarSucursal(sucursal: SucursalItem): void {
    this.selectedSucursal = sucursal.nombre;
    this.selectedSucursalId = sucursal.id;
    this.form.get('sucursalId')?.setValue(sucursal.id);
    this.form.get('sucursalId')?.markAsTouched();
    this.cerrarModalSucursal();
    this.recalcularVista();
    this.cdr.markForCheck();
  }

  async enviarSolicitud(): Promise<void> {
    this.intentoEnvio = true;
    this.form.markAllAsTouched();
    this.recalcularVista();
    if (!this.puedeEnviar) {
      this.notificacion.warn('Complete los campos obligatorios antes de enviar');
      this.cdr.markForCheck();
      return;
    }
    this.guardando = true;
    this.cdr.markForCheck();
    try {
      await this.servicio.enviarSolicitud({
        sucursalId: this.selectedSucursalId,
        responsableId: this.responsableId,
        tipoGastoId: this.tipoGastoId,
        enteId: this.enteId,
        beneficiarioTipo: this.beneficiarioTipo,
        beneficiarioPersonaId: this.beneficiarioPersonaId,
        beneficiarioProveedorId: this.beneficiarioProveedorId,
        fechaVencimiento: this.form.get('fechaVencimiento')?.value || '',
        nivelUrgencia: this.form.get('nivelUrgencia')?.value || 'NORMAL',
        descripcion: this.form.get('descripcion')?.value || '',
        gastoItems: this.construirGastoItems(),
      });
      this.router.navigate(['/operaciones/solicitud-gastos/list-solicitud-gastos']);
    } catch {
    } finally {
      this.guardando = false;
      this.cdr.markForCheck();
    }
  }

  cancelar(): void {
    this.router.navigate(['/operaciones/solicitud-gastos']);
  }

  trackByDetalle = (indice: number): number => this.detalleIds[indice] ?? indice;

  trackByMoneda = (_indice: number, item: ResumenTotalMoneda): number => item.monedaId;

  private construirFormulario(): void {
    this.form = this.fb.group({
      beneficiarioTipo: this.fb.control<BeneficiarioTipo>('PROVEEDOR', { nonNullable: true }),
      beneficiarioPersonaId: this.fb.control<number | null>(null),
      beneficiarioProveedorId: this.fb.control<number | null>(null),
      tipoGastoId: this.fb.control<number | null>(null, Validators.required),
      enteId: this.fb.control<number | null>(null),
      sucursalId: this.fb.control<number | null>(null, Validators.required),
      fechaVencimiento: this.fb.control<string>(''),
      nivelUrgencia: this.fb.control<string>('NORMAL', { nonNullable: true }),
      descripcion: this.fb.control<string>(''),
      detalles: this.fb.array([this.crearDetalle()]),
    });
    this.detalles = this.form.get('detalles') as FormArray;
    this.sincronizarDetalles();

    this.form
      .get('beneficiarioTipo')
      ?.valueChanges.pipe(takeUntil(this.destruir$))
      .subscribe((tipo) => this.alCambiarTipoBeneficiario(tipo as BeneficiarioTipo));

    this.form.valueChanges.pipe(takeUntil(this.destruir$)).subscribe(() => {
      this.recalcularVista();
      this.cdr.markForCheck();
    });
  }

  private crearDetalle(): FormGroup {
    this.detalleIds.push(this.nextDetalleId++);
    return this.fb.group({
      monedaId: this.fb.control<number | null>(null, Validators.required),
      formaPago: this.fb.control<string | null>(null, Validators.required),
      montoTexto: this.fb.control<string>('', [Validators.required, this.validarMontoPositivo]),
    });
  }

  private readonly validarMontoPositivo = (control: AbstractControl): ValidationErrors | null => {
    const valor = parsearMonto((control.value ?? '').toString(), 2);
    return valor != null && valor > 0 ? null : { montoInvalido: true };
  };

  private sincronizarDetalles(): void {
    this.detallesControles = this.detalles.controls as FormGroup[];
    this.recalcularVista();
  }

  private alCambiarTipoBeneficiario(tipo: BeneficiarioTipo): void {
    this.beneficiarioTipo = tipo;
    if (tipo === 'PERSONA') {
      this.beneficiarioProveedorId = null;
      this.textoProveedorBeneficiario = '';
      this.form.get('beneficiarioProveedorId')?.setValue(null, { emitEvent: false });
    } else {
      this.beneficiarioPersonaId = null;
      this.textoPersonaBeneficiaria = '';
      this.form.get('beneficiarioPersonaId')?.setValue(null, { emitEvent: false });
    }
    this.recalcularVista();
    this.cdr.markForCheck();
  }

  private reformatearMonto(grupo: FormGroup, monedaId: number | null): void {
    const control = grupo.get('montoTexto');
    if (!control) {
      return;
    }
    const precision = precisionMonedaPorId(this.servicio.opcionesMoneda, monedaId);
    const valor = parsearMonto((control.value ?? '').toString(), precision);
    const texto = valor == null ? '' : formatearMonto(valor, precision);
    control.setValue(texto, { emitEvent: false });
    this.recalcularVista();
  }

  private construirGastoItems(): DetalleGastoFormulario[] {
    return this.detallesControles.map((grupo, indice) => {
      const monedaId = this.normalizarNumero(grupo.get('monedaId')?.value);
      const precision = precisionMonedaPorId(this.servicio.opcionesMoneda, monedaId);
      const monto = parsearMonto((grupo.get('montoTexto')?.value ?? '').toString(), precision);
      return {
        id: this.detalleIds[indice] ?? indice + 1,
        monto,
        monedaId,
        formaPago: grupo.get('formaPago')?.value ?? null,
        montoTexto: (grupo.get('montoTexto')?.value ?? '').toString(),
      };
    });
  }

  private recalcularVista(): void {
    if (!this.form) {
      return;
    }
    const debeMostrar = (control: AbstractControl | null): boolean =>
      !!control && control.invalid && (control.touched || this.intentoEnvio);

    this.errorTipoGasto = debeMostrar(this.form.get('tipoGastoId'));
    this.errorSucursal = debeMostrar(this.form.get('sucursalId'));

    this.errorBeneficiarioPersona =
      this.beneficiarioTipo === 'PERSONA' &&
      !this.beneficiarioPersonaId &&
      (this.intentoEnvio || !!this.form.get('beneficiarioPersonaId')?.touched);
    this.errorBeneficiarioProveedor =
      this.beneficiarioTipo === 'PROVEEDOR' &&
      !this.beneficiarioProveedorId &&
      (this.intentoEnvio || !!this.form.get('beneficiarioProveedorId')?.touched);

    this.errorEnte =
      this.requiereEnteActivo &&
      !this.enteId &&
      (this.intentoEnvio || !!this.form.get('enteId')?.touched);

    this.actualizarDetallesVista();
    this.actualizarResumenPorMoneda();
    this.puedeEnviar = this.evaluarPuedeEnviar();
  }

  private actualizarDetallesVista(): void {
    this.detallesVista = this.detallesControles.map((grupo) => {
      const monedaControl = grupo.get('monedaId');
      const formaPagoControl = grupo.get('formaPago');
      const montoControl = grupo.get('montoTexto');
      const mostrar = (control: AbstractControl | null): boolean =>
        !!control && control.invalid && (control.touched || this.intentoEnvio);
      return {
        monedaId: this.normalizarNumero(monedaControl?.value),
        formaPago: (formaPagoControl?.value ?? null) as string | null,
        errorMoneda: mostrar(monedaControl),
        errorFormaPago: mostrar(formaPagoControl),
        errorMonto: mostrar(montoControl),
      };
    });
  }

  private actualizarResumenPorMoneda(): void {
    const acumulado = new Map<number, number>();
    for (const grupo of this.detallesControles) {
      const monedaId = this.normalizarNumero(grupo.get('monedaId')?.value);
      if (monedaId == null) {
        continue;
      }
      const precision = precisionMonedaPorId(this.servicio.opcionesMoneda, monedaId);
      const monto = parsearMonto((grupo.get('montoTexto')?.value ?? '').toString(), precision);
      if (monto == null || monto <= 0) {
        continue;
      }
      acumulado.set(monedaId, (acumulado.get(monedaId) ?? 0) + monto);
    }

    this.errorMonedasRepetidas = this.detectarMonedasRepetidas();

    const resumen: ResumenTotalMoneda[] = [];
    acumulado.forEach((total, monedaId) => {
      const opcion = this.servicio.opcionesMoneda.find((item) => Number(item.valor) === monedaId);
      const precision = precisionMonedaPorId(this.servicio.opcionesMoneda, monedaId);
      resumen.push({
        monedaId,
        etiqueta: opcion?.texto || `Moneda ${monedaId}`,
        total: formatearMonto(total, precision),
      });
    });
    this.resumenPorMoneda = resumen;
  }

  private detectarMonedasRepetidas(): boolean {
    const vistas = new Set<number>();
    for (const grupo of this.detallesControles) {
      const monedaId = this.normalizarNumero(grupo.get('monedaId')?.value);
      if (monedaId == null) {
        continue;
      }
      if (vistas.has(monedaId)) {
        return true;
      }
      vistas.add(monedaId);
    }
    return false;
  }

  private evaluarPuedeEnviar(): boolean {
    if (this.form.invalid) {
      return false;
    }
    if (!this.responsableId) {
      return false;
    }
    if (this.requiereEnteActivo && !this.enteId) {
      return false;
    }
    if (this.beneficiarioTipo === 'PERSONA' && !this.beneficiarioPersonaId) {
      return false;
    }
    if (this.beneficiarioTipo === 'PROVEEDOR' && !this.beneficiarioProveedorId) {
      return false;
    }
    if (this.detectarMonedasRepetidas()) {
      return false;
    }
    return true;
  }

  private async cargarResumenFinancieroEnte(): Promise<void> {
    if (!this.enteId) {
      return;
    }
    this.cargandoResumenEnte = true;
    this.resumenFinancieroEnte = null;
    this.cdr.markForCheck();
    try {
      const resultado = await this.servicio.cargarResumenFinancieroEnte(this.enteId, this.tipoGastoId);
      if (!resultado) {
        return;
      }
      if (this.mostrarTarjetaCuotasActivo) {
        this.resumenFinancieroEnte = resultado.vista;
      }
      const autocompletado = this.servicio.aplicarAutocompletadoSolicitud(
        resultado.summary,
        this.construirGastoItems(),
        {
          descripcion: this.form.get('descripcion')?.value || '',
          fechaVencimiento: this.form.get('fechaVencimiento')?.value || '',
          beneficiarioTipo: this.beneficiarioTipo,
          beneficiarioProveedorId: this.beneficiarioProveedorId,
          textoProveedorBeneficiario: this.textoProveedorBeneficiario,
        },
      );
      this.form.get('descripcion')?.setValue(autocompletado.descripcion, { emitEvent: false });
      this.form.get('fechaVencimiento')?.setValue(autocompletado.fechaVencimiento, { emitEvent: false });
      this.aplicarDetallesAutocompletados(autocompletado.gastoItems);
      this.beneficiarioTipo = autocompletado.beneficiarioTipo;
      this.form.get('beneficiarioTipo')?.setValue(autocompletado.beneficiarioTipo, { emitEvent: false });
      this.beneficiarioProveedorId = autocompletado.beneficiarioProveedorId;
      this.form.get('beneficiarioProveedorId')?.setValue(autocompletado.beneficiarioProveedorId, { emitEvent: false });
      this.textoProveedorBeneficiario = autocompletado.textoProveedorBeneficiario;
      if (autocompletado.beneficiarioTipo === 'PROVEEDOR') {
        this.beneficiarioPersonaId = null;
        this.textoPersonaBeneficiaria = '';
        this.form.get('beneficiarioPersonaId')?.setValue(null, { emitEvent: false });
      }
    } catch {
      this.notificacion.danger('No se pudieron cargar los datos financieros del activo');
    } finally {
      this.cargandoResumenEnte = false;
      this.recalcularVista();
      this.cdr.markForCheck();
    }
  }

  private aplicarDetallesAutocompletados(items: DetalleGastoFormulario[]): void {
    if (!items.length) {
      return;
    }
    while (this.detalles.length > 0) {
      this.detalles.removeAt(0);
    }
    this.detalleIds = [];
    for (const item of items) {
      const monedaId = item.monedaId;
      const precision = precisionMonedaPorId(this.servicio.opcionesMoneda, monedaId);
      const texto = item.monto == null ? '' : formatearMonto(item.monto, precision);
      this.detalleIds.push(this.nextDetalleId++);
      this.detalles.push(
        this.fb.group({
          monedaId: this.fb.control<number | null>(monedaId, Validators.required),
          formaPago: this.fb.control<string | null>(item.formaPago ?? null, Validators.required),
          montoTexto: this.fb.control<string>(texto, [Validators.required, this.validarMontoPositivo]),
        }),
      );
    }
    this.detallesControles = this.detalles.controls as FormGroup[];
  }

  private actualizarUiEnteActivo(): void {
    this.requiereEnteActivo = this.servicio.requiereModuloPadreActivo(this.moduloPadreTipoGasto);
    this.etiquetaEnteActivo = this.servicio.etiquetaModuloPadre(this.moduloPadreTipoGasto);
    this.etiquetaEnteActivoLower = this.etiquetaEnteActivo.toLowerCase();
    this.iconoEnteActivo = this.servicio.iconoModuloPadre(this.moduloPadreTipoGasto);
    this.placeholderEnteActivo = this.requiereEnteActivo
      ? `Seleccionar ${this.etiquetaEnteActivoLower}`
      : '';
    this.mostrarTarjetaCuotasActivo = mostrarTarjetaCuotasActivoEnSolicitud(
      this.moduloPadreTipoGasto,
      this.tipoNaturalezaTipoGasto,
      this.esPagoCuotaActivoTipoGasto,
    );

    const controlEnte = this.form.get('enteId');
    if (this.requiereEnteActivo) {
      controlEnte?.setValidators(Validators.required);
    } else {
      controlEnte?.clearValidators();
    }
    controlEnte?.updateValueAndValidity({ emitEvent: false });
  }

  private limpiarEnteActivo(): void {
    this.enteId = null;
    this.activoReferenciaId = null;
    this.textoEnteActivo = '';
    this.form.get('enteId')?.setValue(null, { emitEvent: false });
    this.limpiarResumenFinanciero();
  }

  private limpiarResumenFinanciero(): void {
    this.resumenFinancieroEnte = null;
    this.cargandoResumenEnte = false;
  }

  private normalizarNumero(valor: unknown): number | null {
    if (valor === null || valor === undefined || valor === '') {
      return null;
    }
    const numero = Number(valor);
    return Number.isNaN(numero) ? null : numero;
  }
}
