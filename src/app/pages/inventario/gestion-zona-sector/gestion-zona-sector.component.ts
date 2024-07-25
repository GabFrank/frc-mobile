import { Location } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { InventarioService } from '../inventario.service';
import { Zona } from 'src/app/domains/zona/zona.model';
import { ZonaService } from 'src/app/domains/zona/zona.service';
import { SectorService } from 'src/app/domains/sector/sector.service';
import { Sector } from 'src/app/domains/sector/sector.model';

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-gestion-zona-sector',
  templateUrl: './gestion-zona-sector.component.html',
  styleUrls: ['./gestion-zona-sector.component.scss']
})
export class GestionZonaSectorComponent implements OnInit {
  sectorList: Sector[];

  constructor(
    private _location: Location,
    private route: ActivatedRoute,
    private inventarioService: InventarioService,
    private zonaService: ZonaService,
    private sectorService: SectorService,
    private router: Router
  ) {}

  ngOnInit() {
    this.route.paramMap.pipe(untilDestroyed(this)).subscribe(async (res) => {
      let sucId = +res.get('sucursalId');
      (await this.sectorService.onGetSectores(sucId)).subscribe((sectorRes) => {
        console.log(sectorRes);

        this.sectorList = sectorRes?.length > 0 ? sectorRes: null;
      });
    });
  }

  onClickSector(sector: Sector) {
    this.router.navigate(['list-zonas', sector.id], { relativeTo: this.route });
  }

  onNuevoSector() {
    this.router.navigate(['list-zonas'], { relativeTo: this.route });
  }

  onBack() {
    this._location.back();
  }
}
