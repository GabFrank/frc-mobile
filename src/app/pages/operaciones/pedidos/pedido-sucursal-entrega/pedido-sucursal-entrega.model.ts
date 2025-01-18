import { Sucursal } from "src/app/domains/empresarial/sucursal/sucursal.model";
import { Usuario } from "src/app/domains/personas/usuario.model";
import { Pedido } from "../pedido.model";

export class PedidoSucursalEntrega {
    id: number;
    pedido: Pedido;
    sucursal: Sucursal;
    creadoEn?: Date;
    usuario?: Usuario;

    constructor(id: number, pedido: Pedido, sucursal: Sucursal, creadoEn: Date, usuario: Usuario) {
        this.id = id;
        this.pedido = pedido;
        this.sucursal = sucursal;
        this.creadoEn = creadoEn;
        this.usuario = usuario;
    }
}

export class PedidoSucursalEntregaInput {
    id: number;
    pedidoId: number;
    sucursalId: number;
    creadoEn?: Date;
    usuarioId?: number;

    constructor(id: number, pedidoId: number, sucursalId: number, creadoEn: Date, usuarioId: number) {
        this.id = id;
        this.pedidoId = pedidoId;
        this.sucursalId = sucursalId;
        this.creadoEn = creadoEn;
        this.usuarioId = usuarioId;
    }
}
