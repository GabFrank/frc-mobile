import { UntilDestroy } from '@ngneat/until-destroy';
import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { untilDestroyed } from '@ngneat/until-destroy';
import { MainService } from 'src/app/services/main.service';
import { MenuActionService } from 'src/app/services/menu-action.service';
import { Inventario } from '../inventario.model';
import { InventarioService } from '../inventario.service';
import { Location } from '@angular/common';

@UntilDestroy()
@Component({
  selector: 'app-list-inventario',
  templateUrl: './list-inventario.component.html',
  styleUrls: ['./list-inventario.component.scss'],
})
export class ListInventarioComponent implements OnInit {

  inventarioList: Inventario[]

  constructor(
    private inventarioService: InventarioService,
    private mainService: MainService,
    private router: Router,
    private route: ActivatedRoute,
    private _location: Location,
    private menuActionService: MenuActionService
  ) { }

  ngOnInit() {
    this.route.paramMap.pipe(untilDestroyed(this)).subscribe(async (res) => {
      this.verificarUsuario();
    });
  }

  async onGetInventarios() {
    (await this.inventarioService.onGetInventarioUsuario())
      .pipe(untilDestroyed(this))
      .subscribe(res => {
        if (res != null) {
          this.inventarioList = res;
        }
      })
  }

  verificarUsuario() {
    if (this.mainService?.usuarioActual != null) {
      this.onGetInventarios()
    } else {
      setTimeout(() => {
        this.verificarUsuario()
      }, 1000);
    }
  }

  onItemClick(item: Inventario) {
    this.router.navigate(['info', item.id], { relativeTo: this.route });
  }

  onBack() {
    this._location.back()
  }

  openFilterMenu() {
    this.menuActionService.presentActionSheet([
      { texto: 'Ordenar por fecha', role: 'fecha' },
      { texto: 'Primero inventarios abiertas', role: 'abiertas' },
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
        this.inventarioList = this.inventarioList.sort((a, b) => {
          if (a.fechaInicio > b.fechaInicio) {
            return -1;
          } else {
            return 1
          }
        })
        break;
      case 'abiertas':
        this.inventarioList = this.inventarioList.sort((a, b) => {
          if (a.estado > b.estado) {
            return -1;
          } else {
            return 1
          }
        })
        break;
      case 'concluidas':
        this.inventarioList = this.inventarioList.sort((a, b) => {
          if (a.estado < b.estado) {
            return -1;
          } else {
            return 1
          }
        })
        break;
    }
  }

}
