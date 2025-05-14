import { UntilDestroy } from '@ngneat/until-destroy';
import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { untilDestroyed } from '@ngneat/until-destroy';
import { MainService } from 'src/app/services/main.service';
import { MenuActionService } from 'src/app/services/menu-action.service';
import { Inventario } from '../inventario.model';
import { InventarioService } from '../inventario.service';
import { Location } from '@angular/common';
import { PageInfo } from 'src/app/app.component';
import { NotificacionService, TipoNotificacion } from 'src/app/services/notificacion.service';

@UntilDestroy()
@Component({
  selector: 'app-list-inventario',
  templateUrl: './list-inventario.component.html',
  styleUrls: ['./list-inventario.component.scss'],
})
export class ListInventarioComponent implements OnInit {

  inventarioList: Inventario[]
  pageIndex = 0;
  pageSize = 10;
  selectedPageInfo: PageInfo<Inventario>;
  private currentSortOrder: string | null = 'fecha';

  constructor(
    private inventarioService: InventarioService,
    private mainService: MainService,
    private router: Router,
    private route: ActivatedRoute,
    private _location: Location,
    private menuActionService: MenuActionService,
    private notificacionService: NotificacionService
  ) { }

  ngOnInit() {
    this.verificarUsuario();
  }

  async onGetInventarios() {
    if (!this.mainService?.usuarioActual?.id) {
      console.warn('Usuario actual no disponible para cargar inventarios.');
      return;
    }
    (await this.inventarioService.onGetInventarioUsuarioPaginado(
      this.mainService.usuarioActual.id,
      this.pageIndex,
      this.pageSize,
      this.currentSortOrder
    ))
      .pipe(untilDestroyed(this))
      .subscribe(res => {
        if (res != null) {
          this.selectedPageInfo = res;
          this.inventarioList = res.getContent;
          if (this.inventarioList.length === 0 && this.currentSortOrder !== null && this.currentSortOrder !== 'default') {
            this.notificacionService.danger('Item no encontrado');
          }
        }
      });
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
    this._location.back();
  }

  openFilterMenu() {
    this.menuActionService.presentActionSheet([
      { texto: 'Ordenar por fecha', role: 'fecha' },
      { texto: 'Inventarios abiertos', role: 'abiertas' },
      { texto: 'Inventarios concluidos', role: 'concluidas' },
      { texto: 'Inventarios cancelados', role: 'cancelados' }
    ]).then(res => {
      const role = res.role;
      if (role && role !== 'dismiss' && role !== 'backdrop' && role !== this.currentSortOrder) {
        this.applyFilterAndReload(role);
      }
    });
  }

  applyFilterAndReload(role: string | null) {
    this.currentSortOrder = role;
    this.pageIndex = 0;
    this.onGetInventarios();
  }

  handlePagination(e: number) {
    this.pageIndex = e - 1;
    this.onGetInventarios();
  }

}
