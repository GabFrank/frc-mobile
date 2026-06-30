import { Injectable } from '@angular/core';
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
import { PersonaSearchPageGQL, PersonaPageResponse } from '../graphql/personaSearchPage';
import { ProveedorSearchByPersonaPageGQL, ProveedorPageResponse } from '../graphql/proveedorSearchByPersonaPage';
import { SavePreGastoGQL } from '../graphql/savePreGasto';
import { TipoGastosGQL } from '../graphql/tipoGastos';
import { FilterPreGastosGQL } from '../graphql/preGastosSearch';
import { PreGastoPorIdGQL } from '../graphql/preGastoPorId';
import { ConfirmarRetiroFuncionarioGQL } from '../graphql/confirmarRetiroFuncionario';
import { SaveGastoRendicionGQL } from '../graphql/saveGastoRendicion';
import { GastoRendicionInput, PreGasto } from '../models/pre-gasto.model';
import {
  PreGastoDetalleFinanzasInput,
  PreGastoInput,
  SucursalItem,
  DatosSolicitudGasto,
  DetalleGastoFormulario,
} from '../interfaces';
import { TipoGasto } from '../models/tipo-gasto.model';
import { OpcionSeleccion } from 'src/app/components/selector-generico/selector-generico.component';
import {
  BuscadorModalConfigLocal,
  BuscadorModalConfigPaginado,
} from 'src/app/components/buscador-modal/buscador-modal.component';
import { VehiculoSearchPageGQL, VehiculoPageResponse } from '../graphql/vehiculoSearchPage';
import { MuebleSearchPageGQL, MueblePageResponse } from '../graphql/muebleSearchPage';
import { InmuebleSearchPageGQL, InmueblePageResponse } from '../graphql/inmuebleSearchPage';
import { EquipoSearchPageGQL, EquipoPageResponse } from '../graphql/equipoSearchPage';
import { EnteByReferenciaIdGQL } from '../graphql/enteByReferenciaId';
import { SaveEnteGQL } from '../graphql/saveEnte';
import {
  ActivoBusqueda,
  Ente,
  Equipo,
  Inmueble,
  ModuloPadreGasto,
  Mueble,
  TipoEnte,
  Vehiculo,
} from '../models/ente.model';
import {
  etiquetaModuloPadre,
  requiereEnteActivo,
  tipoEnteDesdeModuloPadre,
} from '../utils/tipo-gasto-modulo-reglas.util';
import { EnteFinancialSummaryGQL } from '../graphql/enteFinancialSummary';
import {
  construirVistaResumenFinanciero,
  EnteFinancialSummaryResponse,
  parsearFechaVencimientoSugerida,
  ResumenFinancieroEnteVista,
} from '../utils/ente-financial-summary.util';

export const TAM_PAGINA_BUSQUEDA = 25;

export type PersonaPageDto = NonNullable<PersonaPageResponse['data']>;
export type ProveedorPageDto = NonNullable<ProveedorPageResponse['data']>;
export type VehiculoPageDto = NonNullable<VehiculoPageResponse['data']>;
export type MueblePageDto = NonNullable<MueblePageResponse['data']>;
export type InmueblePageDto = NonNullable<InmueblePageResponse['data']>;
export type EquipoPageDto = NonNullable<EquipoPageResponse['data']>;


@Injectable({
  providedIn: 'root',
})
export class SolicitudGastosService {
  tiposGasto: TipoGasto[] = [];
  sucursales: SucursalItem[] = [];
  opcionesMoneda: OpcionSeleccion[] = [];
  opcionesFormaPago: OpcionSeleccion[] = [];
  opcionesUrgencia: OpcionSeleccion[] = [
    { valor: 'NORMAL', texto: 'Normal' },
    { valor: 'BAJA', texto: 'Baja' },
    { valor: 'ALTA', texto: 'Alta' },
    { valor: 'URGENTE', texto: 'Urgente' },
  ];

