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
import { SolicitudGastosService } from '../../services/solicitud-gastos.service';
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
  gastoItems: DetalleGastoFormulario[] = [{ id: 1, monto: null, monedaId: null, formaPago: null }];
  private nextGastoId = 2;

  beneficiarioTipo: 'PERSONA' | 'PROVEEDOR' = 'PERSONA';
  isSucursalModalOpen = false;
  selectedSucursal = '';
  selectedSucursalId: number | null = null;
  sucursalSearch = '';
  sucursales: Array<{ id: number; nombre: string }> = [];
  sucursalesFiltradas: Array<{ id: number; nombre: string }> = [];

  isFuncionarioModalOpen = false;
  funcionarioSearch = '';
  funcionariosFiltrados: Persona[] = [];
  textoResponsable = '';

  isPersonaBenefModalOpen = false;
  personaBenefSearch = '';
  personasFiltradasBenef: Persona[] = [];
  textoPersonaBeneficiaria = '';

  isProveedorBenefModalOpen = false;
  proveedorBenefSearch = '';
  proveedoresFiltradosBenef: Proveedor[] = [];
  textoProveedorBeneficiario = '';

  responsableId: number | null = null;
  tipoGastoId: number | null = null;
  beneficiarioPersonaId: number | null = null;
  beneficiarioProveedorId: number | null = null;
  fechaVencimiento = '';
  nivelUrgencia = 'NORMAL';
  descripcion = '';
  guardando = false;

  personas: Persona[] = [];
  funcionarios: Persona[] = [];
  proveedores: Proveedor[] = [];
  tiposGasto: TipoGasto[] = [];
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

  abrirModalSucursal(): void {
    this.isSucursalModalOpen = true;
  }

  cerrarModalSucursal(): void {
    this.isSucursalModalOpen = false;
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

  abrirModalFuncionario(): void {
    this.isFuncionarioModalOpen = true;
    this.funcionarioSearch = '';
    this.funcionariosFiltrados = [...this.funcionarios];
  }

  cerrarModalFuncionario(): void {
    this.isFuncionarioModalOpen = false;
  }

  filtrarFuncionariosModal(): void {
    const query = this.funcionarioSearch.trim().toLowerCase();
    if (!query) {
      this.funcionariosFiltrados = [...this.funcionarios];
      return;
    }
    this.funcionariosFiltrados = this.funcionarios.filter(
      (item) =>
        (item.nombre || '').toLowerCase().includes(query) || String(item.id).includes(query),
    );
  }

  seleccionarFuncionario(persona: Persona): void {
    this.responsableId = persona.id;
    this.textoResponsable = (persona.nombre || '').toString().toUpperCase();
    this.cerrarModalFuncionario();
    this.cdr.markForCheck();
  }

  abrirModalPersonaBeneficiaria(): void {
    this.isPersonaBenefModalOpen = true;
    this.personaBenefSearch = '';
    this.personasFiltradasBenef = [...this.personas];
  }

  cerrarModalPersonaBeneficiaria(): void {
    this.isPersonaBenefModalOpen = false;
  }

  filtrarPersonasBenefModal(): void {
    const query = this.personaBenefSearch.trim().toLowerCase();
    if (!query) {
      this.personasFiltradasBenef = [...this.personas];
      return;
    }
    this.personasFiltradasBenef = this.personas.filter(
      (item) =>
        (item.nombre || '').toLowerCase().includes(query) || String(item.id).includes(query),
    );
  }

  seleccionarPersonaBeneficiaria(persona: Persona): void {
    this.beneficiarioPersonaId = persona.id;
    this.textoPersonaBeneficiaria = (persona.nombre || '').toString().toUpperCase();
    this.cerrarModalPersonaBeneficiaria();
    this.cdr.markForCheck();
  }

  abrirModalProveedorBeneficiario(): void {
    this.isProveedorBenefModalOpen = true;
    this.proveedorBenefSearch = '';
    this.proveedoresFiltradosBenef = [...this.proveedores];
  }

  cerrarModalProveedorBeneficiario(): void {
    this.isProveedorBenefModalOpen = false;
  }

  filtrarProveedoresBenefModal(): void {
    const query = this.proveedorBenefSearch.trim().toLowerCase();
    if (!query) {
      this.proveedoresFiltradosBenef = [...this.proveedores];
      return;
    }
    this.proveedoresFiltradosBenef = this.proveedores.filter((item) => {
      const nombre = (item.persona?.nombre || '').toLowerCase();
      return nombre.includes(query) || String(item.id).includes(query);
    });
  }

  seleccionarProveedorBeneficiario(proveedor: Proveedor): void {
    this.beneficiarioProveedorId = proveedor.id;
    this.textoProveedorBeneficiario = (proveedor.persona?.nombre || '').toString().toUpperCase();
    this.cerrarModalProveedorBeneficiario();
    this.cdr.markForCheck();
  }

  async enviarSolicitud(): Promise<void> {
    if (!this.selectedSucursalId) {
      this.notificacionService.warn('Seleccione una sucursal de retiro');
      return;
    }
    if (!this.responsableId) {
      this.notificacionService.warn('Seleccione un responsable');
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

  private async cargarDatosIniciales(): Promise<void> {
    try {
      const [
        sucursalesObs,
        personasObs,
        proveedoresObs,
        tiposGastoObs,
        monedasObs,
        formasPagoObs,
      ] = await Promise.all([
        this.sucursalService.onGetAllSucursales(),
        this.solicitudGastosService.listarTodasLasPersonas(),
        this.solicitudGastosService.listarTodosLosProveedores(),
        this.solicitudGastosService.listarTiposGasto(),
        this.monedaService.onGetAll(),
        this.genericService.onGet(this.formasPagoGQL, { page: 0, size: 200 }, false),
      ]) as [
        Observable<Sucursal[]>,
        Observable<Persona[]>,
        Observable<Proveedor[]>,
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

      const personas = (await this.resolverObservable<Persona[]>(personasObs)) ?? [];
      this.personas = personas;
      this.funcionarios = personas.filter((persona) => persona?.isFuncionario === true);

      this.proveedores = (await this.resolverObservable<Proveedor[]>(proveedoresObs)) ?? [];
      this.tiposGasto = ((await this.resolverObservable<TipoGasto[]>(tiposGastoObs)) ?? []).filter((item) => item?.activo !== false);
      this.monedas = (await this.resolverObservable<Moneda[]>(monedasObs)) ?? [];
      this.formasPago = (await this.resolverObservable<FormaPago[]>(formasPagoObs)) ?? [];
      this.cdr.markForCheck();
    } catch (error) {
      this.notificacionService.danger('Error al cargar datos iniciales');
    }
  }

  private async resolverObservable<T>(obs$: Observable<T>): Promise<T> {
    return await obs$.pipe(first()).toPromise();
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
