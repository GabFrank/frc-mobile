import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { PaginatedResponse } from '../../services/items-paginacion.service';

@Component({
  selector: 'app-paginacion',
  templateUrl: './paginacion.component.html',
  styleUrls: ['./paginacion.component.scss']
})
export class PaginacionComponent implements OnInit {

  @Input() paginatedResponse: PaginatedResponse<any> | null = null;
  @Input() showPageSizeSelector = true;
  @Input() pageSizeOptions = [10, 20, 50, 100];
  @Input() currentPageSize = 20;
  
  @Output() pageChange = new EventEmitter<number>();
  @Output() pageSizeChange = new EventEmitter<number>();

  constructor() {}

  ngOnInit() {}

  onPageChange(page: number) {
    if (page >= 0 && page < (this.paginatedResponse?.totalPages || 0)) {
      this.pageChange.emit(page);
    }
  }

  onPageSizeChange(event: any) {
    const newSize = parseInt(event.detail.value);
    this.currentPageSize = newSize;
    this.pageSizeChange.emit(newSize);
  }

  get totalPages(): number {
    return this.paginatedResponse?.totalPages || 0;
  }

  get currentPage(): number {
    return this.paginatedResponse?.number || 0;
  }

  get totalElements(): number {
    return this.paginatedResponse?.totalElements || 0;
  }

  get startElement(): number {
    return (this.currentPage * this.currentPageSize) + 1;
  }

  get endElement(): number {
    const end = this.startElement + (this.paginatedResponse?.numberOfElements || 0) - 1;
    return Math.min(end, this.totalElements);
  }

  get hasPrevious(): boolean {
    return this.paginatedResponse?.first === false;
  }

  get hasNext(): boolean {
    return this.paginatedResponse?.last === false;
  }

  get pageNumbers(): number[] {
    const pages: number[] = [];
    const totalPages = this.totalPages;
    const current = this.currentPage;
    
    // Mostrar máximo 5 páginas alrededor de la actual
    const start = Math.max(0, current - 2);
    const end = Math.min(totalPages - 1, current + 2);
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    return pages;
  }
} 