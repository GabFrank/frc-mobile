import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { Cliente } from 'src/app/domains/cliente/cliente.model';
import { EstadoVentaCredito } from 'src/app/domains/venta-credito/venta-credito.model';
import { VentaCreditoService } from 'src/app/graphql/financiero/venta-credito/venta-credito.service';
import { ClienteService } from 'src/app/graphql/personas/cliente/graphql/cliente.service';
import { MainService } from 'src/app/services/main.service';

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
  private subscriptions: Subscription[] = [];

  constructor(
    private mainService: MainService,
    private clienteService: ClienteService,
    private ventaCreditoService: VentaCreditoService,
    private router: Router
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
    // Clear old subscriptions to avoid memory leaks when called repeatedly (e.g. from ionViewWillEnter)
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions = [];

    const personaId = this.mainService.usuarioActual?.persona?.id;
    if (!personaId) return;

    const subCliente = (await this.clienteService.onGetByPersonaId(personaId)).subscribe(async (cliente) => {
      this.cliente = cliente;
      if (cliente) {
        this.calcularTotalGlobal(cliente.id);
      }
    });
    this.subscriptions.push(subCliente);
  }

  async calcularTotalGlobal(clienteId: number) {
    const subVentaCredito = (await this.ventaCreditoService.onGetPorClienteId(
      clienteId,
      EstadoVentaCredito.ABIERTO,
      null,
      null
    )).subscribe((res: any) => {
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

    this.subscriptions.push(subVentaCredito);
  }

  ngOnDestroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  goToListaConvenios() {
    this.router.navigate(['/mis-finanzas/list-convenio']);
  }
}
