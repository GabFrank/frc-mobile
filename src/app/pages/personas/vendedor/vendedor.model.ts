import { Persona } from "src/app/domains/personas/persona.model";
import { Usuario } from "src/app/domains/personas/usuario.model";
import { Proveedor } from "../proveedor/proveedor.model";

export interface Vendedor {
    id: number;
    proveedores: Proveedor[];
    persona: Persona;
    observacion: string;
    usuario: Usuario;
    activo: boolean;
    nombrePersona: string;
  }
