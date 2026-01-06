import { Component, OnInit } from '@angular/core';
import { LoginService } from 'src/app/services/login.service';
import { VentaService } from 'src/app/graphql/operaciones/venta/venta.service';
import { untilDestroyed, UntilDestroy } from '@ngneat/until-destroy';
import * as moment from 'moment';
import { MainService } from 'src/app/services/main.service';
import { ClienteService } from 'src/app/graphql/personas/cliente/graphql/cliente.service';
import { VentaCreditoService } from 'src/app/graphql/financiero/venta-credito/venta-credito.service';
import { Cliente } from 'src/app/domains/cliente/cliente.model';
import { EstadoVentaCredito } from 'src/app/domains/venta-credito/venta-credito.model';
import { CountStockTotalGQL } from '../graphql/countStockTotal';
import { CountClientesTotalGQL } from '../graphql/countClientesTotal';
import { CountVentaCreditoGQL } from '../graphql/countVentaCredito';
import { ProductosVencidosGQL } from '../../producto/graphql/productosVencidos';

@UntilDestroy()
@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {

  totalVentasGs = 0;
  porcentajeCambio = 0;
  positivo = true;

  countStockTotal = 0;
  countClientesTotal = 0;
  countCreditosTotal = 0;
  countVencidosTotal = 0;

  clienteActual: Cliente;
  conveniosMes = 0;
  creditoHome = 0;
  utilizadoHome = 0;
  saldoHome = 0;

  constructor(
    public loginService: LoginService,
    private ventaService: VentaService,
    private countStockTotalGQL: CountStockTotalGQL,
    private countClientesTotalGQL: CountClientesTotalGQL,
    private countVentaCreditoGQL: CountVentaCreditoGQL,
    public mainService: MainService,
    private clienteService: ClienteService,
    private ventaCreditoService: VentaCreditoService,
    private productosVencidosGQL: ProductosVencidosGQL
  ) { }

  ngOnInit() {
    moment.locale('es');
    this.loginService.isAuthenticated().subscribe(usuario => {
      if (usuario) {
        this.loadVentasHoy();
        this.loadMetrics();
        this.loadClienteInfo();
      }
    });
  }

  loadVentasHoy() {
    const usuarioId = this.loginService.usuarioActual?.id;
    if (!usuarioId) return;

    const hoy = moment().format('YYYY-MM-DD');
    const ayer = moment().subtract(1, 'days').format('YYYY-MM-DD');

    const inicioHoy = hoy + ' 00:00';
    const finHoy = hoy + ' 23:59';

    const inicioAyer = ayer + ' 00:00';
    const finAyer = ayer + ' 23:59';

    // Cargar hoy
    this.ventaService.onGetVentasPorSucursalAndUsuario(usuarioId, inicioHoy, finHoy)
      .pipe(untilDestroyed(this))
      .subscribe(resHoy => {
        if (resHoy) {
          this.totalVentasGs = resHoy.reduce((acc, curr) => acc + curr.total, 0);

          // Cargar ayer para comparar
          this.ventaService.onGetVentasPorSucursalAndUsuario(usuarioId, inicioAyer, finAyer)
            .pipe(untilDestroyed(this))
            .subscribe(resAyer => {
              if (resAyer) {
                const totalAyer = resAyer.reduce((acc, curr) => acc + curr.total, 0);
                if (totalAyer > 0) {
                  this.porcentajeCambio = ((this.totalVentasGs - totalAyer) / totalAyer) * 100;
                  this.positivo = this.porcentajeCambio >= 0;
                } else {
                  this.porcentajeCambio = this.totalVentasGs > 0 ? 100 : 0;
                  this.positivo = true;
                }
              }
            });
        }
      });
  }

  loadMetrics() {
    // Stock Total
    this.countStockTotalGQL.fetch({}, { fetchPolicy: 'no-cache' })
      .pipe(untilDestroyed(this))
      .subscribe(res => {
        this.countStockTotal = res.data?.data || 0;
      });

    // Clientes Total
    this.countClientesTotalGQL.fetch({}, { fetchPolicy: 'no-cache' })
      .pipe(untilDestroyed(this))
      .subscribe(res => {
        this.countClientesTotal = res.data?.data || 0;
      });

    // Créditos Total
    this.countVentaCreditoGQL.fetch({}, { fetchPolicy: 'no-cache' })
      .pipe(untilDestroyed(this))
      .subscribe(res => {
        this.countCreditosTotal = res.data?.data || 0;
      });

    // Productos Vencidos
    const fechaFin = moment().format('YYYY-MM-DD');
    const fechaInicio = moment().subtract(7, 'days').format('YYYY-MM-DD');

    this.productosVencidosGQL.fetch({
      soloRealmenteVencidos: true,
      startDate: fechaInicio,
      endDate: fechaFin,
      page: 0,
      size: 1
    }, { fetchPolicy: 'no-cache' })
      .pipe(untilDestroyed(this))
      .subscribe(res => {
        this.countVencidosTotal = res.data?.productosVencidos?.getTotalElements || 0;
      });
  }

  async loadClienteInfo() {
    const personaId = this.loginService.usuarioActual?.persona?.id;
    if (personaId) {
      (await this.clienteService.onGetByPersonaId(personaId)).subscribe(async (cliente) => {
        if (cliente) {
          this.clienteActual = cliente;
          this.creditoHome = cliente.credito || 0;

          (await this.ventaCreditoService.onGetPorClienteId(cliente.id, EstadoVentaCredito.ABIERTO, null, null))
            .pipe(untilDestroyed(this))
            .subscribe((res) => {
              if (res) {
                const creditos = Array.isArray(res) ? res : res.getContent || [];

                this.utilizadoHome = 0;
                creditos.forEach(vc => {
                  this.utilizadoHome += vc.valorTotal;
                });

                this.saldoHome = this.creditoHome - this.utilizadoHome;
              }
            });

          // Fetch all for this month to count them
          (await this.ventaCreditoService.onGetPorClienteId(cliente.id, null, null, null))
            .pipe(untilDestroyed(this))
            .subscribe((res) => {
              if (res) {
                const allCreditos = Array.isArray(res) ? res : res.getContent || [];
                const startOfMonth = moment().startOf('month');
                this.conveniosMes = allCreditos.filter(vc => moment(vc.creadoEn).isSameOrAfter(startOfMonth)).length;
              }
            });
        }
      });
    }
  }
}
