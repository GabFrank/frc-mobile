import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges
} from '@angular/core';
import { PageInfo } from 'src/app/app.component';
import { PaginationStateService } from 'src/app/services/pagination-state.service';

@Component({
  selector: 'app-paginacion',
  templateUrl: './paginacion.component.html',
  styleUrls: ['./paginacion.component.scss']
})
export class PaginacionComponent implements OnInit, OnChanges, OnDestroy {
  @Input() pageData: PageInfo<any>;
  @Input() pageIndex: number;
  @Output() pageChange = new EventEmitter<number>();
  @Output() currentPageEmitter = new EventEmitter<number>();

  pageList: number[];

  constructor(private paginationStateService: PaginationStateService) {}

  ngOnInit(): void {
    this.generatePageList();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['pageData'] || changes['pageIndex']) {
      this.generatePageList();
    }
  }

  ngOnDestroy(): void {
    this.paginationStateService.setPaginationVisible(false);
  }

  private generatePageList(): void {
    if (this.pageData && this.pageData.getTotalPages > 1) {
      this.pageList = Array.from(
        { length: this.pageData.getTotalPages },
        (_, i) => i + 1
      );
      this.paginationStateService.setPaginationVisible(true);
    } else {
      this.pageList = [];
      this.paginationStateService.setPaginationVisible(false);
    }
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.pageData?.getTotalPages) {
      this.pageChange.emit(page);
      this.currentPageEmitter.emit(page);
    }
  }

  previousPage() {
    if (this.pageData?.hasPrevious) {
      this.pageChange.emit(this.pageIndex);
      this.currentPageEmitter.emit(this.pageIndex);
    }
  }

  nextPage() {
    if (this.pageData?.hasNext) {
      this.pageChange.emit(this.pageIndex + 2);
      this.currentPageEmitter.emit(this.pageIndex + 2);
    }
  }
}
