import { MenuActionService } from './../../../services/menu-action.service';
import { Router, ActivatedRoute } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { MainService } from './../../../services/main.service';
import { TransferenciaService } from './../transferencia.service';
import { Transferencia, EtapaTransferencia } from './../transferencia.model';
import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';

@UntilDestroy()
@Component({
  selector: 'app-list-transferencias',
  templateUrl: './list-transferencias.component.html',
  styleUrls: ['./list-transferencias.component.scss'],
})
export class ListTransferenciasComponent implements OnInit {

  transferenciaList: Transferencia[]
  modoInventario: boolean = false
  titulo: string = 'Lista de Transferencias'

  constructor(
    private transferenciaService: TransferenciaService,
    private mainService: MainService,
    private router: Router,
    private route: ActivatedRoute,
    private _location: Location,
    private menuActionService: MenuActionService
  ) { }

  ngOnInit() {
    this.route.paramMap.pipe(untilDestroyed(this)).subscribe(params => {
      const sucursalId = params.get('sucursalId');
      const etapa = params.get('etapa');
      
      if (sucursalId && etapa) {
        this.modoInventario = true;
        this.titulo = 'Transferencias Activas';
        console.log('Filtros - SucursalId:', sucursalId, 'Etapa:', etapa);
        this.onGetTransferenciasWithFilters(+sucursalId, etapa as EtapaTransferencia);
      } else {
        this.verificarUsuario();
      }
    });
  }

  async onGetTransferencias() {
    (await this.transferenciaService.onGetTrasnferenciasPorUsuario(this.mainService?.usuarioActual?.id))
      .pipe(untilDestroyed(this))
      .subscribe(res => {
        if (res != null) {
          this.transferenciaList = res;
        }
      })
  }

  async onGetTransferenciasWithFilters(sucursalId: number, etapa: EtapaTransferencia) {
    console.log('Buscando transferencias con filtros:', { sucursalDestinoId: sucursalId, etapa: etapa });
    (await this.transferenciaService.onGetTransferenciasWithFilters({
      sucursalDestinoId: sucursalId,
      etapa: etapa,
      page: 0,
      size: 20
    }))
      .pipe(untilDestroyed(this))
      .subscribe(res => {
        console.log('Resultado de transferencias:', res);
        if (res != null && res.getContent) {
          this.transferenciaList = res.getContent;
          console.log('Transferencias encontradas:', this.transferenciaList.length);
        } else {
          console.log('No se encontraron transferencias o respuesta es null');
          this.transferenciaList = [];
        }
      })
  }

  verificarUsuario() {
    if (this.mainService?.usuarioActual != null) {
      this.onGetTransferencias()
    } else {
      setTimeout(() => {
        this.verificarUsuario()
      }, 1000);
    }
  }

  onItemClick(item: Transferencia) {
    if (this.modoInventario) {
      // Si estamos en modo inventario, usar ruta absoluta
      this.router.navigate(['/transferencias/list/info', item.id]);
    } else {
      // Si no, usar ruta relativa como antes
      this.router.navigate(['info', item.id], { relativeTo: this.route });
    }
  }

  onBack() {
    this._location.back()
  }

  openFilterMenu() {
    this.menuActionService.presentActionSheet([
      { texto: 'Ordenar por fecha', role: 'fecha' },
      { texto: 'Primero transferencias abiertas', role: 'abiertas' },
      { texto: 'Primero concluidas', role: 'concluidas' },
    ]).then(res => {
      let role = res.role;
      this.onFiltrar(role)
      console.log(role)
    })
  }

  onFiltrar(role) {
    switch (role) {
      case 'fecha':
        this.transferenciaList = this.transferenciaList.sort((a, b) => {
          if (a.creadoEn > b.creadoEn) {
            return -1;
          } else {
            return 1
          }
        })
        break;
      case 'abiertas':
        this.transferenciaList = this.transferenciaList.sort((a, b) => {
          if (a.etapa > b.etapa) {
            return -1;
          } else {
            return 1
          }
        })
        break;
      case 'concluidas':
        this.transferenciaList = this.transferenciaList.sort((a, b) => {
          if (a.etapa < b.etapa) {
            return -1;
          } else {
            return 1
          }
        })
        break;
    }
  }
}
