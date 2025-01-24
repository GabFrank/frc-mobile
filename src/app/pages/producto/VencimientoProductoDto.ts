import { Presentacion } from "src/app/domains/productos/presentacion.model"
import { Transferencia, TransferenciaItem } from "../transferencias/transferencia.model"
import { Producto } from "src/app/domains/productos/producto.model"
import { InventarioProductoItem } from "../inventario/inventario.model"
import { Sucursal } from "src/app/domains/empresarial/sucursal/sucursal.model"

export class VencimientoProductoDto {
    transferencia: Transferencia
    presentacion: Presentacion
    producto: Producto
    sucursal: Sucursal
    transferenciaItem: TransferenciaItem
}