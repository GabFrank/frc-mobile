import { Component, OnInit } from '@angular/core';
import { RecepcionMercaderia } from '../../recepcion-mercaderia/recepcion-mercaderia.model';
import { MainService } from 'src/app/services/main.service';
import { RecepcionMercaderiaService } from '../../recepcion-mercaderia/recepcion-mercaderia.service';
import { PageInfo } from 'src/app/app.component';
import { Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-historico-nota-recepcion',
  templateUrl: './historico-nota-recepcion.component.html',
  styleUrls: ['./historico-nota-recepcion.component.scss']
})
export class HistoricoNotaRecepcionComponent implements OnInit {
  recepcionMercaderiaList: RecepcionMercaderia[];
  pageIndex = 0;
  pageSize = 5;
  selectedPageInfo: PageInfo<RecepcionMercaderia>;
  constructor(
    private mainService: MainService,
    private recepcionMercaderiaService: RecepcionMercaderiaService,
    private _location: Location,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    setTimeout(() => {
      this.onSearchRecepcionMercaderia();
    }, 500);
  }

  async onSearchRecepcionMercaderia() {
    (
      await this.recepcionMercaderiaService.onGetRecepcionMercaderiaListPorUsuarioId(
        this.mainService.usuarioActual.id,
        this.pageIndex,
        this.pageSize
      )
    ).subscribe((res) => {
      console.log(res);

      this.selectedPageInfo = res;
      // Calcular cantNotas desde las notas asociadas
      this.recepcionMercaderiaList = res.getContent.map(rm => {
        rm.cantNotas = rm.notas?.length || 0;
        return rm;
      });
    });
  }

  onItemClick(recepcionMercaderia: RecepcionMercaderia) {
    this.router.navigate([
      '/operaciones/pedidos/recepcion-producto',
      recepcionMercaderia.id
    ]);
  }

  onBack() {
    this._location.back();
  }

  handlePagination(e) {
    this.pageIndex = e - 1;
    this.onSearchRecepcionMercaderia();
  }
}
