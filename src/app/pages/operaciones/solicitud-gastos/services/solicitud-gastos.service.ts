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
import {
  PreGastoDetalleFinanzasInput,
  PreGastoInput,
  SucursalItem,
  DatosSolicitudGasto,
} from '../interfaces';
import { TipoGasto } from '../models/tipo-gasto.model';
import { OpcionSeleccion } from 'src/app/components/selector-generico/selector-generico.component';
import {
  BuscadorModalConfigLocal,
  BuscadorModalConfigPaginado,
} from 'src/app/components/buscador-modal/buscador-modal.component';

export const TAM_PAGINA_BUSQUEDA = 25;

export type PersonaPageDto = NonNullable<PersonaPageResponse['data']>;
export type ProveedorPageDto = NonNullable<ProveedorPageResponse['data']>;


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
    campoSubtexto: (t) => `ID: ${t.id}`,
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

  constructor(
    private genericService: GenericCrudService,
    private guardarPreGastoGQL: SavePreGastoGQL,
    private tipoGastosGQL: TipoGastosGQL,
    private personaSearchPageGQL: PersonaSearchPageGQL,
    private proveedorSearchByPersonaPageGQL: ProveedorSearchByPersonaPageGQL,
    private sucursalService: SucursalService,
    private monedaService: MonedaService,
    private formasPagoGQL: FormasPagoGQL,
    private mainService: MainService,
    private notificacionService: NotificacionService,
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
      .filter((item) => item?.activo !== false);

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

  obtenerResponsableSesion(): { id: number | null; texto: string } {
    const persona = this.mainService?.usuarioActual?.persona;
    const pid = persona?.id != null ? Number(persona.id) : NaN;
    if (!Number.isNaN(pid) && pid > 0) {
      return { id: pid, texto: (persona?.nombre || '').toString().toUpperCase() };
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
      fechaVencimiento: datos.fechaVencimiento || undefined,
      usuarioId: this.mainService?.usuarioActual?.id,
      finanzas,
    };

    try {
      const respuesta$ = await this.genericService.onSave<{ id: number }>(this.guardarPreGastoGQL, input);
      await this.resolverObservable(respuesta$);
      this.notificacionService.success('Solicitud de gasto creada');
    } catch (err) {
      const mensaje = this.extraerMensajeError(err);
      this.notificacionService.danger(mensaje || 'Error al guardar la solicitud de gasto');
      throw err;
    }
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
