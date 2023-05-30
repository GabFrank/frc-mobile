import { Zona } from 'src/app/domains/zona/zona.model';
import { DialogoService } from 'src/app/services/dialogo.service';
import { ModalService } from './../../../services/modal.service';
import { UntilDestroy } from '@ngneat/until-destroy';
import { untilDestroyed } from '@ngneat/until-destroy';
import { UntypedFormControl } from '@angular/forms';
import { Sector } from './../../../domains/sector/sector.model';
import { Component, Input, OnInit } from '@angular/core';
import { comparatorLike } from './../../../generic/utils/string-utils'
import { Location } from '@angular/common';

@UntilDestroy()
@Component({
  selector: 'app-select-zona-dialog',
  templateUrl: './select-zona-dialog.component.html',
  styleUrls: ['./select-zona-dialog.component.scss'],
})
export class SelectZonaDialogComponent implements OnInit {

  @Input()
  data;

  buscarControl = new UntypedFormControl('')
  sectorList: Sector[] = []

  constructor(
    private _location: Location,
    private modalService: ModalService,
    private dialogService: DialogoService
  ) { }

  ngOnInit() {
    this.sectorList = this.data;
    this.buscarControl.valueChanges.pipe(untilDestroyed(this)).subscribe(res => {
      if(res=='' || res==null){
        console.log('null')
        this.sectorList = this.data;
      } else {
        this.sectorList.forEach(e => {
          e.zonaList = e.zonaList.filter(z => comparatorLike(z.descripcion, res))
        })
      }
    })
  }

  onZonaClick(zona: Zona){
    // this.dialogService.open('Atención!', `Estas iniciando el inventario en la zona ${zona.descripcion}. Solo una persona puede inventariar una zona. Desea continuar?`).then(res => {
    //   if(res.role=='aceptar'){
    //   }
    // })
    this.modalService.closeModal(zona)
  }

  onBack() {
    this.modalService.closeModal(null)
  }

}
