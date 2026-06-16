import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Cliente } from 'src/app/domains/cliente/cliente.model';
import { ROLES } from 'src/app/domains/personas/roles/roles.enum';
import { RoleService } from 'src/app/domains/personas/roles/role.service';
import { EstadoVentaCredito } from 'src/app/domains/venta-credito/venta-credito.model';
import { VentaCreditoService } from 'src/app/graphql/financiero/venta-credito/venta-credito.service';
import { ClienteService } from 'src/app/graphql/personas/cliente/graphql/cliente.service';
import { LoginService } from 'src/app/services/login.service';
import { MainService } from 'src/app/services/main.service';

interface QuickAction {
  label: string;
  route: (string | boolean)[];
  icon: string;
  toneRed?: boolean;
  toneAmber?: boolean;
  toneBlue?: boolean;
  toneOrange?: boolean;
  roles?: string[];
}

@UntilDestroy()
@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent implements OnInit, OnDestroy {
  cliente: Cliente | null = null;
  totalAbiertos = 0;
  creditoDisponible = 0;
  porcentajeGastado = 0;
  mostrarCredito = false;
  quickActions: QuickAction[] = [];
  quickActionsOddCount = false;
  puedeAccederCaja = false;
  iconoVisibilidadCredito = 'visibility_off';
  etiquetaVisibilidadCredito = 'Mostrar valores';
  anchoProgreso = 0;
  valorProgresoAria: number | null = null;

  private readonly allQuickActions: QuickAction[] = [
    {
      label: 'Ver Producto',
      route: ['/producto/buscar', 'true'],
      icon: 'barcode_scanner',
      toneRed: true,
    },
    {
      label: 'Consultar Precio',
      route: ['/producto/consultar-precio'],
      icon: 'sell',
      toneAmber: true,
    },
    {
      label: 'Control Inventario',
      route: ['/inventario/control-inventario'],
      icon: 'inventory_2',
      toneBlue: true,
      roles: [ROLES.VER_INVENTARIO],
    },
    {
      label: 'Productos Vencidos',
      route: ['/producto/productos-vencidos'],
      icon: 'event_busy',
      toneOrange: true,
    },
  ];

  private intervalId: ReturnType<typeof setInterval> | null = null;

  constructor(
    private mainService: MainService,
    private clienteService: ClienteService,
    private ventaCreditoService: VentaCreditoService,
    private loginService: LoginService,
    private roleService: RoleService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.actualizarPermisosYAccesos();
    this.actualizarEstadoVisibilidadCredito();

    this.mainService.authenticationSub
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        this.actualizarPermisosYAccesos();
        this.cdr.markForCheck();
      });

    this.intervalId = setInterval(() => {
      if (this.mainService.usuarioActual) {
        clearInterval(this.intervalId!);
        this.intervalId = null;
        this.cargarDatosConvenio();
      }
    }, 1000);
  }

  ionViewWillEnter() {
    this.actualizarPermisosYAccesos();

    if (this.mainService.usuarioActual && !this.intervalId) {
      this.cargarDatosConvenio();
    }

    this.cdr.markForCheck();
  }

  async cargarDatosConvenio() {
    const personaId = this.mainService.usuarioActual?.persona?.id;
    if (!personaId) {
      return;
    }

    (await this.clienteService.onGetByPersonaId(personaId))
      .pipe(untilDestroyed(this))
      .subscribe(async (cliente) => {
        this.cliente = cliente;
        if (cliente) {
          this.calcularTotalGlobal(cliente.id);
        }
        this.cdr.markForCheck();
      });
  }

  async calcularTotalGlobal(clienteId: number) {
    (await this.ventaCreditoService.onGetPorClienteId(
      clienteId,
      EstadoVentaCredito.ABIERTO,
      null,
      null
    ))
      .pipe(untilDestroyed(this))
      .subscribe((res: { getContent?: { valorTotal: number }[] } | { valorTotal: number }[]) => {
        if (res == null) {
          return;
        }

        const todosLosConvenios = Array.isArray(res) ? res : res.getContent;

        this.totalAbiertos = 0;
        todosLosConvenios?.forEach((vc) => {
          this.totalAbiertos += vc.valorTotal;
        });

        if (this.cliente) {
          this.creditoDisponible = this.cliente.credito - this.totalAbiertos;
          this.porcentajeGastado = (this.totalAbiertos / this.cliente.credito) * 100;
          if (this.porcentajeGastado > 100) {
            this.porcentajeGastado = 100;
          }
        }

        this.actualizarEstadoVisibilidadCredito();
        this.cdr.markForCheck();
      });
  }

  ngOnDestroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  goToListaConvenios() {
    this.router.navigate(['/mis-finanzas/list-convenio']);
  }

  toggleCreditoVisibilidad(event: Event) {
    event.stopPropagation();
    this.mostrarCredito = !this.mostrarCredito;
    this.actualizarEstadoVisibilidadCredito();
    this.cdr.markForCheck();
  }

  private actualizarPermisosYAccesos(): void {
    const roles = this.loginService.usuarioActual?.roles;

    this.puedeAccederCaja = this.roleService.puedeAccederCaja(roles);
    this.quickActions = this.allQuickActions.filter((action) => {
      if (!action.roles?.length) {
        return true;
      }

      return this.roleService.tieneAlgunRol(roles, action.roles);
    });
    this.quickActionsOddCount = this.quickActions.length % 2 !== 0;
  }

  private actualizarEstadoVisibilidadCredito(): void {
    this.iconoVisibilidadCredito = this.mostrarCredito ? 'visibility' : 'visibility_off';
    this.etiquetaVisibilidadCredito = this.mostrarCredito ? 'Ocultar valores' : 'Mostrar valores';
    this.anchoProgreso = this.mostrarCredito ? this.porcentajeGastado : 0;
    this.valorProgresoAria = this.mostrarCredito ? this.porcentajeGastado : null;
  }
}
