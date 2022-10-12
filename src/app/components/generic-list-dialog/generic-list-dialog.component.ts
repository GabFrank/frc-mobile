import { Component, Input, OnInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { PdvCaja } from 'src/app/pages/operaciones/caja/caja.model';
import { CajaService } from 'src/app/pages/operaciones/caja/caja.service';
import { ModalService } from 'src/app/services/modal.service';

export interface TableData {
  id: string
  nombre: string
  width?: number
  nested?: boolean
  nestedId?: string
}

export interface GenericListDialogData {
  titulo: string;
  tableData: TableData[];
  search?: boolean;
  inicialSearch?: boolean;
  inicialData?: any;
  texto?: string;
}

@Component({
  selector: 'app-generic-list-dialog',
  templateUrl: './generic-list-dialog.component.html',
  styleUrls: ['./generic-list-dialog.component.scss'],
})
export class GenericListDialogComponent implements OnInit {

  @Input()
  data: GenericListDialogData;

  buscarControl = new FormControl(null, [Validators.required, Validators.minLength(1)])
  itemList = [];

  constructor(
    private modalService: ModalService
  ) { }

  ngOnInit() {
    if (this.data?.inicialData != null) {
      this.itemList = this.data?.inicialData;
    }
  }

  onItemClick(item: any){
    this.modalService.closeModal(item)
  }

}
