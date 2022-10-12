import { Component, Input, OnInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { PopOverService } from 'src/app/services/pop-over.service';

export class BuscarMaletinData {

}

@Component({
  selector: 'app-buscar-maletin-dialog',
  templateUrl: './buscar-maletin-dialog.component.html',
  styleUrls: ['./buscar-maletin-dialog.component.scss'],
})
export class BuscarMaletinDialogComponent implements OnInit {

  codigoControl = new FormControl(null, [Validators.required, Validators.minLength(1)])

  @Input() data: BuscarMaletinData;

  constructor(private popoverService: PopOverService){

  }

  ngOnInit() { }

  onBuscarClick() {
    this.popoverService.close(this.codigoControl.value)
  }
  onCameraClick() {

  }

  onCancel(){
    this.popoverService.close(null)
  }

}
