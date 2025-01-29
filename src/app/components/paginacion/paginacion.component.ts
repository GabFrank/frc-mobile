import {
  AfterViewInit,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output
} from '@angular/core';
import { PageInfo } from 'src/app/app.component';

@Component({
  selector: 'app-paginacion',
  templateUrl: './paginacion.component.html',
  styleUrls: ['./paginacion.component.scss']
})
export class PaginacionComponent implements AfterViewInit {
  @Input() pageData: PageInfo<any>; // The entire Page object
  @Input() pageIndex: number; // The entire Page object
  @Output() pageChange = new EventEmitter<number>();

  pageList: number[];

  ngOnInit(): void {
    console.log(this.pageData, this.pageIndex);
  }

  ngAfterViewInit(): void {
    if (this.pageData && this.pageData?.getTotalPages > 1) {
      this.pageList = Array.from(
        { length: this.pageData.getTotalPages },
        (_, i) => i + 1
      );
    }
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.pageData?.getTotalPages) {
      this.pageChange.emit(page);
    }
  }

  previousPage() {
    if (this.pageData?.hasPrevious) {
      this.pageChange.emit(this.pageIndex); // Page object uses 0-based index
    }
  }

  nextPage() {
    if (this.pageData?.hasNext) {
      this.pageChange.emit(this.pageIndex + 2); // Adjusting for 1-based UI
    }
  }
}
