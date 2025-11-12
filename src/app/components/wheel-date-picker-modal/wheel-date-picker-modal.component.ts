import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { PopoverController } from '@ionic/angular';

@Component({
  selector: 'app-wheel-date-picker-modal',
  templateUrl: './wheel-date-picker-modal.component.html',
  styleUrls: ['./wheel-date-picker-modal.component.scss']
})
export class WheelDatePickerModalComponent implements OnInit {

  @Input() selectedDate: Date | null = null;
  @Input() showMonthAsNumber: boolean = false;
  @Input() enableFutureDates: boolean = true;
  @Input() minYear: number = new Date().getFullYear();
  @Input() maxYear: number = new Date().getFullYear() + 10;
  @Output() dateSelected = new EventEmitter<Date>();

  // Propiedades computadas para las fechas mínima y máxima
  minDate: string;
  maxDate: string;

  constructor(private popoverCtrl: PopoverController) {}

  ngOnInit() {
    console.log('WheelDatePickerModalComponent ngOnInit:', {
      selectedDate: this.selectedDate,
      showMonthAsNumber: this.showMonthAsNumber,
      enableFutureDates: this.enableFutureDates,
      minYear: this.minYear,
      maxYear: this.maxYear
    });
    
    this.initializeDateConstraints();
  }

  private initializeDateConstraints() {
    // Fecha mínima: 5 años atrás, mes 1, día 1
    this.minDate = `${this.minYear}-01-01`;
    
    // Fecha máxima: 20 años adelante, mes 12, día 31
    this.maxDate = `${this.maxYear}-12-31`;
    
    console.log('Fechas configuradas:', {
      minDate: this.minDate,
      maxDate: this.maxDate,
      minYear: this.minYear,
      maxYear: this.maxYear
    });
  }

  onDateChange(event: any) {
    if (event.detail.value) {
      const selectedDate = new Date(event.detail.value);
      this.selectedDate = selectedDate;
      console.log('Fecha seleccionada:', selectedDate);
    }
  }

  confirmDate() {
    if (this.selectedDate) {
      console.log('Confirmando fecha:', this.selectedDate);
      this.popoverCtrl.dismiss(this.selectedDate);
    } else {
      console.warn('No hay fecha seleccionada');
    }
  }

  dismiss() {
    this.popoverCtrl.dismiss();
  }
}
