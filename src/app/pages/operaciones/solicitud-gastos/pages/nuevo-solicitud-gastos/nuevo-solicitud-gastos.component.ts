import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Persona } from 'src/app/domains/personas/persona.model';
import { Proveedor } from 'src/app/pages/personas/proveedor/proveedor.model';
import { TipoGasto } from '../../models/tipo-gasto.model';
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

  beneficiarioTipo: 'PERSONA' | 'PROVEEDOR' = 'PERSONA';
  isPersonaBenefModalOpen = false;
  isProveedorBenefModalOpen = false;
  isTipoGastoModalOpen = false;
  isSucursalModalOpen = false;
  responsableId: number | null = null;
  textoResponsable = '';
  tipoGastoId: number | null = null;
  textoTipoGasto = '';
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
  }

  quitarDetalleGasto(id: number): void {
    if (this.gastoItems.length === 1) {
      return;
    }
    this.gastoItems = this.gastoItems.filter((item) => item.id !== id);
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
    this.cerrarModalTipoGasto();
    this.cdr.markForCheck();
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
}
