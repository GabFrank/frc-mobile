import { Component, OnInit } from '@angular/core';
import { NotaRecepcionAgrupada } from '../nota-recepcion-agrupada/nota-recepcion-agrupada.model';
import { MainService } from 'src/app/services/main.service';
import { NotaRecepcionAgrupadaService } from '../nota-recepcion-agrupada/nota-recepcion-agrupada.service';
import { PageInfo } from 'src/app/app.component';
import { Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-historico-nota-recepcion',
  templateUrl: './historico-nota-recepcion.component.html',
  styleUrls: ['./historico-nota-recepcion.component.scss']
})
export class HistoricoNotaRecepcionComponent implements OnInit {
  notaRecepcionAgrupadaList: NotaRecepcionAgrupada[];
  pageIndex = 0;
  pageSize = 5;
  selectedPageInfo: PageInfo<NotaRecepcionAgrupada>;
  constructor(
    private mainService: MainService,
    private notaRecepcionAgrupadaService: NotaRecepcionAgrupadaService,
    private _location: Location,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    setTimeout(() => {
      this.onSearchNotaRecepcionAgrupada();
    }, 500);
  }

  async onSearchNotaRecepcionAgrupada() {
    (
      await this.notaRecepcionAgrupadaService.onGetNotaRecepcionAgrupadaListPorUsuarioId(
        this.mainService.usuarioActual.id,
        this.pageIndex,
        this.pageSize
      )
    ).subscribe((res) => {
      console.log(res);

      this.selectedPageInfo = res;
      this.notaRecepcionAgrupadaList = res.getContent;
    });
  }

  onItemClick(notaRecepcionAgrupada: NotaRecepcionAgrupada) {
    this.router.navigate([
      '/operaciones/pedidos/recepcion-producto',
      notaRecepcionAgrupada.id
    ]);
  }

  onBack() {
    this._location.back();
  }

  handlePagination(e) {
    this.pageIndex = e - 1;
    this.onSearchNotaRecepcionAgrupada();
  }
}
