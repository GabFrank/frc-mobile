import { MenuActionService } from './../../../services/menu-action.service';
import { Router, ActivatedRoute } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { MainService } from './../../../services/main.service';
import { TransferenciaService } from './../transferencia.service';
import { Transferencia } from './../transferencia.model';
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

  constructor(
    private transferenciaService: TransferenciaService,
    private mainService: MainService,
    private router: Router,
    private route: ActivatedRoute,
    private _location: Location,
    private menuActionService: MenuActionService
  ) { }

  ngOnInit() {
    this.verificarUsuario()
  }

  onGetTransferencias() {
    this.transferenciaService.onGetTrasnferenciasPorUsuario(this.mainService?.usuarioActual?.id)
      .pipe(untilDestroyed(this))
      .subscribe(res => {
        if (res != null) {
          this.transferenciaList = res;
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
    this.router.navigate(['info', item.id], { relativeTo: this.route });
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
