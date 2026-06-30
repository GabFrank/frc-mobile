import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Persona } from 'src/app/domains/personas/persona.model';
import { Proveedor } from 'src/app/pages/personas/proveedor/proveedor.model';
import { TipoGasto } from '../../models/tipo-gasto.model';
import { ActivoBusqueda, ModuloPadreGasto } from '../../models/ente.model';
import { mostrarTarjetaCuotasActivoEnSolicitud } from '../../utils/tipo-gasto-modulo-reglas.util';
import { SolicitudGastosService } from '../../services/solicitud-gastos.service';
import { SucursalItem, DetalleGastoFormulario } from '../../interfaces';
import { NotificacionService } from 'src/app/services/notificacion.service';
import { ResumenFinancieroEnteVista } from '../../utils/ente-financial-summary.util';

@Component({
  selector: 'app-nuevo-solicitud-gastos',
  templateUrl: './nuevo-solicitud-gastos.component.html',
  styleUrls: ['./nuevo-solicitud-gastos.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NuevoSolicitudGastosComponent implements OnInit {
  gastoItems: DetalleGastoFormulario[] = [{
    id: 1,
    monto: null,
    monedaId: null,
    formaPago: null,
    montoTexto: '',
  }];
  private nextGastoId = 2;

  beneficiarioTipo: 'PERSONA' | 'PROVEEDOR' = 'PROVEEDOR';
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
  fechaVencimiento = '';
  nivelUrgencia = 'NORMAL';
  descripcion = '';
  guardando = false;
  resumenFinancieroEnte: ResumenFinancieroEnteVista | null = null;
  cargandoResumenEnte = false;
  mostrarTarjetaCuotasActivo = false;

  constructor(
    public servicio: SolicitudGastosService,
    private notificacion: NotificacionService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  async ngOnInit(): Promise<void> {
    try {
      await this.servicio.cargarDatosIniciales();
    } catch {
    }
    const responsable = this.servicio.obtenerResponsableSesion();
    this.responsableId = responsable.id;
    this.textoResponsable = responsable.texto;
    this.cdr.markForCheck();
  }

  agregarDetalleGasto(): void {
    this.gastoItems = [
      ...this.gastoItems,
      { id: this.nextGastoId++, monto: null, monedaId: null, formaPago: null, montoTexto: '' },
    ];
    this.cdr.markForCheck();
  }

  quitarDetalleGasto(id: number): void {
    if (this.gastoItems.length === 1) {
      return;
    }
    this.gastoItems = this.gastoItems.filter((item) => item.id !== id);
    this.cdr.markForCheck();
  }

  alCambiarMoneda(item: DetalleGastoFormulario, valor: unknown): void {
    const monedaId = this.normalizarNumero(valor);
    item.monedaId = monedaId;
    if (item.monto != null) {
      item.montoTexto = this.formatearMonto(item.monto, monedaId);
    }
    this.cdr.markForCheck();
  }

  alCambiarMontoTexto(item: DetalleGastoFormulario, texto: string): void {
    const textoIngresado = (texto ?? '').toString();
    const monto = this.parsearMonto(textoIngresado, item.monedaId);
    item.monto = monto;
    item.montoTexto = monto == null ? '' : this.formatearMonto(monto, item.monedaId);
    this.cdr.markForCheck();
  }

  alPerderFocoMonto(item: DetalleGastoFormulario): void {
    if (item.monto == null) {
      item.montoTexto = '';
      this.cdr.markForCheck();
      return;
    }
    item.montoTexto = this.formatearMonto(item.monto, item.monedaId);
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

  cambiarTipoBeneficiario(tipo: 'PERSONA' | 'PROVEEDOR'): void {
    this.beneficiarioTipo = tipo;
    if (tipo === 'PERSONA') {
      this.beneficiarioProveedorId = null;
      this.textoProveedorBeneficiario = '';
      return;
    }
    this.beneficiarioPersonaId = null;
    this.textoPersonaBeneficiaria = '';
  }

  seleccionarPersonaBeneficiaria(persona: Persona): void {
    this.beneficiarioPersonaId = persona.id;
    this.textoPersonaBeneficiaria = (persona.nombre || '').toString().toUpperCase();
    this.cerrarModalPersonaBeneficiaria();
    this.cdr.markForCheck();
  }

  seleccionarProveedorBeneficiario(proveedor: Proveedor): void {
    this.beneficiarioProveedorId = proveedor.id;
    this.textoProveedorBeneficiario = (proveedor.persona?.nombre || '').toString().toUpperCase();
    this.cerrarModalProveedorBeneficiario();
    this.cdr.markForCheck();
  }

  seleccionarTipoGasto(tipo: TipoGasto): void {
    const tipoCompleto = this.servicio.tiposGasto.find((item) => Number(item.id) === Number(tipo.id)) ?? tipo;
    this.tipoGastoId = Number(tipoCompleto.id);
    this.textoTipoGasto = (tipoCompleto.descripcion || '').toString().toUpperCase();
    this.moduloPadreTipoGasto = tipoCompleto.moduloPadre ?? null;
    this.tipoNaturalezaTipoGasto = tipoCompleto.tipoNaturaleza ?? null;
    this.esPagoCuotaActivoTipoGasto = tipoCompleto.esPagoCuotaActivo ?? null;
    this.limpiarEnteActivo();
    this.limpiarResumenFinanciero();
    this.actualizarUiEnteActivo();
    this.servicio.prepararConfigActivo(this.moduloPadreTipoGasto);
    this.cerrarModalTipoGasto();
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
      this.cerrarModalEnteActivo();
      await this.cargarResumenFinancieroEnte();
      this.cdr.markForCheck();
    } catch (err) {
      const mensaje = this.servicio.extraerMensajeError(err);
      this.notificacion.danger(mensaje || 'No se pudo vincular el activo seleccionado');
      this.cdr.markForCheck();
    }
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
        this.gastoItems,
        {
          descripcion: this.descripcion,
          fechaVencimiento: this.fechaVencimiento,
          beneficiarioTipo: this.beneficiarioTipo,
          beneficiarioProveedorId: this.beneficiarioProveedorId,
          textoProveedorBeneficiario: this.textoProveedorBeneficiario,
        }
      );
      this.descripcion = autocompletado.descripcion;
      this.fechaVencimiento = autocompletado.fechaVencimiento;
      this.gastoItems = autocompletado.gastoItems;
      this.beneficiarioTipo = autocompletado.beneficiarioTipo;
      this.beneficiarioProveedorId = autocompletado.beneficiarioProveedorId;
      this.textoProveedorBeneficiario = autocompletado.textoProveedorBeneficiario;
      if (autocompletado.beneficiarioTipo === 'PROVEEDOR') {
        this.beneficiarioPersonaId = null;
        this.textoPersonaBeneficiaria = '';
      }
    } catch {
      this.notificacion.danger('No se pudieron cargar los datos financieros del activo');
    } finally {
      this.cargandoResumenEnte = false;
      this.cdr.markForCheck();
    }
  }

  seleccionarSucursal(sucursal: SucursalItem): void {
    this.selectedSucursal = sucursal.nombre;
    this.selectedSucursalId = sucursal.id;
    this.cerrarModalSucursal();
  }

  async enviarSolicitud(): Promise<void> {
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
        fechaVencimiento: this.fechaVencimiento,
        nivelUrgencia: this.nivelUrgencia,
        descripcion: this.descripcion,
        gastoItems: this.gastoItems,
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
  }

  private limpiarEnteActivo(): void {
    this.enteId = null;
    this.activoReferenciaId = null;
    this.textoEnteActivo = '';
    this.limpiarResumenFinanciero();
  }

  private limpiarResumenFinanciero(): void {
    this.resumenFinancieroEnte = null;
    this.cargandoResumenEnte = false;
  }

  private parsearMonto(texto: string, monedaId: number | null): number | null {
    const textoLimpio = (texto || '').replace(/\s/g, '');
    if (!textoLimpio) {
      return null;
    }
    const precision = this.obtenerPrecisionPorMoneda(monedaId);
    if (precision === 0) {
      const soloDigitos = textoLimpio.replace(/\D/g, '');
      if (!soloDigitos) {
        return null;
      }
      return Number(soloDigitos);
    }

    const ultimoSeparadorIndex = Math.max(textoLimpio.lastIndexOf(','), textoLimpio.lastIndexOf('.'));
    const fuenteEntera = ultimoSeparadorIndex >= 0 ? textoLimpio.slice(0, ultimoSeparadorIndex) : textoLimpio;
    const parteEntera = fuenteEntera.replace(/\D/g, '');
    if (!parteEntera) {
      return null;
    }

    const fuenteDecimal = ultimoSeparadorIndex >= 0 ? textoLimpio.slice(ultimoSeparadorIndex + 1) : '';
    const parteDecimal = fuenteDecimal.replace(/\D/g, '').slice(0, precision);
    const normalizado = parteDecimal.length > 0 ? `${parteEntera}.${parteDecimal}` : parteEntera;
    const valor = Number(normalizado);
    return Number.isFinite(valor) ? valor : null;
  }

  private formatearMonto(monto: number, monedaId: number | null): string {
    const precision = this.obtenerPrecisionPorMoneda(monedaId);
    return new Intl.NumberFormat('es-PY', {
      minimumFractionDigits: precision,
      maximumFractionDigits: precision,
    }).format(monto);
  }

  private obtenerPrecisionPorMoneda(monedaId: number | null): number {
    if (!monedaId) {
      return 2;
    }
    const opcionMoneda = this.servicio.opcionesMoneda.find((opcion) => Number(opcion.valor) === Number(monedaId));
    const textoMoneda = (opcionMoneda?.texto || '').toUpperCase();
    if (textoMoneda.includes('GUARANI') || textoMoneda.includes('₲')) {
      return 0;
    }
    return 2;
  }

  private normalizarNumero(valor: unknown): number | null {
    if (valor === null || valor === undefined || valor === '') {
      return null;
    }
    const numero = Number(valor);
    return Number.isNaN(numero) ? null : numero;
  }
}
