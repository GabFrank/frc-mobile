import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { first } from 'rxjs/operators';
import { FormaPago } from 'src/app/domains/forma-pago/forma-pago.model';
import { Persona } from 'src/app/domains/personas/persona.model';
import { Sucursal } from 'src/app/domains/empresarial/sucursal/sucursal.model';
import { SucursalService } from 'src/app/domains/empresarial/sucursal/sucursal.service';
import { Moneda } from 'src/app/pages/operaciones/moneda/moneda.model';
import { MonedaService } from 'src/app/pages/operaciones/moneda/moneda.service';
import { FormasPagoGQL } from 'src/app/pages/operaciones/solicitud-pago/graphql/formasPago';
import { Proveedor } from 'src/app/pages/personas/proveedor/proveedor.model';
import { GenericCrudService } from 'src/app/generic/generic-crud.service';
import { MainService } from 'src/app/services/main.service';
import { NotificacionService } from 'src/app/services/notificacion.service';
import { SolicitudGastosService, TAM_PAGINA_BUSQUEDA } from '../../services/solicitud-gastos.service';
import { PreGastoDetalleFinanzasInput, PreGastoInput } from '../../interfaces';
import { TipoGasto } from '../../models/tipo-gasto.model';

interface DetalleGastoFormulario {
  id: number;
  monto: number | null;
  monedaId: number | null;
  formaPago: string | null;
}

