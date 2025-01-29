import { Location } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { UntypedFormControl, Validators } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Query } from 'apollo-angular';
import { PageInfo } from 'src/app/app.component';
import { GenericCrudService } from 'src/app/generic/generic-crud.service';
import { PdvCaja } from 'src/app/pages/operaciones/caja/caja.model';
import { CajaService } from 'src/app/pages/operaciones/caja/caja.service';
import { ModalService } from 'src/app/services/modal.service';

export interface TableData {
  id: string;
  nombre: string;
  width?: number;
  nested?: boolean;
  nestedId?: string;
}

export interface GenericListDialogData {
  titulo: string;
  tableData: TableData[];
  search?: boolean;
  inicialSearch?: boolean;
  inicialData?: any;
  texto?: string;
  query?: Query;
  paginator?: boolean;
}

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-generic-list-dialog',
  templateUrl: './generic-list-dialog.component.html',
  styleUrls: ['./generic-list-dialog.component.scss']
})
export class GenericListDialogComponent implements OnInit {
  @Input()
  data: GenericListDialogData;

  buscarControl = new UntypedFormControl(null, [
    Validators.required,
    Validators.minLength(1)
  ]);
  itemList = [];
  isQuerySearch = false;
  queryData: { texto; page?; size? };
  pageIndex = 0;
  pageSize = 10;
  selectedPageInfo: PageInfo<any>;

  constructor(
    private modalService: ModalService,
    private genericCrudService: GenericCrudService
  ) {}

  ngOnInit() {
    if (this.data?.inicialData != null) {
      this.itemList = this.data?.inicialData;
    }
    if (this.data?.query != null) {
      this.isQuerySearch = true;
    }
    if (this.data?.texto != null) {
      this.buscarControl.setValue(this.data?.texto);
      this.onSearch();
    }
  }

  onBuscarClick() {
    if (this.isQuerySearch) {
      this.onSearch();
    }
  }

  async onSearch() {
    let text = this.buscarControl.value;
    if (text != null) text = text.toUpperCase();
    if (this.queryData != null && text != null) {
      this.queryData.texto = text;
    } else {
      this.queryData = { texto: text };
    }
    if (this.data?.paginator == true) {
      this.queryData.page = this.pageIndex;
      this.queryData.size = this.pageSize;
    }
    (await this.genericCrudService.onCustomGet(this.data.query, this.queryData))
      .pipe(untilDestroyed(this))
      .subscribe((res) => {
        if (res != null) {
          if (this.data?.paginator == true) {
            this.selectedPageInfo = res;
            this.itemList = this.selectedPageInfo?.getContent;
          } else {
            this.itemList = res;
          }
        }
      });
  }

  onPageChange(page: number) {
    this.pageIndex = page;
    this.onSearch();
  }

  onItemClick(item: any) {
    this.modalService.closeModal(item);
  }

  onBack() {
    this.modalService.closeModal(null);
  }
}
