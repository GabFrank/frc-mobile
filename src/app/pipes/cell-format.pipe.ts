import { Pipe, PipeTransform, Inject, LOCALE_ID } from '@angular/core';
import { DatePipe, DecimalPipe, CurrencyPipe } from '@angular/common';
import { TableData } from '../components/generic-list-dialog/generic-list-dialog.component';
import { EnumToStringPipe } from '../generic/utils/pipes/enum-to-string';

@Pipe({
  name: 'cellFormat'
})
export class CellFormatPipe implements PipeTransform {
  private datePipe: DatePipe;
  private decimalPipe: DecimalPipe;
  private currencyPipe: CurrencyPipe;
  private enumToStringPipe: EnumToStringPipe;

  constructor(@Inject(LOCALE_ID) private locale: string) {
    this.datePipe = new DatePipe(this.locale);
    this.decimalPipe = new DecimalPipe(this.locale);
    this.currencyPipe = new CurrencyPipe(this.locale);
    this.enumToStringPipe = new EnumToStringPipe();
  }

  transform(item: any, info: TableData): any {
    // 1. Get the value
    let value: any;
    if (info.nestedId) {
      // Legacy support: id is the first level, nestedId is the rest
      value = this.getNestedValue(item[info.id], info.nestedId);
    } else if (info.id.includes('.')) {
      // New, cleaner way: id contains the full path with dot notation
      value = this.getNestedValue(item, info.id);
    } else {
      // Direct property access
      value = item[info.id];
    }

    if (value == null) return '';

    // 2. Format the value
    if (!info.pipe) {
      return value;
    }

    switch (info.pipe) {
      case 'date':
        return this.datePipe.transform(value, info.pipeArgs);
      case 'number':
        return this.decimalPipe.transform(value, info.pipeArgs);
      case 'currency':
        return this.currencyPipe.transform(value, info.pipeArgs);
      case 'enumToString':
        return this.enumToStringPipe.transform(value);
      default:
        return value;
    }
  }

  private getNestedValue(obj: any, path: string): any {
    if (!path || !obj) {
      return null;
    }
    return path.split('.').reduce((p, c) => (p && p[c]) || null, obj);
  }
} 