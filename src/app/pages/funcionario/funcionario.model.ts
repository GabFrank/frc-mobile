import { Sucursal } from "src/app/domains/empresarial/sucursal/sucursal.model";
import { Ciudad } from "src/app/domains/general/ciudad.model";

export class PreRegistroFuncionario {
  id:number;
  nombreCompleto: string
  apodo: string
  documento: string
  telefonoPersonal: string
  telefonoEmergencia: string
  nombreContactoEmergencia: string
  email: string
  ciudad: Ciudad
  direccion: string
  sucursal: Sucursal
  fechaNacimiento: Date
  fechaIngreso: Date
  habilidades: string
  registroConducir : Boolean
  nivelEducacion: string
  observacion: string
  creadoEn: Date

  toInput(): PreRegistroFuncionarioInput {
    let input = new PreRegistroFuncionarioInput()
    input.id = this.id
    input.nombreCompleto = this.nombreCompleto
    input.apodo = this.apodo
    input.documento = this.documento
    input.telefonoPersonal = this.telefonoPersonal
    input.telefonoEmergencia = this.telefonoEmergencia
    input.nombreContactoEmergencia = this.nombreContactoEmergencia
    input.email = this.email
    input.ciudadId = this.ciudad?.id
    input.direccion = this.direccion
    input.sucursalId = this.sucursal?.id
    input.fechaNacimiento = this.fechaNacimiento
    input.fechaIngreso = this.fechaIngreso
    input.habilidades = this.habilidades
    input.registroConducir = this.registroConducir
    input.nivelEducacion = this.nivelEducacion
    input.observacion = this.observacion
    return input;
  }
}

export class PreRegistroFuncionarioInput{
  id:number;
  nombreCompleto: string
  apodo: string
  documento: string
  telefonoPersonal: string
  telefonoEmergencia: string
  nombreContactoEmergencia: string
  email: string
  ciudadId: number
  direccion: string
  sucursalId: number
  fechaNacimiento: Date
  fechaIngreso: Date
  habilidades: string
  registroConducir : Boolean
  nivelEducacion: string
  observacion: string
}
