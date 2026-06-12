import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Cliente } from 'src/app/domains/cliente/cliente.model';
import { EstadoVentaCredito } from 'src/app/domains/venta-credito/venta-credito.model';
import { VentaCreditoService } from 'src/app/graphql/financiero/venta-credito/venta-credito.service';
import { ClienteService } from 'src/app/graphql/personas/cliente/graphql/cliente.service';
import { MainService } from 'src/app/services/main.service';
import { LoginService } from 'src/app/services/login.service';

@UntilDestroy()
@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit, OnDestroy {
  cliente: Cliente | null = null;
  totalAbiertos = 0;
  creditoDisponible = 0;
  porcentajeGastado = 0;

  constructor(
    private mainService: MainService,
    private clienteService: ClienteService,
    private ventaCreditoService: VentaCreditoService,
    private router: Router,
    public loginService: LoginService
  ) { }

  private intervalId: any;

  ngOnInit() {
    this.intervalId = setInterval(() => {
      if (this.mainService.usuarioActual) {
        clearInterval(this.intervalId);
        this.intervalId = null;
        this.cargarDatosConvenio();
      }
    }, 1000);
  }

  ionViewWillEnter() {
    if (this.mainService.usuarioActual && !this.intervalId) {
      // Refresh context when returning to home, only if not already attempting on init
      this.cargarDatosConvenio();
    }
  }

  async cargarDatosConvenio() {
    const personaId = this.mainService.usuarioActual?.persona?.id;
    if (!personaId) return;

    (await this.clienteService.onGetByPersonaId(personaId))
      .pipe(untilDestroyed(this))
      .subscribe(async (cliente) => {
        this.cliente = cliente;
        if (cliente) {
          this.calcularTotalGlobal(cliente.id);
        }
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
      .subscribe((res: any) => {
        if (res != null) {
          const todosLosConvenios = Array.isArray(res) ? res : res.getContent;

          this.totalAbiertos = 0;
          todosLosConvenios?.forEach((vc: any) => {
            this.totalAbiertos += vc.valorTotal;
          });

          if (this.cliente) {
            this.creditoDisponible = this.cliente.credito - this.totalAbiertos;
            this.porcentajeGastado = (this.totalAbiertos / this.cliente.credito) * 100;
            if (this.porcentajeGastado > 100) this.porcentajeGastado = 100;
          }
        }
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
}
