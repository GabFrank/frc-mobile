import { TipoCliente } from "src/app/domains/cliente/cliente.model"
import { Persona } from "src/app/domains/personas/persona.model"

export class NotificacionPush {
    id: number
    persona: Persona
    // role: Role
    // cargo: Cargo
    tipoCliente: TipoCliente
    titulo: string
    mensaje: string
    token: string
    data: string
    creadoEn: Date
}

export class NotificacionPushInput {
  id: number
  personaId: number
  // role: Role
  // cargo: Cargo
  tipoClienteId: number
  titulo: string
  mensaje: string
  token: string
  data: string
  creadoEn: Date
}
