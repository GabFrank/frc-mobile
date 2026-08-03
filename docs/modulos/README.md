# Módulos funcionales

Un documento por módulo. Cada uno cubre: propósito y reglas de negocio, rutas, páginas y componentes, servicios con su API pública, operaciones GraphQL contra el backend, modelos propios y gotchas.

## Estado de la documentación

| Módulo | Ubicación | LOC aprox. | Doc |
|---|---|---|---|
| **operaciones** | `pages/operaciones/` | 17.663 | ⏳ Ola 2 |
| ├ pedidos (Recepción de Mercaderías) | `operaciones/pedidos/` | 5.025 | ⏳ |
| ├ solicitud-gastos | `operaciones/solicitud-gastos/` | 3.515 | ⏳ |
| ├ devolucion | `operaciones/devolucion/` | 2.667 | ⏳ |
| ├ caja | `operaciones/caja/` | 1.483 | ⏳ |
| ├ venta-tarjeta | `operaciones/venta-tarjeta/` | 1.265 | ⏳ |
| ├ conteo | `operaciones/conteo/` | 1.018 | ⏳ |
| ├ solicitud-pago | `operaciones/solicitud-pago/` | 934 | ⏳ |
| ├ moneda | `operaciones/moneda/` | 481 | ⏳ |
| ├ pago | `operaciones/pago/` | 330 | ⏳ |
| ├ maletin | `operaciones/maletin/` | 325 | ⏳ |
| ├ movimiento-stock | `operaciones/movimiento-stock/` | 250 | ⏳ |
| └ caja-info | `operaciones/caja-info/` | 221 | ⏳ |
| **inventario** | `pages/inventario/` | 4.229 | ⏳ Ola 3 |
| **transferencias** | `pages/transferencias/` | 4.166 | ⏳ Ola 3 |
| **producto** | `pages/producto/` | 3.233 | ⏳ Ola 3 |
| **notificaciones** | `pages/notificaciones/` | 1.792 | ⏳ Ola 3 |
| **marcacion** | `pages/marcacion/` | 1.763 | ⏳ Ola 3 |
| **funcionario** | `pages/funcionario/` | 550 | ⏳ Ola 3 |
| **informaciones-personales** | `pages/informaciones-personales/` | 477 | ⏳ Ola 3 |
| **personas** | `pages/personas/` | 403 | ⏳ Ola 3 |
| **mis-finanzas** | `pages/mis-finanzas/` | 310 | ⏳ Ola 3 |
| **home** | `pages/home/` | 251 | ⏳ Ola 3 |
| **mis-rrhh** | `pages/mis-rrhh/` | 236 | ⏳ Ola 3 |
| **codigo** | `pages/codigo/` | 204 | ⏳ Ola 3 |
| **configuracion** | `pages/configuracion/` | 68 | ⏳ Ola 3 |
| **financiero** | `pages/financiero/` | 27 | ⏳ Ola 3 |
| **salir** | `pages/salir/` | 38 | ⏳ Ola 3 |
| **general** | `pages/general/` | 8 | ⏳ Ola 3 |
| **venta** | `pages/venta/` | 0 | carpeta vacía |

## Antes de leer un módulo

Estos tres documentos aplican a **todos** los módulos y no se repiten en cada uno:

1. [`../arquitectura/apollo-graphql.md`](../arquitectura/apollo-graphql.md) — el alias `data:` y `GenericCrudService`
2. [`../infraestructura/services.md`](../infraestructura/services.md) — servicios transversales
3. [`../infraestructura/domains-modelos.md`](../infraestructura/domains-modelos.md) — patrón modelo/input/`toInput()`
