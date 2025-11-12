import { Ciudad } from "../../general/ciudad.model";
import { Usuario } from "../../personas/usuario.model";

export class Sucursal {
  id: number;
  nombre: string;
  localizacion: string;
  ciudad: Ciudad;
  deposito: boolean;
  depositoPredeterminado: Boolean;
  activo: boolean;
  creadoEn: Date;
  usuario: Usuario;

  constructor(id){
    this.id = id;
  }
}