  configPersonaBenef: BuscadorModalConfigPaginado<Persona> = {
    modo: 'paginado',
    titulo: 'Persona beneficiaria',
    placeholder: 'Buscar persona',
    icono: 'person-outline',
    campoTexto: (p) => p.nombre || '',
    campoId: (p) => p.id,
    campoSubtexto: (p) => `ID: ${p.id}`,
    cargarPagina: (texto, pagina) => this.cargarPaginaPersonas(texto, pagina),
  };

  configProveedorBenef: BuscadorModalConfigPaginado<Proveedor> = {
    modo: 'paginado',
    titulo: 'Proveedor beneficiario',
    placeholder: 'Buscar proveedor',
    icono: 'business-outline',
    campoTexto: (p) => p.persona?.nombre || '',
    campoId: (p) => p.id,
    campoSubtexto: (p) => `ID: ${p.id}`,
    cargarPagina: (texto, pagina) => this.cargarPaginaProveedores(texto, pagina),
  };

  configTipoGasto: BuscadorModalConfigLocal<TipoGasto> = {
    modo: 'local',
    titulo: 'Tipo de gasto',
    placeholder: 'Buscar tipo de gasto',
    icono: 'pricetag-outline',
    items: [],
    campoTexto: (t) => t.descripcion || '',
    campoId: (t) => t.id,
    campoSubtexto: (t) => {
      const modulo = t.moduloPadre ? ` · ${this.etiquetaModuloPadre(t.moduloPadre)}` : '';
      return `ID: ${t.id}${modulo}`;
    },
  };

  configSucursal: BuscadorModalConfigLocal<SucursalItem> = {
    modo: 'local',
    titulo: 'Sucursal de retiro',
    placeholder: 'Buscar sucursal',
    icono: 'location-outline',
    items: [],
    campoTexto: (s) => s.nombre,
    campoId: (s) => s.id,
    campoSubtexto: (s) => `ID: ${s.id}`,
  };

  configActivo: BuscadorModalConfigPaginado<ActivoBusqueda> | null = null;

  constructor(
    private genericService: GenericCrudService,
    private guardarPreGastoGQL: SavePreGastoGQL,
    private tipoGastosGQL: TipoGastosGQL,
    private personaSearchPageGQL: PersonaSearchPageGQL,
    private proveedorSearchByPersonaPageGQL: ProveedorSearchByPersonaPageGQL,
    private vehiculoSearchPageGQL: VehiculoSearchPageGQL,
    private muebleSearchPageGQL: MuebleSearchPageGQL,
    private inmuebleSearchPageGQL: InmuebleSearchPageGQL,
    private equipoSearchPageGQL: EquipoSearchPageGQL,
    private enteByReferenciaIdGQL: EnteByReferenciaIdGQL,
    private saveEnteGQL: SaveEnteGQL,
    private sucursalService: SucursalService,
    private monedaService: MonedaService,
    private formasPagoGQL: FormasPagoGQL,
    private mainService: MainService,
    private notificacionService: NotificacionService,
    private filterPreGastosGQL: FilterPreGastosGQL,
    private preGastoPorIdGQL: PreGastoPorIdGQL,
    private confirmarRetiroGQL: ConfirmarRetiroFuncionarioGQL,
    private saveGastoRendicionGQL: SaveGastoRendicionGQL,
    private enteFinancialSummaryGQL: EnteFinancialSummaryGQL,
  ) { }

