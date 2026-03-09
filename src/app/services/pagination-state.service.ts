import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PaginationStateService {
  private _hasPagination = new BehaviorSubject<boolean>(false);
  hasPagination$ = this._hasPagination.asObservable();

  setPaginationVisible(visible: boolean): void {
    this._hasPagination.next(visible);
  }
}
