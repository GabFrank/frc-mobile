import { Location } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { UntypedFormControl, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Sector } from 'src/app/domains/sector/sector.model';
import { SectorService } from 'src/app/domains/sector/sector.service';
import { Zona } from 'src/app/domains/zona/zona.model';
import { ZonaService } from 'src/app/domains/zona/zona.service';
import { NotificacionService } from 'src/app/services/notificacion.service';

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-adicionar-zona',
  templateUrl: './adicionar-zona.component.html',
  styleUrls: ['./adicionar-zona.component.scss']
})
export class AdicionarZonaComponent implements OnInit {
  selectedSector: Sector;
  selectedZona: Zona;
  descripcionControl = new UntypedFormControl(null, [Validators.required]);
  activoControl = new UntypedFormControl(true);

  constructor(
    private _location: Location,
    private route: ActivatedRoute,
    private zonaService: ZonaService,
    private sectorService: SectorService,
    private notificacionService: NotificacionService
  ) {}

  ngOnInit() {
    this.descripcionControl.markAsTouched();
    this.route.paramMap.pipe(untilDestroyed(this)).subscribe(async (res) => {
      let zonaId = +res.get('zonaId');
      let sectorId = +res.get('sectorId');
      console.log(sectorId);

      if (zonaId != null && zonaId != undefined && zonaId != 0) {
        (await this.zonaService.onGetZona(zonaId)).subscribe((zonaRes) => {
          if (zonaRes != null) {
            this.selectedZona = new Zona();
            Object.assign(this.selectedZona, zonaRes);
            this.descripcionControl.setValue(this.selectedZona.descripcion);
            this.activoControl.setValue(this.selectedZona.activo);
          } else {
            this.notificacionService.openItemNoEncontrado();
            this.onBack();
          }
        });
      }
      (await this.sectorService.onGetSector(sectorId)).subscribe(
        (sectorRes) => {
          if (sectorRes != null) {
            this.selectedSector = sectorRes;
            console.log(this.selectedSector);
          } else {
            this.notificacionService.openItemNoEncontrado();
            this.onBack();
          }
        }
      );
    });
  }

  onCancelar() {
    if (this.selectedZona?.id != null) {
      this.descripcionControl.setValue(this.selectedZona.descripcion);
      this.activoControl.setValue(this.selectedZona.activo);
    } else {
      this.descripcionControl.setValue('');
      this.activoControl.setValue(true);
    }
  }
  async onGuardar() {
    console.log(this.descripcionControl.valid, this.selectedSector != null);

    if (this.descripcionControl.valid && this.selectedSector != null) {
      if (this.selectedZona?.id == null) {
        this.selectedZona = new Zona();
        this.selectedZona.sector = this.selectedSector;
      }
      this.selectedZona.descripcion =
        this.descripcionControl.value?.toUpperCase();
      this.selectedZona.activo = this.activoControl.value;
      (
        await this.zonaService.onSaveZona(this.selectedZona.toInput())
      ).subscribe((saveRes) => {
        if (saveRes != null) {
          this.selectedZona = saveRes;
        }
      });
    }
  }

  async onEliminar() {
    if (this.selectedZona?.id != null) {
      (
        await this.zonaService.onDeleteZona(this.selectedZona)
      ).subscribe((res) => {
        if (res) {
          this.onBack();
        }
      });
    }
  }

  onBack() {
    this._location.back();
  }
}