  async cargarDatosIniciales(): Promise<void> {
    const [sucursalesObs, tiposGastoObs, monedasObs, formasPagoObs] = await Promise.all([
      this.sucursalService.onGetAllSucursales(),
      this.genericService.onGet(this.tipoGastosGQL, { page: 0, size: 200 }, false),
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

    this.tiposGasto = ((await this.resolverObservable<TipoGasto[]>(tiposGastoObs)) ?? [])
      .filter((item) => item?.activo !== false && item?.autorizacion === true);

    const monedas = (await this.resolverObservable<Moneda[]>(monedasObs)) ?? [];
    const formasPago = (await this.resolverObservable<FormaPago[]>(formasPagoObs)) ?? [];

    this.opcionesMoneda = monedas.map((m) => ({
      valor: m.id,
      texto: `${m.simbolo} - ${m.denominacion}`,
    }));
    this.opcionesFormaPago = formasPago.map((fp) => ({
      valor: fp.descripcion,
      texto: `${fp.descripcion}`,
    }));
  }

  actualizarConfigTipoGasto(): void {
    this.configTipoGasto = { ...this.configTipoGasto, items: [...this.tiposGasto] };
  }

  actualizarConfigSucursal(): void {
    this.configSucursal = { ...this.configSucursal, items: [...this.sucursales] };
  }

  tipoEnteDesdeModuloPadre(moduloPadre?: ModuloPadreGasto | null): TipoEnte | null {
    return tipoEnteDesdeModuloPadre(moduloPadre);
  }

  requiereModuloPadreActivo(moduloPadre?: ModuloPadreGasto | null): boolean {
    return requiereEnteActivo(moduloPadre);
  }

  etiquetaModuloPadre(moduloPadre?: ModuloPadreGasto | null): string {
    return etiquetaModuloPadre(moduloPadre);
  }

  async cargarResumenFinancieroEnte(
    enteId: number,
    tipoGastoId?: number | null
  ): Promise<{ summary: EnteFinancialSummaryResponse; vista: ResumenFinancieroEnteVista } | null> {
    const obs = await this.genericService.onGet<EnteFinancialSummaryResponse>(
      this.enteFinancialSummaryGQL,
      { enteId, tipoGastoId: tipoGastoId ?? null },
      false
    );
    const summary = await this.resolverObservable(obs);
    if (!summary) {
      return null;
    }
    return {
      summary,
      vista: construirVistaResumenFinanciero(summary),
    };
  }

  aplicarAutocompletadoSolicitud(
    summary: EnteFinancialSummaryResponse,
    gastoItems: DetalleGastoFormulario[],
    contexto: {
      descripcion: string;
      fechaVencimiento: string;
      beneficiarioTipo: 'PERSONA' | 'PROVEEDOR';
      beneficiarioProveedorId: number | null;
      textoProveedorBeneficiario: string;
    }
  ): {
    descripcion: string;
    fechaVencimiento: string;
    gastoItems: DetalleGastoFormulario[];
    beneficiarioTipo: 'PERSONA' | 'PROVEEDOR';
    beneficiarioProveedorId: number | null;
    textoProveedorBeneficiario: string;
  } {
    const descripcion = summary.descripcionSugerida || contexto.descripcion;
    const fechaVencimiento = parsearFechaVencimientoSugerida(summary.fechaVencimientoSugerida)
      || contexto.fechaVencimiento;

    const items = [...gastoItems];
    if (items.length > 0 && summary.autocompletarMonto !== false && summary.montoSugerido != null) {
      const primerItem = { ...items[0] };
      const monedaId = summary.monedaId != null
        ? Number(summary.monedaId)
        : this.obtenerIdGuarani();
      if (monedaId != null) {
        primerItem.monedaId = monedaId;
      }
      primerItem.monto = Number(summary.montoSugerido);
      primerItem.montoTexto = this.formatearMontoInterno(primerItem.monto, primerItem.monedaId);
      items[0] = primerItem;
    }

    let beneficiarioTipo = contexto.beneficiarioTipo;
    let beneficiarioProveedorId = contexto.beneficiarioProveedorId;
    let textoProveedorBeneficiario = contexto.textoProveedorBeneficiario;

    if (summary.proveedorId != null) {
      beneficiarioTipo = 'PROVEEDOR';
      beneficiarioProveedorId = Number(summary.proveedorId);
      textoProveedorBeneficiario = (summary.proveedorNombre || '').toString().toUpperCase();
    }

    return {
      descripcion,
      fechaVencimiento,
      gastoItems: items,
      beneficiarioTipo,
      beneficiarioProveedorId,
      textoProveedorBeneficiario,
    };
  }

  private formatearMontoInterno(monto: number, monedaId: number | null): string {
    const precision = this.obtenerPrecisionMoneda(monedaId);
    return new Intl.NumberFormat('es-PY', {
      minimumFractionDigits: precision,
      maximumFractionDigits: precision,
    }).format(monto);
  }

  private obtenerPrecisionMoneda(monedaId: number | null): number {
    if (!monedaId) {
      return 0;
    }
    const opcion = this.opcionesMoneda.find((item) => Number(item.valor) === Number(monedaId));
    const texto = (opcion?.texto || '').toUpperCase();
    if (texto.includes('GUARANI') || texto.includes('₲')) {
      return 0;
    }
    return 2;
  }

  private obtenerIdGuarani(): number | null {
    const opcionGuarani = this.opcionesMoneda.find((opcion) => {
      const texto = (opcion.texto || '').toUpperCase();
      return texto.includes('GUARANI') || texto.includes('₲') || texto.includes('GS.');
    });
    return opcionGuarani ? Number(opcionGuarani.valor) : null;
  }

  iconoModuloPadre(moduloPadre?: ModuloPadreGasto | null): string {
    switch (moduloPadre) {
      case 'MUEBLE':
        return 'cube-outline';
      case 'INMUEBLE':
        return 'business-outline';
      case 'EQUIPOS':
        return 'hardware-chip-outline';
      default:
        return 'car-outline';
    }
  }

  prepararConfigActivo(moduloPadre?: ModuloPadreGasto | null): void {
    if (!this.requiereModuloPadreActivo(moduloPadre)) {
      this.configActivo = null;
      return;
    }

    const titulo = this.etiquetaModuloPadre(moduloPadre);
    const icono = this.iconoModuloPadre(moduloPadre);

    if (moduloPadre === 'VEHICULO') {
      this.configActivo = {
        modo: 'paginado',
        titulo: `Buscar ${titulo}`,
        placeholder: 'Buscar por chapa, marca o modelo',
        icono,
        campoTexto: (v) => this.textoVehiculo(v as Vehiculo),
        campoId: (v) => v.id,
        campoSubtexto: (v) => `ID: ${v.id}`,
        cargarPagina: (texto, pagina) => this.cargarPaginaVehiculos(texto, pagina),
      };
      return;
    }

    if (moduloPadre === 'MUEBLE') {
      this.configActivo = {
        modo: 'paginado',
        titulo: `Buscar ${titulo}`,
        placeholder: 'Buscar mueble',
        icono,
        campoTexto: (m) => ((m as Mueble).descripcion || '').toUpperCase(),
        campoId: (m) => m.id,
        campoSubtexto: (m) => `ID: ${m.id}`,
        cargarPagina: (texto, pagina) => this.cargarPaginaMuebles(texto, pagina),
      };
      return;
    }

    if (moduloPadre === 'EQUIPOS') {
      this.configActivo = {
        modo: 'paginado',
        titulo: `Buscar ${titulo}`,
        placeholder: 'Buscar equipo por identificador o descripción',
        icono,
        campoTexto: (e) => this.textoEquipo(e as Equipo),
        campoId: (e) => e.id,
        campoSubtexto: (e) => `ID: ${e.id}`,
        cargarPagina: (texto, pagina) => this.cargarPaginaEquipos(texto, pagina),
      };
      return;
    }

    this.configActivo = {
      modo: 'paginado',
      titulo: `Buscar ${titulo}`,
      placeholder: 'Buscar inmueble',
      icono,
      campoTexto: (i) => ((i as Inmueble).nombreAsignado || '').toUpperCase(),
      campoId: (i) => i.id,
      campoSubtexto: (i) => `ID: ${i.id}`,
      cargarPagina: (texto, pagina) => this.cargarPaginaInmuebles(texto, pagina),
    };
  }

  textoActivoSeleccionado(moduloPadre: ModuloPadreGasto | null | undefined, activo: ActivoBusqueda): string {
    if (moduloPadre === 'VEHICULO') {
      return this.textoVehiculo(activo as Vehiculo);
    }
    if (moduloPadre === 'MUEBLE') {
      return ((activo as Mueble).descripcion || '').toUpperCase();
    }
    if (moduloPadre === 'EQUIPOS') {
      return this.textoEquipo(activo as Equipo);
    }
    return ((activo as Inmueble).nombreAsignado || '').toUpperCase();
  }

  async resolverEnteDesdeActivo(moduloPadre: ModuloPadreGasto, referenciaId: number): Promise<Ente> {
    const tipoEnte = this.tipoEnteDesdeModuloPadre(moduloPadre);
    if (!tipoEnte) {
      throw new Error('El tipo de gasto no admite vinculación a un activo');
    }
    const enteExistente = await this.buscarEntePorReferencia(tipoEnte, referenciaId);
    if (enteExistente?.id) {
      return enteExistente;
    }

    const obs = await this.genericService.onSave<Ente>(this.saveEnteGQL, {
      tipoEnte,
      referenciaId,
      activo: true,
      usuarioId: this.mainService?.usuarioActual?.id,
    });
    const ente = await this.resolverObservable(obs);
    if (!ente?.id) {
      throw new Error('No se pudo vincular el activo seleccionado');
    }
    return ente;
  }

  obtenerResponsableSesion(): { id: number | null; texto: string } {
    const usuario = this.mainService?.usuarioActual;
    const persona = usuario?.persona;
    const personaId = persona?.id != null ? Number(persona.id) : NaN;
    if (!Number.isNaN(personaId) && personaId > 0) {
      return { id: personaId, texto: (persona?.nombre || '').toString().toUpperCase() };
    }

    const usuarioIdStorage = Number(localStorage.getItem('usuarioId'));
    const usuarioId = !Number.isNaN(Number(usuario?.id)) && Number(usuario?.id) > 0
      ? Number(usuario?.id)
      : (!Number.isNaN(usuarioIdStorage) && usuarioIdStorage > 0 ? usuarioIdStorage : NaN);
    if (!Number.isNaN(usuarioId) && usuarioId > 0) {
      const texto = (usuario?.persona?.nombre || usuario?.nickname || `USUARIO ${usuarioId}`)
        .toString()
        .toUpperCase();
      return { id: usuarioId, texto };
    }
    return { id: null, texto: '' };
  }

  validarFormulario(datos: DatosSolicitudGasto): string | null {
    if (!datos.sucursalId) {
      return 'Seleccione una sucursal de retiro';
    }
    if (!datos.responsableId) {
      return 'No se encontró la persona del usuario en sesión';
    }
    if (!datos.tipoGastoId) {
      return 'Seleccione un tipo de gasto';
    }
    const tipoGasto = this.tiposGasto.find((item) => Number(item.id) === Number(datos.tipoGastoId));
    if (this.requiereModuloPadreActivo(tipoGasto?.moduloPadre) && !datos.enteId) {
      return `Seleccione ${this.etiquetaModuloPadre(tipoGasto?.moduloPadre).toLowerCase()}`;
    }
    if (datos.beneficiarioTipo === 'PERSONA' && !datos.beneficiarioPersonaId) {
      return 'Seleccione la persona beneficiaria';
    }
    if (datos.beneficiarioTipo === 'PROVEEDOR' && !datos.beneficiarioProveedorId) {
      return 'Seleccione el proveedor beneficiario';
    }
    const monedasUsadas = new Set<number>();
    for (const item of datos.gastoItems) {
      if (!item.monto || item.monto <= 0) {
        return 'Cada detalle debe tener monto mayor a cero';
      }
      if (!item.monedaId || !item.formaPago) {
        return 'Complete moneda y forma de pago en cada detalle';
      }
      if (monedasUsadas.has(item.monedaId)) {
        return 'No se permite repetir moneda en los detalles';
      }
      monedasUsadas.add(item.monedaId);
    }
    return null;
  }

  async enviarSolicitud(datos: DatosSolicitudGasto): Promise<void> {
    const error = this.validarFormulario(datos);
    if (error) {
      this.notificacionService.warn(error);
      throw new Error(error);
    }

    const finanzas: PreGastoDetalleFinanzasInput[] = datos.gastoItems.map((item) => ({
      monto: item.monto!,
      monedaId: item.monedaId!,
      formaPago: item.formaPago!,
    }));

    const input: PreGastoInput = {
      sucursalId: datos.sucursalId!,
      sucursalCajaId: datos.sucursalId!,
      cajaId: this.extraerCajaId(),
      funcionarioId: datos.responsableId!,
      tipoGastoId: datos.tipoGastoId!,
      descripcion: datos.descripcion?.trim() || undefined,
      nivelUrgencia: datos.nivelUrgencia,
      beneficiarioPersonaId:
        datos.beneficiarioTipo === 'PERSONA' ? datos.beneficiarioPersonaId ?? undefined : undefined,
      beneficiarioProveedorId:
        datos.beneficiarioTipo === 'PROVEEDOR' ? datos.beneficiarioProveedorId ?? undefined : undefined,
      enteId: datos.enteId ?? undefined,
      fechaVencimiento: datos.fechaVencimiento || undefined,
      usuarioId: this.mainService?.usuarioActual?.id,
      finanzas,
    };

    try {
      const respuesta$ = await this.genericService.onSave<{ id: number }>(this.guardarPreGastoGQL, input);
      await this.resolverObservable(respuesta$);
      this.notificacionService.success('Solicitud de gasto creada');
    } catch (err) {
      const mensaje = this.extraerMensajeErrorPrivado(err);
      this.notificacionService.danger(mensaje || 'Error al guardar la solicitud de gasto');
      throw err;
    }
  }

  async obtenerPreGastoPorId(id: number, sucId?: number): Promise<PreGasto> {
    const obs = await this.genericService.onGet<PreGasto>(
      this.preGastoPorIdGQL,
      { id, sucId },
      false
    );
    const resultado = await this.resolverObservable(obs);
    if (!resultado) {
      throw new Error('Solicitud no encontrada');
    }
    return resultado;
  }

  async confirmarRetiroFuncionario(input: {
    preGastoId: number;
    sucursalId: number;
    qrToken: string;
    funcionarioPersonaId: number;
  }): Promise<PreGasto> {
    const res = await this.confirmarRetiroGQL
      .mutate({ input }, { fetchPolicy: 'no-cache', errorPolicy: 'all' })
      .pipe(first())
      .toPromise();
    if (res?.errors?.length) {
      throw new Error(res.errors[0]?.message || 'No se pudo confirmar el retiro');
    }
    const resultado = res?.data?.data;
    if (!resultado) {
      throw new Error('No se pudo confirmar el retiro');
    }
    return resultado;
  }

  async guardarGastoRendicion(input: GastoRendicionInput): Promise<void> {
    if (input.usuarioId == null) {
      input.usuarioId = this.mainService?.usuarioActual?.id;
    }
    const res = await this.saveGastoRendicionGQL
      .mutate({ input }, { fetchPolicy: 'no-cache', errorPolicy: 'all' })
      .pipe(first())
      .toPromise();
    if (res?.errors?.length) {
      throw new Error(res.errors[0]?.message || 'No se pudo guardar la rendición');
    }
  }

  extraerMensajeError(error: unknown): string | null {
    return this.extraerMensajeErrorPrivado(error);
  }

  async getMisSolicitudes(page = 0, size = 15, inicio?: string, fin?: string): Promise<any> {
    const obs = await this.genericService.onGet<any>(
      this.filterPreGastosGQL,
      {
        page,
        size,
        inicio,
        fin,
        estados: ["PENDIENTE", "AUTORIZADO", "RECHAZADO", "TRAMITE", "ENVIADO_A_TESORERIA"]
      },
      false
    );
    return (await this.resolverObservable(obs)) ?? { getContent: [] };
  }

  async cargarPaginaPersonas(texto: string, pagina: number): Promise<{ items: Persona[]; hayMas: boolean }> {
    const obs = await this.genericService.onGet<PersonaPageDto>(
      this.personaSearchPageGQL, { texto: texto ?? '', page: pagina, size: TAM_PAGINA_BUSQUEDA }, false,
    );
    const resultado = await this.resolverObservable(obs);
    return {
      items: resultado?.getContent ?? [],
      hayMas: resultado?.hasNext === true,
    };
  }

  async cargarPaginaProveedores(texto: string, pagina: number): Promise<{ items: Proveedor[]; hayMas: boolean }> {
    const obs = await this.genericService.onGet<ProveedorPageDto>(
      this.proveedorSearchByPersonaPageGQL, { texto: texto ?? '', page: pagina, size: TAM_PAGINA_BUSQUEDA }, false,
    );
    const resultado = await this.resolverObservable(obs);
    return {
      items: resultado?.getContent ?? [],
      hayMas: resultado?.hasNext === true,
    };
  }

  async cargarPaginaVehiculos(texto: string, pagina: number): Promise<{ items: Vehiculo[]; hayMas: boolean }> {
    const obs = await this.genericService.onGet<VehiculoPageDto>(
      this.vehiculoSearchPageGQL,
      { texto: texto ?? '', page: pagina, size: TAM_PAGINA_BUSQUEDA },
      false,
    );
    const resultado = await this.resolverObservable(obs);
    return {
      items: resultado?.getContent ?? [],
      hayMas: resultado?.hasNext === true,
    };
  }

  async cargarPaginaMuebles(texto: string, pagina: number): Promise<{ items: Mueble[]; hayMas: boolean }> {
    const obs = await this.genericService.onGet<MueblePageDto>(
      this.muebleSearchPageGQL,
      { texto: texto ?? '', page: pagina, size: TAM_PAGINA_BUSQUEDA },
      false,
    );
    const resultado = await this.resolverObservable(obs);
    return {
      items: resultado?.getContent ?? [],
      hayMas: resultado?.hasNext === true,
    };
  }

  async cargarPaginaInmuebles(texto: string, pagina: number): Promise<{ items: Inmueble[]; hayMas: boolean }> {
    const obs = await this.genericService.onGet<InmueblePageDto>(
      this.inmuebleSearchPageGQL,
      { texto: texto ?? '', page: pagina, size: TAM_PAGINA_BUSQUEDA },
      false,
    );
    const resultado = await this.resolverObservable(obs);
    return {
      items: resultado?.getContent ?? [],
      hayMas: resultado?.hasNext === true,
    };
  }

  async cargarPaginaEquipos(texto: string, pagina: number): Promise<{ items: Equipo[]; hayMas: boolean }> {
    const obs = await this.genericService.onGet<EquipoPageDto>(
      this.equipoSearchPageGQL,
      { texto: texto ?? '', page: pagina, size: TAM_PAGINA_BUSQUEDA },
      false,
    );
    const resultado = await this.resolverObservable(obs);
    return {
      items: resultado?.getContent ?? [],
      hayMas: resultado?.hasNext === true,
    };
  }

  private async buscarEntePorReferencia(tipoEnte: TipoEnte, referenciaId: number): Promise<Ente | null> {
    const obs = await this.genericService.onGet<Ente>(
      this.enteByReferenciaIdGQL,
      { tipoEnte, referenciaId },
      false,
    );
    return (await this.resolverObservable(obs)) ?? null;
  }

  private textoEquipo(equipo: Equipo): string {
    const identificador = (equipo.identificador || '').toUpperCase();
    const descripcion = (equipo.descripcion || '').toUpperCase();
    const marca = (equipo.modelo?.marca?.descripcion || '').toUpperCase();
    const modelo = (equipo.modelo?.descripcion || '').toUpperCase();
    const detalle = [marca, modelo].filter(Boolean).join(' ');
    if (identificador && detalle) {
      return `${identificador} - ${detalle}`;
    }
    if (identificador) {
      return identificador;
    }
    if (descripcion) {
      return descripcion;
    }
    return detalle || `EQUIPO ${equipo.id}`;
  }

  private textoVehiculo(vehiculo: Vehiculo): string {
    const chapa = (vehiculo.chapa || '').toUpperCase();
    const marca = (vehiculo.modelo?.marca?.descripcion || '').toUpperCase();
    const modelo = (vehiculo.modelo?.descripcion || '').toUpperCase();
    const detalle = [marca, modelo].filter(Boolean).join(' ');
    if (chapa && detalle) {
      return `${chapa} - ${detalle}`;
    }
    return chapa || detalle || `VEHÍCULO ${vehiculo.id}`;
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

  private extraerMensajeErrorPrivado(error: unknown): string | null {
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