@Component({
  selector: 'app-nuevo-solicitud-gastos',
  templateUrl: './nuevo-solicitud-gastos.component.html',
  styleUrls: ['./nuevo-solicitud-gastos.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NuevoSolicitudGastosComponent implements OnInit {
  readonly tamPaginaBusqueda = TAM_PAGINA_BUSQUEDA;

  gastoItems: DetalleGastoFormulario[] = [{ id: 1, monto: null, monedaId: null, formaPago: null }];
  private nextGastoId = 2;

  beneficiarioTipo: 'PERSONA' | 'PROVEEDOR' = 'PERSONA';
  isSucursalModalOpen = false;
  selectedSucursal = '';
  selectedSucursalId: number | null = null;
  sucursalSearch = '';
  sucursales: Array<{ id: number; nombre: string }> = [];
  sucursalesFiltradas: Array<{ id: number; nombre: string }> = [];

  isPersonaBenefModalOpen = false;
  personaBenefSearch = '';
  personasFiltradasBenef: Persona[] = [];
  personaBenefHayMas = false;
  personaBenefCargando = false;
  private personaBenefPaginaSiguiente = 0;
  private debouncePersonaBenef: ReturnType<typeof setTimeout> | null = null;
  textoPersonaBeneficiaria = '';

  isProveedorBenefModalOpen = false;
  proveedorBenefSearch = '';
  proveedoresFiltradosBenef: Proveedor[] = [];
  proveedorBenefHayMas = false;
  proveedorBenefCargando = false;
  private proveedorBenefPaginaSiguiente = 0;
  private debounceProveedorBenef: ReturnType<typeof setTimeout> | null = null;
  textoProveedorBeneficiario = '';

  /** Persona del usuario en sesión (PreGasto.funcionarioId en backend). */
  responsableId: number | null = null;
  textoResponsable = '';
  tipoGastoId: number | null = null;
  textoTipoGasto = '';
  beneficiarioPersonaId: number | null = null;
  beneficiarioProveedorId: number | null = null;
  fechaVencimiento = '';
  nivelUrgencia = 'NORMAL';
  descripcion = '';
  guardando = false;

  tiposGasto: TipoGasto[] = [];
  tiposGastoFiltrados: TipoGasto[] = [];
  isTipoGastoModalOpen = false;
  tipoGastoSearch = '';
  monedas: Moneda[] = [];
  formasPago: FormaPago[] = [];

  constructor(
    private solicitudGastosService: SolicitudGastosService,
    private monedaService: MonedaService,
    private sucursalService: SucursalService,
    private genericService: GenericCrudService,
    private formasPagoGQL: FormasPagoGQL,
    private mainService: MainService,
    private notificacionService: NotificacionService,
    private cdr: ChangeDetectorRef,
  ) {}

  async ngOnInit(): Promise<void> {
    await this.cargarDatosIniciales();
    this.aplicarResponsableSesion();
  }

  agregarDetalleGasto(): void {
    this.gastoItems = [
      ...this.gastoItems,
      { id: this.nextGastoId++, monto: null, monedaId: null, formaPago: null },
    ];
  }

  quitarDetalleGasto(id: number): void {
    if (this.gastoItems.length === 1) {
      return;
    }
    this.gastoItems = this.gastoItems.filter((item) => item.id !== id);
  }

  abrirModalSucursal(event?: Event): void {
    event?.stopPropagation();
    this.isSucursalModalOpen = true;
    this.cdr.markForCheck();
  }

  cerrarModalSucursal(): void {
    this.isSucursalModalOpen = false;
    this.cdr.markForCheck();
  }

  seleccionarSucursal(sucursal: { id: number; nombre: string }): void {
    this.selectedSucursal = sucursal.nombre;
    this.selectedSucursalId = sucursal.id;
    this.cerrarModalSucursal();
  }

  filtrarSucursales(): void {
    const query = this.sucursalSearch.trim().toLowerCase();
    if (!query) {
      this.sucursalesFiltradas = [...this.sucursales];
      return;
    }
    this.sucursalesFiltradas = this.sucursales.filter(
      (sucursal) =>
        sucursal.nombre.toLowerCase().includes(query) ||
        String(sucursal.id).includes(query),
    );
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

  abrirModalPersonaBeneficiaria(event?: Event): void {
    event?.stopPropagation();
    if (this.debouncePersonaBenef != null) {
      clearTimeout(this.debouncePersonaBenef);
      this.debouncePersonaBenef = null;
    }
    this.personaBenefSearch = '';
    this.personaBenefPaginaSiguiente = 0;
    this.personasFiltradasBenef = [];
    this.personaBenefHayMas = true;
    this.isPersonaBenefModalOpen = true;
    this.cdr.markForCheck();
    void this.cargarPersonasBenefPagina(false);
  }

  cerrarModalPersonaBeneficiaria(): void {
    this.isPersonaBenefModalOpen = false;
    if (this.debouncePersonaBenef != null) {
      clearTimeout(this.debouncePersonaBenef);
      this.debouncePersonaBenef = null;
    }
    this.cdr.markForCheck();
  }

  onPersonaBenefSearchChange(): void {
    if (this.debouncePersonaBenef != null) {
      clearTimeout(this.debouncePersonaBenef);
    }
    this.debouncePersonaBenef = setTimeout(() => {
      this.debouncePersonaBenef = null;
      this.personaBenefPaginaSiguiente = 0;
      void this.cargarPersonasBenefPagina(false);
    }, 350);
  }

  cargarMasPersonasBenef(event: CustomEvent): void {
    void this.cargarPersonasBenefPagina(true, event);
  }

  private async cargarPersonasBenefPagina(append: boolean, infiniteEvent?: CustomEvent): Promise<void> {
    if (this.personaBenefCargando) {
      this.completarInfinite(infiniteEvent);
      return;
    }
    if (append && !this.personaBenefHayMas) {
      this.completarInfinite(infiniteEvent);
      return;
    }
    this.personaBenefCargando = true;
    this.cdr.markForCheck();
    try {
      const page = append ? this.personaBenefPaginaSiguiente : 0;
      const texto = this.personaBenefSearch.trim();
      const obs = await this.solicitudGastosService.personasPaginadas(texto || null, page, this.tamPaginaBusqueda);
      const pagina = await this.resolverObservable(obs);
      const items = pagina?.getContent ?? [];
      if (append) {
        this.personasFiltradasBenef = [...this.personasFiltradasBenef, ...items];
      } else {
        this.personasFiltradasBenef = items;
      }
      this.personaBenefPaginaSiguiente = page + 1;
      this.personaBenefHayMas = pagina?.hasNext === true;
    } catch {
      if (!append) {
        this.personasFiltradasBenef = [];
      }
      this.personaBenefHayMas = false;
    } finally {
      this.personaBenefCargando = false;
      this.completarInfinite(infiniteEvent);
      this.cdr.markForCheck();
    }
  }

  seleccionarPersonaBeneficiaria(persona: Persona, event?: Event): void {
    event?.stopPropagation();
    this.beneficiarioPersonaId = persona.id;
    this.textoPersonaBeneficiaria = (persona.nombre || '').toString().toUpperCase();
    this.cerrarModalPersonaBeneficiaria();
    this.cdr.markForCheck();
  }

  abrirModalProveedorBeneficiario(event?: Event): void {
    event?.stopPropagation();
    if (this.debounceProveedorBenef != null) {
      clearTimeout(this.debounceProveedorBenef);
      this.debounceProveedorBenef = null;
    }
    this.proveedorBenefSearch = '';
    this.proveedorBenefPaginaSiguiente = 0;
    this.proveedoresFiltradosBenef = [];
    this.proveedorBenefHayMas = true;
    this.isProveedorBenefModalOpen = true;
    this.cdr.markForCheck();
    void this.cargarProveedoresBenefPagina(false);
  }

  cerrarModalProveedorBeneficiario(): void {
    this.isProveedorBenefModalOpen = false;
    if (this.debounceProveedorBenef != null) {
      clearTimeout(this.debounceProveedorBenef);
      this.debounceProveedorBenef = null;
    }
    this.cdr.markForCheck();
  }

  onProveedorBenefSearchChange(): void {
    if (this.debounceProveedorBenef != null) {
      clearTimeout(this.debounceProveedorBenef);
    }
    this.debounceProveedorBenef = setTimeout(() => {
      this.debounceProveedorBenef = null;
      this.proveedorBenefPaginaSiguiente = 0;
      void this.cargarProveedoresBenefPagina(false);
    }, 350);
  }

  cargarMasProveedoresBenef(event: CustomEvent): void {
    void this.cargarProveedoresBenefPagina(true, event);
  }

  private async cargarProveedoresBenefPagina(append: boolean, infiniteEvent?: CustomEvent): Promise<void> {
    if (this.proveedorBenefCargando) {
      this.completarInfinite(infiniteEvent);
      return;
    }
    if (append && !this.proveedorBenefHayMas) {
      this.completarInfinite(infiniteEvent);
      return;
    }
    this.proveedorBenefCargando = true;
    this.cdr.markForCheck();
    try {
      const page = append ? this.proveedorBenefPaginaSiguiente : 0;
      const texto = this.proveedorBenefSearch.trim();
      const obs = await this.solicitudGastosService.proveedoresPaginados(texto || null, page, this.tamPaginaBusqueda);
      const pagina = await this.resolverObservable(obs);
      const items = pagina?.getContent ?? [];
      if (append) {
        this.proveedoresFiltradosBenef = [...this.proveedoresFiltradosBenef, ...items];
      } else {
        this.proveedoresFiltradosBenef = items;
      }
      this.proveedorBenefPaginaSiguiente = page + 1;
      this.proveedorBenefHayMas = pagina?.hasNext === true;
    } catch {
      if (!append) {
        this.proveedoresFiltradosBenef = [];
      }
      this.proveedorBenefHayMas = false;
    } finally {
      this.proveedorBenefCargando = false;
      this.completarInfinite(infiniteEvent);
      this.cdr.markForCheck();
    }
  }

  seleccionarProveedorBeneficiario(proveedor: Proveedor, event?: Event): void {
    event?.stopPropagation();
    this.beneficiarioProveedorId = proveedor.id;
    this.textoProveedorBeneficiario = (proveedor.persona?.nombre || '').toString().toUpperCase();
    this.cerrarModalProveedorBeneficiario();
    this.cdr.markForCheck();
  }

  abrirModalTipoGasto(event?: Event): void {
    event?.stopPropagation();
    this.tipoGastoSearch = '';
    this.tiposGastoFiltrados = [...this.tiposGasto];
    this.isTipoGastoModalOpen = true;
    this.cdr.markForCheck();
  }

  cerrarModalTipoGasto(): void {
    this.isTipoGastoModalOpen = false;
    this.cdr.markForCheck();
  }

  filtrarTiposGasto(): void {
    const query = this.tipoGastoSearch.trim().toLowerCase();
    if (!query) {
      this.tiposGastoFiltrados = [...this.tiposGasto];
      return;
    }
    this.tiposGastoFiltrados = this.tiposGasto.filter((tipo) => {
      const descripcion = (tipo.descripcion || '').toString().toLowerCase();
      return descripcion.includes(query) || String(tipo.id).includes(query);
    });
  }

  seleccionarTipoGasto(tipo: TipoGasto, event?: Event): void {
    event?.stopPropagation();
    this.tipoGastoId = Number(tipo.id);
    this.textoTipoGasto = (tipo.descripcion || '').toString().toUpperCase();
    this.cerrarModalTipoGasto();
    this.cdr.markForCheck();
  }

  async enviarSolicitud(): Promise<void> {
    if (!this.selectedSucursalId) {
      this.notificacionService.warn('Seleccione una sucursal de retiro');
      return;
    }
    if (!this.responsableId) {
      this.notificacionService.warn('No se encontró la persona del usuario en sesión');
      return;
    }
    if (!this.tipoGastoId) {
      this.notificacionService.warn('Seleccione un tipo de gasto');
      return;
    }
    if (this.beneficiarioTipo === 'PERSONA' && !this.beneficiarioPersonaId) {
      this.notificacionService.warn('Seleccione la persona beneficiaria');
      return;
    }
    if (this.beneficiarioTipo === 'PROVEEDOR' && !this.beneficiarioProveedorId) {
      this.notificacionService.warn('Seleccione el proveedor beneficiario');
      return;
    }

    const finanzas: PreGastoDetalleFinanzasInput[] = [];
    const monedasUsadas = new Set<number>();
    for (const item of this.gastoItems) {
      if (!item.monto || item.monto <= 0) {
        this.notificacionService.warn('Cada detalle debe tener monto mayor a cero');
        return;
      }
      if (!item.monedaId || !item.formaPago) {
        this.notificacionService.warn('Complete moneda y forma de pago en cada detalle');
        return;
      }
      if (monedasUsadas.has(item.monedaId)) {
        this.notificacionService.warn('No se permite repetir moneda en los detalles');
        return;
      }
      monedasUsadas.add(item.monedaId);
      finanzas.push({
        monto: item.monto,
        monedaId: item.monedaId,
        formaPago: item.formaPago,
      });
    }

    const input: PreGastoInput = {
      sucursalId: this.selectedSucursalId,
      sucursalCajaId: this.selectedSucursalId,
      cajaId: this.extraerCajaId(),
      funcionarioId: this.responsableId,
      tipoGastoId: this.tipoGastoId,
      descripcion: this.descripcion?.trim() || undefined,
      nivelUrgencia: this.nivelUrgencia,
      beneficiarioPersonaId:
        this.beneficiarioTipo === 'PERSONA' ? this.beneficiarioPersonaId ?? undefined : undefined,
      beneficiarioProveedorId:
        this.beneficiarioTipo === 'PROVEEDOR' ? this.beneficiarioProveedorId ?? undefined : undefined,
      fechaVencimiento: this.fechaVencimiento || undefined,
      usuarioId: this.mainService?.usuarioActual?.id,
      finanzas,
    };

    this.guardando = true;
    try {
      const respuesta$ = await this.solicitudGastosService.guardarSolicitudGasto(input);
      await this.resolverObservable<{ id: number }>(respuesta$);
      this.notificacionService.success('Solicitud de gasto creada');
    } catch (error) {
      const mensaje = this.extraerMensajeError(error);
      this.notificacionService.danger(mensaje || 'Error al guardar la solicitud de gasto');
    } finally {
      this.guardando = false;
      this.cdr.markForCheck();
    }
  }

  private aplicarResponsableSesion(): void {
    const persona = this.mainService?.usuarioActual?.persona;
    const pid = persona?.id != null ? Number(persona.id) : NaN;
    if (!Number.isNaN(pid) && pid > 0) {
      this.responsableId = pid;
      this.textoResponsable = (persona?.nombre || '').toString().toUpperCase();
    } else {
      this.responsableId = null;
      this.textoResponsable = '';
    }
    this.cdr.markForCheck();
  }

  private async cargarDatosIniciales(): Promise<void> {
    try {
      const [sucursalesObs, tiposGastoObs, monedasObs, formasPagoObs] = await Promise.all([
        this.sucursalService.onGetAllSucursales(),
        this.solicitudGastosService.listarTiposGasto(),
        this.monedaService.onGetAll(),
        this.genericService.onGet(this.formasPagoGQL, { page: 0, size: 200 }, false),
      ]) as [
        Observable<Sucursal[]>,
        Observable<TipoGasto[]>,
        Observable<Moneda[]>,
        Observable<FormaPago[]>,
      ];

      const sucursales = (await this.resolverObservable<Sucursal[]>(sucursalesObs)) ?? [];
      this.sucursales = sucursales.map((item) => ({
        id: Number(item.id),
        nombre: item.nombre,
      }));
      this.sucursalesFiltradas = [...this.sucursales];

      this.tiposGasto = ((await this.resolverObservable<TipoGasto[]>(tiposGastoObs)) ?? []).filter((item) => item?.activo !== false);
      this.tiposGastoFiltrados = [...this.tiposGasto];
      this.monedas = (await this.resolverObservable<Moneda[]>(monedasObs)) ?? [];
      this.formasPago = (await this.resolverObservable<FormaPago[]>(formasPagoObs)) ?? [];
      this.cdr.markForCheck();
    } catch {
      this.notificacionService.danger('Error al cargar datos iniciales');
    }
  }

  private async resolverObservable<T>(obs$: Observable<T>): Promise<T> {
    return await obs$.pipe(first()).toPromise();
  }

  private completarInfinite(event?: CustomEvent): void {
    const target = event?.target as { complete?: () => void } | undefined;
    target?.complete?.();
  }

  private extraerCajaId(): number | undefined {
    const cajaIdStorage = localStorage.getItem('cajaId');
    if (!cajaIdStorage) {
      return undefined;
    }
    const cajaId = Number(cajaIdStorage);
    return Number.isNaN(cajaId) ? undefined : cajaId;
  }

  private extraerMensajeError(error: unknown): string | null {
    const err = error as { graphQLErrors?: Array<{ message?: string }>; message?: string };
    if (err?.graphQLErrors?.length && err.graphQLErrors[0]?.message) {
      return err.graphQLErrors[0].message ?? null;
    }
    if (typeof err?.message === 'string' && err.message.length > 0) {
      return err.message;
    }
    return null;
  }
}
