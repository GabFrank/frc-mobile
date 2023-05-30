import { PopOverService } from './../../../services/pop-over.service';
import { Component, OnInit } from '@angular/core';
import { UntypedFormControl, Validators, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-ingresar-codigo-pop',
  templateUrl: './ingresar-codigo-pop.component.html',
  styleUrls: ['./ingresar-codigo-pop.component.scss'],
})
export class IngresarCodigoPopComponent implements OnInit {

  codigoControl = new UntypedFormControl(null, [Validators.required, Validators.minLength(6)])

  constructor(private popoverService: PopOverService) { }

  ngOnInit() {

  }

  onCancel(){
    this.popoverService.close(null)
  }

  onAceptar(){
    let value: string = this.codigoControl.value;
    this.popoverService.close(value.toUpperCase())
  }

}
