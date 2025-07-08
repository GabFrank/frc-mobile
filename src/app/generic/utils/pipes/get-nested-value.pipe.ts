import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'getNestedValue'
})
export class GetNestedValuePipe implements PipeTransform {
  transform(obj: any, path: string): any {
    if (!path || !obj) {
      return null;
    }
    return path.split('.').reduce((p, c) => (p && p[c]) || null, obj);
  }
} 