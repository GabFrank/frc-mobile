import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  private modeSource = new BehaviorSubject<string>('lector');
  currentMode = this.modeSource.asObservable();

  setMode(mode: string){
    this.modeSource.next(mode);
  }
  constructor() { }
}
