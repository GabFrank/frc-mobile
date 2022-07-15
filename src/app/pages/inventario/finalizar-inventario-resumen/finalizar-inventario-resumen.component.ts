import { DialogoService } from 'src/app/services/dialogo.service';
import { MainService } from 'src/app/services/main.service';
import { untilDestroyed } from '@ngneat/until-destroy';
import { UntilDestroy } from '@ngneat/until-destroy';
import { NotificacionService } from 'src/app/services/notificacion.service';
import { InventarioService } from './../inventario.service';
import { ActivatedRoute, Router } from '@angular/router';
import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Inventario, InventarioEstado } from '../inventario.model';
import { Location } from '@angular/common';
import Chart from 'chart.js/auto';
import { Sector } from 'src/app/domains/sector/sector.model';
import { SectorService } from 'src/app/domains/sector/sector.service';
import { Usuario } from 'src/app/domains/personas/usuario.model';
import { convertMsToTime } from 'src/app/generic/utils/dateUtils';
import { CargandoService } from 'src/app/services/cargando.service';

@UntilDestroy()
@Component({
  selector: 'app-finalizar-inventario-resumen',
  templateUrl: './finalizar-inventario-resumen.component.html',
  styleUrls: ['./finalizar-inventario-resumen.component.scss'],
})
export class FinalizarInventarioResumenComponent implements OnInit {

  @ViewChild('doughnutCanvas', { static: true }) private doughnutCanvas: ElementRef;


  inventarioId;
  selectedInventario: Inventario;
  sectorList: Sector[] = []
  cantidadZonas: number = 0;
  total = 0
  terminadas = 0
  colaboradores: Usuario[] = [];
  duracion: string;


  doughnutChart: any;

  constructor(
    private route: ActivatedRoute,
    private inventarioService: InventarioService,
    private notificacionService: NotificacionService,
    private router: Router,
    private _location: Location,
    private sectorService: SectorService,
    private mainService: MainService,
    private dialogoService: DialogoService,
    private cargandoService: CargandoService
  ) { }

  ngOnInit() {
    this.route.paramMap.subscribe(res => {
      this.inventarioId = res.get('id')
      if (this.inventarioId != null) {
        this.cargarDatos(this.inventarioId)
      } else {
        this.notificacionService.openItemNoEncontrado()
        this.onBack()
      }
    }).unsubscribe();
  }

  async cargarDatos(id) {
    (await this.inventarioService.onGetInventario(this.inventarioId))
      .pipe(untilDestroyed(this))
      .subscribe(res => {
        if (res != null) {
          this.selectedInventario = res;
          this.onGetSectores(this.selectedInventario.sucursal.id)
          this.selectedInventario.inventarioProductoList.forEach(ip => {
            if (this.colaboradores.findIndex(u => u.id == ip.usuario.id) == -1) {
              this.colaboradores.push(ip.usuario)
            }
          })
          if (this.selectedInventario.fechaFin != null) {
            this.duracion = convertMsToTime(new Date(new Date(this.selectedInventario.fechaFin).getTime() - new Date(this.selectedInventario.fechaInicio).getTime()))
          } else {
            this.duracion = convertMsToTime(new Date(new Date().getTime() - new Date(this.selectedInventario.fechaInicio).getTime()))
          }
        }
      })
  }

  async onGetSectores(id) {
    (await this.sectorService.onGetSectores(id))
      .pipe(untilDestroyed(this))
      .subscribe(res => {
        this.sectorList = res;
        this.sectorList.forEach(s => {
          this.cantidadZonas = this.cantidadZonas + s.zonaList.length;
        })
        this.doughnutChartMethod();
      })
  }

  doughnutChartMethod() {
    this.total = this.cantidadZonas;
    this.terminadas = this.selectedInventario.inventarioProductoList.filter(ip => ip.concluido == true).length
    this.doughnutChart = new Chart(this.doughnutCanvas.nativeElement, {
      type: 'doughnut',
      data: {
        labels: ['Zonas inventariadas', 'Zonas faltantes'],
        datasets: [{
          label: '# of Votes',
          data: [this.terminadas, this.total - this.terminadas],
          backgroundColor: [
            '#43a047',
            '#f57c00'
          ]
        }]
      }
    });
  }

  onBack() {
    this._location.back()
  }

  onFinalizar() {
    let texto = 'Realmente desea finalizar este inventario?. Se procedera a ajustar el stock';
    if (this.terminadas > 0) texto = `Aún quedan zonas sin inventariar. Realmente desea finalizar este inventario?. Se procedera a ajustar el stock`;
    this.dialogoService.open('Atención!', texto).then(async res => {
      if (res.role == 'aceptar') {
        let loading = await this.cargandoService.open('Finalizando...')
        this.inventarioService.onFinalizarInventario(this.selectedInventario?.id)
          .pipe(untilDestroyed(this)) //cuando recibe respuesta se cierra observable
          .subscribe(respuesta => {
            this.cargandoService.close(loading)
            if(respuesta!=null) this.selectedInventario = respuesta;
          })
      }
    })
  }

  onCancelar() {
    let texto = 'Realmente desea cancelar este inventario?. Se procedera a reajustar el stock. Esta acción no se puede deshacer.';
    this.dialogoService.open('Atención!', texto).then(res => {
      if (res.role == 'aceptar') {
        this.inventarioService.onCancelarInventario(this.selectedInventario?.id)
          .pipe(untilDestroyed(this))
          .subscribe(res => { //res => true o false
            if(res){
              this.selectedInventario.estado = InventarioEstado.CANCELADO
            }
          })
      }
    })
  }

}

// this.menuActionService.presentActionSheet(menu).then(res => {
//   let role = res.role;
//   if (role == 'actualizar') {
//     this.ngOnInit()
//   } else if (role == 'finalizar') {
//     let zonasAbiertas: string[] = [];
//     this.inventarioService.onGetInventario(this.selectedInventario.id)
//       .pipe(untilDestroyed(this))
//       .subscribe(res2 => {
//         res2.inventarioProductoList.forEach(ip => {
//           if (ip.concluido == false) {
//             zonasAbiertas.push(ip?.zona?.descripcion)
//           }
//         })
//         let texto = 'Realmente desea finalizar este inventario?. Verifica si todas las zonas fueron inventariadas';
//         if (zonasAbiertas.length == 0) {
//           this.dialogoService.open('Atención!!', texto, true).then(res => {
//             if (res.role == 'aceptar') {
//               this.router.navigate(['finalizar'], { relativeTo: this.route });
//             }
//           })
//         } else {
//           let zonas = '';
//           zonasAbiertas.forEach(z => {
//             zonas = zonas.concat(...z + ', ')
//           })
//           this.notificacionService.open('Las siguientes zonas estan abiertas: ' + zonas, TipoNotificacion.WARN, 3)
//         }

//       })
//   }
// })
// }
