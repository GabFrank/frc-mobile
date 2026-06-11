import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Persona } from 'src/app/domains/personas/persona.model';
import { Proveedor } from 'src/app/pages/personas/proveedor/proveedor.model';
import { TipoGasto } from '../../models/tipo-gasto.model';
import { ActivoBusqueda, ModuloPadreGasto } from '../../models/ente.model';
import {
  SolicitudGastosService,
} from '../../services/solicitud-gastos.service';
import { SucursalItem, DetalleGastoFormulario } from '../../interfaces';

@Component({
  selector: 'app-nuevo-solicitud-gastos',
  templateUrl: './nuevo-solicitud-gastos.component.html',
  styleUrls: ['./nuevo-solicitud-gastos.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NuevoSolicitudGastosComponent implements OnInit {
  gastoItems: DetalleGastoFormulario[] = [{ id: 1, monto: null, monedaId: null, formaPago: null }];
  private nextGastoId = 2;
  private montoTextoPorItemId: Record<number, string> = {};

  beneficiarioTipo: 'PERSONA' | 'PROVEEDOR' = 'PERSONA';
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

  constructor(
    public servicio: SolicitudGastosService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) { }

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
      { id: this.nextGastoId++, monto: null, monedaId: null, formaPago: null },
    ];
    this.cdr.markForCheck();
  }

  quitarDetalleGasto(id: number): void {
    if (this.gastoItems.length === 1) {
      return;
    }
    this.gastoItems = this.gastoItems.filter((item) => item.id !== id);
    delete this.montoTextoPorItemId[id];
    this.cdr.markForCheck();
  }

  alCambiarMoneda(item: DetalleGastoFormulario, valor: unknown): void {
    const monedaId = this.normalizarNumero(valor);
    item.monedaId = monedaId;
    if (item.monto != null) {
      this.montoTextoPorItemId[item.id] = this.formatearMonto(item.monto, monedaId);
    }
    this.cdr.markForCheck();
  }

  alCambiarMontoTexto(item: DetalleGastoFormulario, texto: string): void {
    const textoIngresado = (texto ?? '').toString();
    const monto = this.parsearMonto(textoIngresado, item.monedaId);
    item.monto = monto;
    this.montoTextoPorItemId[item.id] = monto == null ? '' : this.formatearMonto(monto, item.monedaId);
    this.cdr.markForCheck();
  }

  alPerderFocoMonto(item: DetalleGastoFormulario): void {
    if (item.monto == null) {
      this.montoTextoPorItemId[item.id] = '';
      this.cdr.markForCheck();
      return;
    }
    this.montoTextoPorItemId[item.id] = this.formatearMonto(item.monto, item.monedaId);
    this.cdr.markForCheck();
  }

  obtenerMontoTexto(item: DetalleGastoFormulario): string {
    const texto = this.montoTextoPorItemId[item.id];
    if (texto !== undefined) {
      return texto;
    }
    if (item.monto == null) {
      return '';
    }
    const formateado = this.formatearMonto(item.monto, item.monedaId);
    this.montoTextoPorItemId[item.id] = formateado;
    return formateado;
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

  get requiereEnteActivo(): boolean {
    return this.servicio.requiereModuloPadreActivo(this.moduloPadreTipoGasto);
  }

  get etiquetaEnteActivo(): string {
    return this.servicio.etiquetaModuloPadre(this.moduloPadreTipoGasto);
  }

  get iconoEnteActivo(): string {
    return this.servicio.iconoModuloPadre(this.moduloPadreTipoGasto);
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
    this.tipoGastoId = Number(tipo.id);
    this.textoTipoGasto = (tipo.descripcion || '').toString().toUpperCase();
    this.moduloPadreTipoGasto = tipo.moduloPadre ?? null;
    this.limpiarEnteActivo();
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
      this.cdr.markForCheck();
    } catch {
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

  private limpiarEnteActivo(): void {
    this.enteId = null;
    this.activoReferenciaId = null;
    this.textoEnteActivo = '';
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
