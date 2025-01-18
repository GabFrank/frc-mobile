import { Persona } from "src/app/domains/personas/persona.model";
import { Usuario } from "src/app/domains/personas/usuario.model";
import { Producto } from "src/app/domains/productos/producto.model";
import { Vendedor } from "../vendedor/vendedor.model";

export class Proveedor {
  id: number;
  persona: Persona;
  credito: boolean;
  tipoCredito: boolean;
  chequeDias: number;
  datosBancarios: number;
  creadoEn: Date;
  usuario: Usuario;
  vendedores: Vendedor[];
  productos: Producto[];

  toInput(): ProveedorInput {
    let input = new ProveedorInput;
    input.id = this.id
    input.personaId = this.persona?.id
    input.credito = this.credito
    input.tipoCredito = this.tipoCredito
    input.chequeDias = this.chequeDias
    input.datosBancarios = this.datosBancarios
    input.creadoEn = this.creadoEn
    input.usuarioId = this.usuario?.id
    return input;
  }
}

export class ProveedorInput {
  id: number;
  personaId: number;
  credito: boolean;
  tipoCredito: boolean;
  chequeDias: number;
  datosBancarios: number;
  creadoEn: Date;
  usuarioId: number;
}
