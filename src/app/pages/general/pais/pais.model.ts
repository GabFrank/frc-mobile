import { Usuario } from "src/app/domains/personas/usuario.model";

export class Pais {
  id: number;
  descripcion: string;
  creadoEn: Date;
  usuario: Usuario;
}
