import { FormControl, Validators, FormGroup } from '@angular/forms';
import { Component, OnInit } from '@angular/core';



@Component({
  selector: 'app-pre-registro-funcionario',
  templateUrl: './pre-registro-funcionario.component.html',
  styleUrls: ['./pre-registro-funcionario.component.scss'],
})
export class PreRegistroFuncionarioComponent implements OnInit {

  formGroup: FormGroup;

  nombreControl = new FormControl(null, Validators.required)
  apodo = new FormControl()
  documento = new FormControl(null, Validators.required)
  telefonoPersonal = new FormControl(null, Validators.required)
  telefonoEmergencia = new FormControl(null, Validators.required)
  nombreContactoEmergencia = new FormControl(null, Validators.required)
  email = new FormControl()
  ciudad = new FormControl(null, Validators.required)
  direccion = new FormControl(null, Validators.required)
  sucursal = new FormControl(null, Validators.required)
  fechaNacimiento = new FormControl(null, Validators.required)
  fechaIngreso = new FormControl()
  habilidades = new FormControl(null, Validators.required)
  registroConducir = new FormControl(false)
  nivelEducacion = new FormControl()
  observacion = new FormControl()
  generoControl = new FormControl()

  constructor() { }

  ngOnInit() {
    this.formGroup = new FormGroup({
      'nombreControl' : this.nombreControl,
      'apodo' : this.apodo,
      'documento' : this.documento,
      'telefonoPersonal' : this.telefonoPersonal,
      'telefonoEmergencia' : this.telefonoEmergencia,
      'nombreContactoEmergencia' : this.nombreContactoEmergencia,
      'email' : this.email,
      'ciudad' : this.ciudad,
      'direccion' : this.direccion,
      'sucursal' : this.sucursal,
      'fechaNacimiento' : this.fechaNacimiento,
      'fechaIngreso' : this.fechaIngreso,
      'habilidades' : this.habilidades,
      'registroConducir' : this.registroConducir,
      'nivelEducacion' : this.nivelEducacion,
      'observacion' : this.observacion,
      'generoControl' : this.generoControl
    })
  }



  onCancel(){}
  onAceptar(){}

}

