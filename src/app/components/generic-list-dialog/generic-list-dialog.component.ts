import { Location } from '@angular/common';
import { Component, Input, OnInit, Query } from '@angular/core';
import { UntypedFormControl, Validators } from '@angular/forms';
import { GenericCrudService } from 'src/app/generic/generic-crud.service';
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
  query?: Query;
  paginator?: boolean
}

@Component({
  selector: 'app-generic-list-dialog',
  templateUrl: './generic-list-dialog.component.html',
  styleUrls: ['./generic-list-dialog.component.scss'],
})
export class GenericListDialogComponent implements OnInit {

  @Input()
  data: GenericListDialogData;

  buscarControl = new UntypedFormControl(null, [Validators.required, Validators.minLength(1)])
  itemList = [];
  isQuerySearch = false;
  queryData: {texto, page?, size?};
  pageIndex = 0;
  pageSize = 10;

  constructor(
    private modalService: ModalService,
    private genericCrudService: GenericCrudService
  ) { }

  ngOnInit() {
    if (this.data?.inicialData != null) {
      this.itemList = this.data?.inicialData;
    }

    if(this.data?.query != null){
      this.isQuerySearch = true;
    }
  }

  onSearch() {
    // let text = this.buscarControl.value;
    // if (text != null) text = text.toUpperCase()
    // if( this.query!=null && text != null){
    //   this.queryData.texto = text;
    // } else {
    //   this.queryData = {texto: text}
    // }
    // if(this.data?.paginator == true){
    //   this.queryData.page = this.pageIndex;
    //   this.queryData.size = this.pageSize;
    // }
    // this.genericCrudService
    //   .onCustomQuery(this.data.query, this.queryData).pipe(untilDestroyed(this))
    //   .subscribe((res) => {
    //     if (res != null) {
    //       if(this.data?.paginator == true){
    //         this.selectedPageInfo = res;
    //         this.dataSource.data = this.selectedPageInfo?.getContent;
    //       } else {
    //         this.dataSource.data = res;
    //       }
    //     }
    //   });
  }

  onItemClick(item: any) {
    this.modalService.closeModal(item)
  }

  onBack() {
    this.modalService.closeModal(null)
  }

}
