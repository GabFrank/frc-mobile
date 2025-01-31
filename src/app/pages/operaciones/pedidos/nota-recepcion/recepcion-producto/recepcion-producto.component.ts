import { Location } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { NotaRecepcionAgrupada } from '../nota-recepcion-agrupada/nota-recepcion-agrupada.model';
import { ActivatedRoute, Router, Routes } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { NotaRecepcionAgrupadaService } from '../nota-recepcion-agrupada/nota-recepcion-agrupada.service';

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-recepcion-producto',
  templateUrl: './recepcion-producto.component.html',
  styleUrls: ['./recepcion-producto.component.scss']
})
export class RecepcionProductoComponent implements OnInit {
  selectedNotaRecepcionAgrupada: NotaRecepcionAgrupada;

  constructor(
    private _location: Location,
    private route: ActivatedRoute,
    private notaRecepcionAgrupadaService: NotaRecepcionAgrupadaService,
    private router: Router
  ) {}

  ngOnInit() {
    this.route.paramMap.pipe(untilDestroyed(this)).subscribe((res) => {
      let notaRecepcionAgrupadaId = res.get('id');
      if (notaRecepcionAgrupadaId != null) {
        this.onBuscarNotaRecepcionAgrupada(notaRecepcionAgrupadaId);
      }
    });
  }

  async onBuscarNotaRecepcionAgrupada(id) {
    (
      await this.notaRecepcionAgrupadaService.onGetNotaRecepcionAgrupadaPorId(
        id
      )
    ).subscribe((res) => {
      if (res != null) {
        this.selectedNotaRecepcionAgrupada = res;
      }
    });
  }

  onModificarNotas() {}

  onBack() {
    this._location.back();
  }
}
