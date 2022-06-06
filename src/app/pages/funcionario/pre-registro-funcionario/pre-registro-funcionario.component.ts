import { CargandoService } from './../../../services/cargando.service';
import { untilDestroyed, UntilDestroy } from '@ngneat/until-destroy';
import { FuncionarioService } from './../funcionario.service';
import { PreRegistroFuncionario } from './../funcionario.model';
import { LoginComponent } from './../../../dialog/login/login.component';
import { ModalService } from './../../../services/modal.service';
import { FormControl, Validators, FormGroup } from '@angular/forms';
import { Component, OnInit } from '@angular/core';

@UntilDestroy()
@Component({
  selector: 'app-pre-registro-funcionario',
  templateUrl: './pre-registro-funcionario.component.html',
  styleUrls: ['./pre-registro-funcionario.component.scss'],
})
export class PreRegistroFuncionarioComponent implements OnInit {

  formGroup: FormGroup;

  nombreCompleto = new FormControl(null, Validators.required)
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

  habilidadesInformaticas = new FormControl([])
  habilidadesGenerales = new FormControl([])

  constructor(
    private modalService: ModalService,
    private funcionarioService: FuncionarioService,
    private cargandoService: CargandoService
  ) {

  }

  ngOnInit() {
    this.formGroup = new FormGroup({
      'nombreControl': this.nombreCompleto,
      'apodo': this.apodo,
      'documento': this.documento,
      'telefonoPersonal': this.telefonoPersonal,
      'telefonoEmergencia': this.telefonoEmergencia,
      'nombreContactoEmergencia': this.nombreContactoEmergencia,
      'email': this.email,
      'ciudad': this.ciudad,
      'direccion': this.direccion,
      'sucursal': this.sucursal,
      'fechaNacimiento': this.fechaNacimiento,
      'fechaIngreso': this.fechaIngreso,
      'habilidades': this.habilidades,
      'registroConducir': this.registroConducir,
      'nivelEducacion': this.nivelEducacion,
      'observacion': this.observacion,
      'generoControl': this.generoControl
    })
  }

  onCancel() {
    this.modalService.closeModal(null)
    this.modalService.openModal(LoginComponent)
  }

  onAceptar() {
    if (this.habilidadesInformaticas.value != null) {
      this.habilidades.setValue([...this.habilidadesInformaticas.value])
    }
    if (this.habilidadesGenerales.value != null) {
      this.habilidades.setValue([...this.habilidadesGenerales.value])
    }
    let entity = new PreRegistroFuncionario;
    entity.apodo = this.apodo.value;
    entity.ciudad = this.ciudad.value;
    entity.direccion = this.direccion.value;
    entity.documento = this.documento.value;
    entity.email = this.email.value;
    entity.fechaIngreso = new Date(this.fechaIngreso.value);
    entity.fechaNacimiento = new Date(this.fechaNacimiento.value);
    entity.habilidades = (this.habilidades.value as string[]).toString();
    entity.nivelEducacion = this.nivelEducacion.value;
    entity.nombreCompleto = this.nombreCompleto.value;
    entity.nombreContactoEmergencia = this.nombreContactoEmergencia.value;
    entity.observacion = this.observacion.value;
    entity.registroConducir = this.registroConducir.value;
    entity.sucursal = this.ciudad.value;
    entity.telefonoEmergencia = this.telefonoEmergencia.value;
    entity.telefonoPersonal = this.telefonoPersonal.value;
    this.funcionarioService.onSavePreRegistroFuncionario(entity)
      .pipe(untilDestroyed(this))
      .subscribe(res => {
        if (res != null) {
          this.modalService.closeModal(null)
          this.cargandoService.open()
          setTimeout(() => {
            this.cargandoService.close()
            this.modalService.openModal(LoginComponent)
          }, 1000);
        }
      })
  }

}

