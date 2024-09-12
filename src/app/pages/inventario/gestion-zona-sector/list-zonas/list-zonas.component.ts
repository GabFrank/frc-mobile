import { Location } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Sector } from 'src/app/domains/sector/sector.model';
import { SectorService } from 'src/app/domains/sector/sector.service';
import { Zona } from 'src/app/domains/zona/zona.model';
import { ZonaService } from 'src/app/domains/zona/zona.service';
import { NotificacionService } from 'src/app/services/notificacion.service';
import { InventarioService } from '../../inventario.service';
import { FormControl, Validators } from '@angular/forms';
import { Sucursal } from 'src/app/domains/empresarial/sucursal/sucursal.model';
import { SucursalService } from 'src/app/domains/empresarial/sucursal/sucursal.service';
import { DialogoService } from 'src/app/services/dialogo.service';

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-list-zonas',
  templateUrl: './list-zonas.component.html',
  styleUrls: ['./list-zonas.component.scss']
})
export class ListZonasComponent implements OnInit {
  selectedSector: Sector;
  selectedSucursal: Sucursal;
  zonaList: Zona[];
  descripcionControl = new FormControl(null, [Validators.required]);
  activoControl = new FormControl(true);
  inventarioId: number;
  sectorId: number;
  sucursalId:number;

  constructor(
    private _location: Location,
    private route: ActivatedRoute,
    private inventarioService: InventarioService,
    private zonaService: ZonaService,
    private sectorService: SectorService,
    private notificacionService: NotificacionService,
    private router: Router,
    private sucursalService: SucursalService,
    private dialogService: DialogoService
  ) {}

  ngOnInit() {
    this.descripcionControl.markAsTouched();
    this.route.paramMap.pipe(untilDestroyed(this)).subscribe(async (res) => {
      this.sectorId = +res.get('sectorId');
      this.sucursalId = +res.get('sucursalId');
      this.inventarioId = +res.get('id');
      if (this.sectorId != null && this.sectorId != 0) {
        (await this.sectorService.onGetSector(this.sectorId)).subscribe(
          (sectorRes) => {
            if (sectorRes != null) {
              this.selectedSector = new Sector();
              Object.assign(this.selectedSector, sectorRes);
              this.descripcionControl.setValue(this.selectedSector.descripcion);
              this.activoControl.setValue(this.selectedSector.activo);
              this.zonaList = this.selectedSector.zonaList;
            } else {
              this.notificacionService.openItemNoEncontrado();
              this.onBack();
            }
          }
        );
      }

      (await this.sucursalService.onGetSucursal(this.sucursalId)).subscribe(
        (sucursalRes) => {
          if (sucursalRes != null) {
            this.selectedSucursal = sucursalRes;
          } else {
            this.notificacionService.openItemNoEncontrado();
            this.onBack();
          }
        }
      );
    });
  }

  onClickZona(zona: Zona) {
    this.router.navigate(['adicionar-zona', zona?.id], {
      relativeTo: this.route
    });
  }

  onNuevaZona() {
    this.router.navigate(['inventario/list/info', this.inventarioId, 'gestion-zona-sector', this.sucursalId, 'list-zonas', this.sectorId, 'adicionar-zona']);
  }

  onCancelar() {}
  async onGuardar() {
    if (this.descripcionControl.valid && this.selectedSucursal != null) {
      if (this.selectedSector?.id == null) {
        this.selectedSector = new Sector();
        this.selectedSector.sucursal = this.selectedSucursal;
      }
      this.selectedSector.descripcion =
        this.descripcionControl.value?.toUpperCase();
      this.selectedSector.activo = this.activoControl.value;
      (
        await this.sectorService.onSaveSector(this.selectedSector.toInput())
      ).subscribe((saveRes) => {
        if (saveRes != null) {
          this.selectedSector = saveRes;
          this.sectorId = this.selectedSector.id;
        }
      });
    }
  }

  async onEliminar() {
    if (this.selectedSector?.id != null) {
      (
        await this.sectorService.onDeleteSector(this.selectedSector)
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
