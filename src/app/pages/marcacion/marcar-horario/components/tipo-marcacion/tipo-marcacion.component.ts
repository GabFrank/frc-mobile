import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TipoMarcacion } from '../../models/marcacion.model';

@Component({
  selector: 'app-tipo-marcacion',
  templateUrl: './tipo-marcacion.component.html',
  styleUrls: ['./tipo-marcacion.component.scss']
})
export class TipoMarcacionComponent implements OnInit {
  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit() { }

  onLocalizacion(tipo: string, esSalidaAlmuerzo: boolean = false) {
    this.router.navigate(['localizacion/true'], {
      relativeTo: this.route,
      queryParams: { tipo, esSalidaAlmuerzo }
    });
  }
}
