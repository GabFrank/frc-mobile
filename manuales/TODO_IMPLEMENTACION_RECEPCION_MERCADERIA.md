# TODO: Implementación del Módulo de Recepción de Mercadería

Este documento detalla las tareas necesarias para implementar el flujo de recepción de mercadería en la aplicación móvil, según el `MANUAL_IMPLEMENTACION_RECEPCION_MERCADERIA_MOBILE.md`.

**Progreso:** Cada tarea completada debe marcarse con `[x]`.

---

## 📊 **ESTADO GENERAL DEL PROYECTO**

- **✅ Fase 1 (Backend)**: 100% COMPLETADA
- **✅ Fase 2 (Frontend - Lógica y Servicios)**: 100% COMPLETADA  
- **✅ Fase 3.1-3.4 (Frontend - UI Básica)**: 100% COMPLETADA
- **✅ Fase 3.5 (Paginación)**: 100% COMPLETADA
- **✅ Fase 3.6 (Queries Paginadas)**: 100% COMPLETADA
- **✅ Fase 3.7 (Finalización)**: 100% COMPLETADA
- **✅ Fase 4 (Arquitectura de Estado Persistido)**: 100% COMPLETADA
- **✅ Fase 5 (Refactor de Verificación Detallada con Variaciones)**: 100% COMPLETADA
- **✅ Fase 6 (Mejoras de UX y Validaciones)**: 100% COMPLETADA

## 🎉 **¡PROYECTO COMPLETADO AL 100%!**

**El módulo de Recepción de Mercadería ha sido implementado completamente** con todas las funcionalidades requeridas según el manual de implementación, incluyendo la **Fase 6** que implementa la estrategia de "recepción a ciegas" y validaciones robustas.

---

## Fase 1: Backend (Verificación y Desarrollo) ✅ COMPLETADA

Antes de comenzar con el frontend, debemos asegurar que el backend (`frc-central-server`) cumpla con todos los requerimientos.

### 1.1. Modificaciones a Entidades Existentes ✅
- [x] **Entidad `RecepcionMercaderiaItem`**: Verificar o agregar los siguientes campos, según la sección `2.1.1` del manual.
  - [x] `metodoVerificacion`: `Enum` (`ESCANER`, `MANUAL`).
  - [x] `motivoVerificacionManual`: `Enum` (`CODIGO_ILEGIBLE`, `PRODUCTO_SIN_CODIGO`) (nullable).

### 1.2. Creación de Nuevas Entidades ✅
- [x] **Entidad `ProductoVencimiento`**: Crear la entidad, repositorio y servicio. (Sección `2.2.1`).
- [x] **Entidad `ConstanciaDeRecepcion`**: Crear la entidad, repositorio y servicio. (Sección `2.2.2`).
- [x] **Entidad `ConstanciaDeRecepcionItem`**: Crear la entidad, repositorio y servicio. (Sección `2.2.3`).

### 1.3. Implementación de API GraphQL ✅
- [x] **Verificar Mutaciones/Queries existentes**: Revisar que las mutaciones a reutilizar (`saveRecepcionMercaderiaItem`, `cancelarVerificacion`, `cancelarRechazo`) estén disponibles y funcionales.
- [x] **Query `notasPendientes`**: Implementar la query según la sección `4.1` del manual.
- [x] **Query `productosAgrupadosPorNotas`**: Implementar la query y el `ProductoAgrupadoDTO` según la sección `4.1`.
- [x] **Mutation `iniciarRecepcion`**: Implementar la mutación según la sección `4.2`.
- [x] **Mutation `finalizarRecepcion`**: Implementar la mutación, orquestando todos los procesos de backend (Sección `3.5.1` y `4.4`).

**✅ RESULTADO: El backend ya tiene implementado TODO lo necesario para la Fase 1.**

---

## Fase 2: Frontend - Lógica y Servicios ✅ COMPLETADA

Esta fase se enfoca en establecer la comunicación con el backend y la lógica de negocio en la aplicación Angular (`frc-app`).

### 2.1. Estructura de Módulos y Archivos Base ✅
- [x] **Verificar si existe `src/app/pages/operaciones/pedidos/`**: Si no, crearlo.
- [x] **Crear `pedidos.module.ts`**: En `src/app/pages/operaciones/pedidos/`.
- [x] **Crear `pedidos-routing.module.ts`**: En `src/app/pages/operaciones/pedidos/`.
- [x] **Crear directorio `recepcion-mercaderia`**: Dentro de `src/app/pages/operaciones/pedidos/`.
- [x] **Crear `graphql` y `services` subdirectorios**: Dentro de `src/app/pages/operaciones/pedidos/`.

### 2.2. Modelos TypeScript (`.model.ts`) ✅
- [x] **Verificar si existen los modelos**: Antes de crear, revisar si existen modelos para `RecepcionMercaderia`, `NotaRecepcion`, `Producto`, etc.
- [x] **Crear `recepcion-mercaderia.model.ts`**: Basado en `RecepcionMercaderia.java` y `recepcion-mercaderia.graphqls`.
- [x] **Crear `nota-recepcion.model.ts`**: Modelo para NotaRecepcion con todos los campos necesarios.
- [x] **Crear `pedido.model.ts` y `compra.model.ts`**: Modelos básicos para las relaciones.
- [x] **Crear `constancia-de-recepcion.model.ts`**: Basado en la entidad `ConstanciaDeRecepcion`.
- [x] **Crear `producto-agrupado-dto.model.ts`**: Basado en el `ProductoAgrupadoDTO` del manual.
- [x] **Crear otros modelos necesarios**: `ProductoVencimiento`, `ConstanciaDeRecepcionItem`, `RecepcionMercaderiaItem`, `RecepcionCostoAdicional`, `NotaRecepcionItemDistribucion`.
- [x] **Crear `nota-recepcion-item.model.ts`**: Basado en `nota-recepcion-item.graphqls` con todos los campos y enums.
- [x] **Crear `pedido-item.model.ts`**: Basado en la entidad `PedidoItem.java` del backend.

### 2.3. Lógica GraphQL (Apollo) ✅
- [x] **Crear `pedidos-queries.graphql.ts`**:
  - [x] Query `notasPendientes`.
  - [x] Query `productosAgrupadosPorNotas`.
- [x] **Crear `pedidos-mutations.graphql.ts`**:
  - [x] Mutation `iniciarRecepcion`.
  - [x] Mutation `finalizarRecepcion`.
  - [x] Mutation `saveRecepcionMercaderiaItem`.
  - [x] Mutations `cancelarVerificacion` y `cancelarRechazo`.
- [x] **Crear clases Apollo individuales**:
  - [x] `notasPendientes.ts` (extiende Query)
  - [x] `productosAgrupadosPorNotas.ts` (extiende Query)
  - [x] `iniciarRecepcion.ts` (extiende Mutation)
  - [x] `finalizarRecepcion.ts` (extiende Mutation)
  - [x] `saveRecepcionMercaderiaItem.ts` (extiende Mutation)
  - [x] `cancelarVerificacion.ts` (extiende Mutation)
  - [x] `cancelarRechazo.ts` (extiende Mutation)

### 2.4. Servicio Principal ✅
- [x] **Crear `pedido.service.ts`**: Este servicio centraliza la lógica, usa `GenericCrudService` y es consumido por los componentes. Implementados todos los métodos necesarios para el flujo.

---

## Fase 3: Frontend - Interfaz de Usuario (UI) 🔄 EN PROGRESO

Implementación de los componentes visuales en `src/app/pages/operaciones/pedidos/recepcion-mercaderia/`.

### 3.1. Página de Inicio y Selección de Notas ✅ COMPLETADA
- [x] **Implementar validación de ubicación (RF-01)**: Crear componente `ValidacionUbicacionComponent` que use GPS y Google Maps para validar que el usuario esté en la sucursal correcta.
- [x] **Implementar diálogo de confirmación de nota (RF-04)**: Crear componente `ConfirmacionNotaComponent` para mostrar detalles de la nota y confirmar antes de proceder.
- [x] **Llamar a la mutación `iniciarRecepcion` y navegar a la siguiente pantalla (RF-07)**: Implementado con validaciones y navegación a `RecepcionAgrupadaPage`.
- [x] **Diseñar UI para selección de proveedor y búsqueda de notas** (RF-02, RF-03).
- [x] **Implementar modal de búsqueda asistida de notas** (RF-03).
- [x] **Mostrar lista de notas a recepcionar** (RF-05).
- [x] **Implementar botón "Iniciar Recepción"** con la lógica de habilitación (RF-06) y validación de proveedor (R-01).

### 3.2. Página de Recepción Agrupada por Producto ✅ COMPLETADA
- [x] **Crear `RecepcionAgrupadaPage` component**: `src/app/pages/operaciones/pedidos/recepcion-mercaderia/recepcion-agrupada/`.
- [x] **Implementar la query `productosAgrupadosPorNotas`** para obtener los datos.
- [x] **Diseñar UI con búsqueda proactiva y lista de productos pendientes** (RF-09, RF-10, RF-11).
- [x] **Integrar lector de código de barras** usando `QrScannerComponent` con funcionalidad de búsqueda por código.
- [x] **Implementar lógica de "Verificación Manual"** con diálogo de advertencia y selección de motivo (R-03).

### 3.3. Diálogo de Verificación Detallada ✅ COMPLETADA
- [x] **Crear `VerificacionDetalleComponent` (modal/dialog)**.
- [x] **Mostrar información del producto y cantidad esperada** (RF-14).
- [x] **Implementar campos para cantidad, presentaciones y vencimientos** (RF-15, RF-16, RF-17).
- [x] **Implementar lógica para múltiples vencimientos** (RF-18) y su validación (R-04).
- [x] **Implementar funcionalidad de rechazo** (RF-19).
- [x] **Al guardar, llamar a `saveRecepcionMercaderiaItem`** con todos los datos requeridos (RF-20).

### 3.4. Finalización y Visualización de Constancia ✅ COMPLETADA
- [x] **Implementar botón "Finalizar Recepción"** en `RecepcionAgrupadaPage` (RF-22).
- [x] **Llamar a la mutación `finalizarRecepcion`**.
- [x] **Crear `ConstanciaRecepcionPage` component**: para mostrar la constancia generada (RF-25).
- [x] **Implementar previsualización, impresión y/o compartición del PDF de la constancia** (RF-25).

---

## 🔄 **PRÓXIMOS PASOS PARA COMPLETAR EL MÓDULO**

### **Fase 3.5: Implementación de Paginación para Grandes Volúmenes de Items ✅ COMPLETADA**

#### **3.5.1. Servicio de Paginación**
- [x] **Crear `ItemsPaginacionService`**: Servicio para manejar carga paginada de items
- [x] **Implementar métodos de paginación**: `cargarItemsNota()`, `obtenerTotalItems()`, `obtenerResumenItems()`
- [x] **Usar observables reactivos**: Para estado de items, totales y loading

#### **3.5.2. Componente de Paginación Reutilizable**
- [x] **Crear `PaginacionComponent`**: Componente reutilizable para paginación
- [x] **Implementar controles de navegación**: Primera, anterior, números de página, siguiente, última
- [x] **Agregar selector de tamaño de página**: Opciones 10, 20, 50, 100 elementos
- [x] **Diseñar UI responsive**: Funciona en móviles y desktop

#### **3.5.3. Integración en Componentes Existentes**
- [x] **Actualizar `ConstanciaRecepcionPage`**: Usar servicio de paginación en lugar de `nota.items`
- [x] **Reemplazar cálculos directos**: Total de productos y cantidades desde resúmenes
- [x] **Integrar en `pedidos.module.ts`**: Declarar `PaginacionComponent`

### **Fase 3.6: Optimización de Queries GraphQL para Paginación ✅ COMPLETADA**

#### **3.6.1. Queries Paginadas para Items**
- [x] **Crear query `itemsNotaPaginados`**: Query GraphQL que retorne items paginados
- [x] **Implementar query `resumenItemsNota`**: Query que retorne solo totales y resúmenes
- [x] **Agregar a `pedidos-queries.graphql.ts`**: Definiciones GQL para paginación
- [x] **Implementar en backend**: Repositorio, servicio y GraphQL resolver

#### **3.6.2. Servicios Apollo para Paginación**
- [x] **Crear `ItemsNotaPaginadosQuery`**: Clase Apollo que extienda Query
- [x] **Crear `ResumenItemsNotaQuery`**: Clase Apollo para resúmenes
- [x] **Integrar en `PedidoService`**: Métodos que usen `GenericCrudService`

#### **3.6.3. Integración en Componentes de Lista**
- [x] **Actualizar `RecepcionAgrupadaPage`**: Implementar paginación en lista de productos
- [x] **Agregar `PaginacionComponent`**: En la parte inferior de la lista
- [x] **Manejar cambios de página**: Recargar datos cuando cambie página o tamaño

#### **3.6.4. Implementación Backend Completa**
- [x] **Agregar métodos al repositorio**: `findItemsByNotaIdPaginados`, `countItemsByNotaId`, etc.
- [x] **Crear DTO de resumen**: `ResumenItemsNotaDTO` para datos optimizados
- [x] **Implementar en servicio**: Métodos de paginación en `NotaRecepcionItemService`
- [x] **Agregar al GraphQL resolver**: Queries `itemsNotaPaginados` y `resumenItemsNota`
- [x] **Actualizar esquema GraphQL**: Tipos `ResumenItemsNota`, `ItemPorEstado`, `ResumenPorNota`

### **Fase 3.7: Finalización y Visualización de Constancia ✅ COMPLETADA**

#### **3.7.1. Implementar Finalización de Recepción**
- [x] **Conectar botón "Finalizar Recepción"** en `RecepcionAgrupadaPage` con la mutación `finalizarRecepcion`
- [x] **Validar que todos los productos estén verificados** antes de permitir finalización
- [x] **Mostrar confirmación** antes de finalizar la recepción
- [x] **Manejar respuesta** de la mutación y mostrar mensaje de éxito/error

#### **3.7.2. Crear Pantalla de Constancia**
- [x] **Crear `ConstanciaRecepcionPage` component** en `src/app/pages/operaciones/pedidos/recepcion-mercaderia/constancia-recepcion/`
- [x] **Implementar routing** para la nueva página
- [x] **Diseñar UI** para mostrar detalles de la constancia generada
- [x] **Mostrar información** de la recepción, productos, cantidades y totales

#### **3.7.3. Funcionalidades de Constancia**
- [x] **Previsualización** de la constancia en formato legible
- [x] **Generación de PDF** usando Jasper Reports en el backend
- [x] **Compartir/Enviar** constancia usando Web Share API o fallback
- [x] **Impresión** de constancia con preview en nueva ventana

#### **3.7.4. Implementación Backend Completa**
- [x] **Servicio de impresión**: `ConstanciaRecepcionPrintService` con Jasper Reports
- [x] **GraphQL Query**: `generarConstanciaRecepcionPDF` para obtener PDF como base64
- [x] **Generación de PDF**: Template Jasper con datos de recepción
- [x] **DTO de respuesta**: `ConstanciaRecepcionPDFDTO` con metadatos del PDF

---

## 📋 **COMPONENTES Y FUNCIONALIDADES IMPLEMENTADAS**

### ✅ **Componentes Completados:**
- `RecepcionMercaderiaPage` - Página principal de inicio
- `NotaRecepcionSearchComponent` - Búsqueda de notas
- `ValidacionUbicacionComponent` - Validación GPS/Manual
- `ConfirmacionNotaComponent` - Confirmación de notas
- `QrScannerComponent` - Escáner QR/Código manual
- `RecepcionAgrupadaPage` - Lista de productos agrupados
- `VerificacionDetalleComponent` - Verificación detallada de productos

### ✅ **Funcionalidades Implementadas:**
- Validación de ubicación (GPS + Manual)
- Búsqueda y selección de notas de recepción
- Inicio de recepción con validaciones
- Lista de productos agrupados por notas
- Búsqueda proactiva de productos
- Escaneo de códigos QR/Búsqueda manual
- Verificación detallada con formulario completo
- Guardado de verificaciones en backend
- Navegación entre pantallas

### 🔄 **Funcionalidades Pendientes:**
- Finalización de recepción
- Generación de constancia
- Visualización de constancia
- Funcionalidades de PDF/Impresión

---

## Fase 4: Refactor a Modelo de "Estado Persistido" ✅ COMPLETADA EN BACKEND - 🔄 PENDIENTE EN FRONTEND

Se implementó un cambio arquitectónico fundamental basado en la pre-creación de ítems de recepción para simplificar la lógica de estado y resolver nativamente el flujo de "continuar recepción". El estado de la verificación pasó de ser calculado en el frontend a estar persistido en la base de datos.

### 4.1. Cambios en el Backend (`frc-central-server`) ✅ COMPLETADOS

#### 4.1.1. Modificación de la Entidad y Base de Datos ✅
- [x] **Crear Enum `EstadoVerificacion`**: En el dominio, crear el enum `EstadoVerificacion` con los valores: `PENDIENTE`, `VERIFICADO`, `VERIFICADO_CON_DIFERENCIA`, `RECHAZADO`.
- [x] **Actualizar Entidad `RecepcionMercaderiaItem`**:
  - [x] Añadir el campo `private EstadoVerificacion estadoVerificacion;`.
  - [x] Anotarlo con `@Enumerated(EnumType.STRING)` y `@Column(name = "estado_verificacion")`.
- [x] **Crear Migración Flyway**: Añadir un nuevo script de migración para agregar la columna `estado_verificacion VARCHAR(255)` a la tabla `operaciones.recepcion_mercaderia_item`.
  - [x] Establecer un valor por defecto de `'PENDIENTE'` para la nueva columna y marcarla como `NOT NULL`.

#### 4.1.2. Actualización del Esquema GraphQL ✅
- [x] **Definir Enum en GraphQL**: En `recepcion-mercaderia-item.graphqls`, añadir la definición del `enum EstadoVerificacion`.
- [x] **Actualizar Tipos GraphQL**:
  - [x] Añadir `estadoVerificacion: EstadoVerificacion` al tipo `RecepcionMercaderiaItem`.
  - [x] Añadir `estadoVerificacion: EstadoVerificacion` (opcional) al input `RecepcionMercaderiaItemInput`.

#### 4.1.3. Refactor de la Lógica de Negocio (Mutations) ✅
- [x] **Refactorizar `iniciarRecepcion`**: Esta mutación ahora tiene una lógica extendida.
  - [x] Tras crear la `RecepcionMercaderia`, itera sobre todas las `NotaRecepcionItemDistribucion` de las notas asociadas.
  - [x] Para cada distribución, **crea y persiste** una nueva instancia de `RecepcionMercaderiaItem`.
  - [x] El `estadoVerificacion` de estos nuevos ítems se establece en `PENDIENTE`.
  - [x] La `cantidadRecibida` se inicializa en `0`.
- [x] **Refactorizar `saveRecepcionMercaderiaItem`**: Esta mutación cambió su propósito de "crear" a "actualizar".
  - [x] El `input` ahora requiere el `id` del `RecepcionMercaderiaItem` pre-creado.
  - [x] La lógica busca el ítem por su ID y actualiza sus campos (`cantidadRecibida`, `metodoVerificacion`, etc.).
  - [x] Se calcula y actualiza el `estadoVerificacion` a `VERIFICADO` o `VERIFICADO_CON_DIFERENCIA` según la lógica de negocio.

#### 4.1.4. Nuevas Queries para Items de Recepción ✅
- [x] **Query `recepcionMercaderiaItemsPorRecepcion(recepcionId: ID!): [RecepcionMercaderiaItem]`**: Implementada para obtener todos los items de una recepción.
- [x] **Query `recepcionMercaderiaItemsPorRecepcionPaginados(recepcionId: ID!, page: Int!, size: Int!, filtroTexto: String, estado: EstadoVerificacion): Page<RecepcionMercaderiaItem>`**: Implementada con paginación y filtros.

---

## 🚨 **FASE CRÍTICA: REFACTOR DEL FRONTEND A NUEVA ARQUITECTURA**

**ESTADO**: El backend ya tiene implementada la **Fase 4** completamente, pero el frontend sigue usando la arquitectura anterior. **ES URGENTE** refactorizar el frontend para usar la nueva arquitectura.

### **4.2. Cambios en el Frontend (`frc-app`) ✅ COMPLETADOS**

#### **4.2.1. Actualización de Modelos y GraphQL ✅ COMPLETADA**
- [x] **Actualizar `recepcion-mercaderia-item.model.ts`**: Añadir el campo `estadoVerificacion` al modelo.
- [x] **Actualizar `saveRecepcionMercaderiaItem.ts`**: Añadir `id` como campo requerido en el `RecepcionMercaderiaItemInput` para las actualizaciones.
- [x] **Actualizar Queries GraphQL**: Asegurarse de que todas las consultas que obtienen `RecepcionMercaderiaItem` incluyan el nuevo campo `estadoVerificacion`.
- [x] **Crear nueva Query `recepcionMercaderiaItemsPorRecepcion`**: En `pedidos-queries.graphql.ts` y su correspondiente clase Apollo para obtener todos los ítems de una recepción.
- [x] **Eliminar uso de `productosAgrupadosPorNotas`**: Esta query está **DEPRECADA** y no se debe usar.

#### **4.2.2. Refactor del Servicio `pedido.service.ts` ✅ COMPLETADO**
- [x] **Crear `getRecepcionItems(recepcionId)`**: Nuevo método que utiliza la query `recepcionMercaderiaItemsPorRecepcion`.
- [x] **Actualizar `saveRecepcionMercaderiaItem`**: Asegurarse de que el `input` enviado a la mutación ahora incluya el `id` del ítem que se está actualizando.
- [x] **Eliminar métodos obsoletos**: Remover métodos que usen `productosAgrupadosPorNotas`.

#### **4.2.3. Simplificación del Componente `recepcion-agrupada.page.ts` ✅ COMPLETADO**
- [x] **Eliminar Lógica de Carga de Notas**: Remover por completo el método `cargarNotasRecepcion` y la lógica condicional en `ngOnInit`. El concepto de "continuar" desaparece.
- [x] **Unificar Flujo de Carga**: `ngOnInit` ahora solo debe hacer una cosa: si hay un `recepcionId`, llamar a `pedidoService.getRecepcionItems(recepcionId)`.
- [x] **Adaptar Agrupación de Productos**:
    - [x] La fuente de datos ya no será `ProductoAgrupadoDTO`, sino la lista de `RecepcionMercaderiaItem[]` obtenida del servicio.
    - [x] Se deberá implementar una lógica local (ej. en un `getter` o `BehaviorSubject`) que agrupe estos ítems por producto para renderizar la UI como se espera.
- [x] **Filtrar ítems pendientes**: La lista visible para el usuario deberá mostrar solo los productos cuyo `estadoVerificacion` sea `PENDIENTE`.
- [x] **Actualizar Flujo de Verificación**:
  - [x] El diálogo de `VerificacionDetalleComponent` ahora recibirá el `id` del `RecepcionMercaderiaItem` pre-creado.
  - [x] `procesarVerificacionDetallada` ya no eliminará un ítem de una lista, sino que llamará a `saveRecepcionMercaderiaItem` para **actualizarlo**.
  - [x] Tras una actualización exitosa, se refrescará la lista local de ítems para que el producto verificado desaparezca de la lista de pendientes.

#### **4.2.4. Refactor del Componente `VerificacionDetalleComponent` ✅ COMPLETADO**
- [x] **Cambiar Input**: En lugar de recibir `ProductoAgrupadoDTO`, debe recibir `RecepcionMercaderiaItem`.
- [x] **Actualizar Lógica**: Usar el `id` del item para la actualización en lugar de crear uno nuevo.
- [x] **Manejar Estado**: Mostrar el estado actual del item y permitir su actualización.

#### **4.2.5. Actualización de Búsqueda y Filtros ✅ COMPLETADA**
- [x] **Búsqueda Proactiva**: Actualizar para buscar en `RecepcionMercaderiaItem[]` en lugar de `ProductoAgrupadoDTO[]`.
- [x] **Filtros**: Implementar filtros por estado de verificación usando la nueva query paginada.
- [x] **Paginación**: Usar la nueva query paginada para mejor performance.

---

## 🎯 **PLAN DE ACCIÓN INMEDIATO**

### **PRIORIDAD 1: Refactor Crítico (Esta Semana)**
1. **Actualizar modelos** para incluir `estadoVerificacion`
2. **Crear nueva query** `recepcionMercaderiaItemsPorRecepcion`
3. **Refactorizar `RecepcionAgrupadaPage`** para usar nueva arquitectura
4. **Eliminar dependencia** de `ProductoAgrupadoDTO`

### **PRIORIDAD 2: Componentes de Verificación (Siguiente Semana)**
1. **Refactorizar `VerificacionDetalleComponent`**
2. **Actualizar flujo de verificación**
3. **Implementar manejo de estado**

### **PRIORIDAD 3: Optimización y Testing (Tercera Semana)**
1. **Implementar paginación** con nueva query
2. **Optimizar búsquedas y filtros**
3. **Testing completo** del nuevo flujo

---

## ⚠️ **ADVERTENCIAS CRÍTICAS**

1. **NO USAR `productosAgrupadosPorNotas`**: Esta query está deprecada y puede causar inconsistencias.
2. **NO CREAR NUEVOS ITEMS**: Todos los items ya están pre-creados, solo actualizar.
3. **MANEJAR ESTADO CORRECTAMENTE**: El estado se calcula automáticamente en el backend.
4. **TESTING EXHAUSTIVO**: El refactor es crítico y debe probarse completamente.

---

## 📊 **ESTADO ACTUAL DEL PROYECTO**

- **✅ Backend (Fase 4)**: 100% COMPLETADO
- **❌ Frontend (Fase 4)**: 0% COMPLETADO - **CRÍTICO**
- **✅ Funcionalidades Básicas**: 100% COMPLETADAS
- **✅ UI/UX**: 100% COMPLETADA
- **❌ Nueva Arquitectura**: 0% COMPLETADA - **URGENTE**

**NEXT STEP**: Comenzar inmediatamente el refactor del frontend a la nueva arquitectura.

---

## Fase 5: Refactor de Verificación Detallada con Variaciones ✅ COMPLETADA

Esta fase implementa la capacidad de registrar múltiples variaciones (diferentes presentaciones, vencimientos, lotes) para un único producto, mejorando drásticamente la flexibilidad del proceso de verificación.

### 5.1. Cambios en Backend (`frc-central-server`) ✅ COMPLETADOS
- [x] **Crear Entidad `RecepcionMercaderiaItemVariacion`**:
  - [x] Crear la clase `RecepcionMercaderiaItemVariacion.java` en el dominio.
  - [x] Campos: `recepcionMercaderiaItem` (ManyToOne), `presentacion` (ManyToOne), `cantidad`, `vencimiento`, `rechazado` (boolean), `motivoRechazo` (Enum).
  - [x] Crear su correspondiente `Repository` y `Service`.
- [x] **Crear Migración Flyway**: Añadir un script para crear la tabla `operaciones.recepcion_mercaderia_item_variacion` con sus columnas y llaves foráneas.
- [x] **Actualizar Esquema GraphQL**:
  - [x] Definir el tipo `RecepcionMercaderiaItemVariacion` y el input `RecepcionMercaderiaItemVariacionInput`.
  - [x] Modificar el input de la mutación `saveRecepcionMercaderiaItem` para que acepte `variaciones: [RecepcionMercaderiaItemVariacionInput!]!` en lugar de los campos de cantidad individuales.
- [x] **Refactorizar `saveRecepcionMercaderiaItem` Mutation**:
  - [x] La lógica ahora debe eliminar todas las variaciones existentes para el `recepcionMercaderiaItemId` dado.
  - [x] Luego, debe iterar sobre la lista de `variaciones` del input y crear los nuevos registros `RecepcionMercaderiaItemVariacion`.
  - [x] Finalmente, debe sumarizar las cantidades de las nuevas variaciones para actualizar `cantidadRecibida` y `cantidadRechazada` en la entidad `RecepcionMercaderiaItem` padre.

### 5.2. Cambios en Frontend (`frc-app`) ✅ COMPLETADOS
- [x] **Actualizar Modelos y GraphQL**:
  - [x] Crear el modelo `recepcion-mercaderia-item-variacion.model.ts`.
  - [x] Actualizar `recepcion-mercaderia-item.model.ts` para incluir `variaciones: RecepcionMercaderiaItemVariacion[]`.
  - [x] Actualizar el input `RecepcionMercaderiaItemInput` en `saveRecepcionMercaderiaItem.ts` para que coincida con el nuevo esquema del backend.
- [x] **Refactor Crítico de `VerificacionDetalleComponent`**:
  - [x] La base del formulario pasará a ser un `FormArray` llamado `variaciones`.
  - [x] Implementar la UI de "tarjetas" dinámicas. Cada tarjeta será un `FormGroup` dentro del `FormArray`.
  - [x] Crear método `addVariacion()` para agregar una nueva tarjeta/`FormGroup` al `FormArray`.
  - [x] Crear método `removeVariacion(index)` para eliminar una tarjeta.
  - [x] En `ngOnInit`, inicializar el `FormArray` con al menos una variación, usando los datos del `@Input() item`.
  - [x] Usar `valueChanges` en el `FormArray` para recalcular los totales y la diferencia en tiempo real.
  - [x] El método `onVerificar` deberá construir la lista de `variaciones` a partir del valor del `FormArray` y enviarla a la mutación.
- [x] **Refactor de UI en `VerificacionDetalleComponent`**:
  - [x] Mover el resumen de cantidades (Esperada, Recibida, Rechazada, Diferencia) a un header fijo dentro del componente.
  - [x] Implementar un botón de "volver" en el header.
  - [x] Asegurar que el botón "Verificar" principal esté en un footer fijo.
  - [x] Añadir un icono o botón para mostrar un campo de `observaciones` opcional para el ítem general.

---

## Fase 6: Mejoras de UX y Validaciones en Verificación Detallada ✅ COMPLETADA

Esta fase se enfoca en refinar la experiencia del usuario y robustecer las validaciones dentro del componente `VerificacionDetalleComponent`, aplicando completamente la estrategia de "recepción a ciegas".

### 6.1. Implementación de Recepción a Ciegas ✅ COMPLETADA
- [x] **Ocultar Cantidad Esperada**: Modificar el layout del footer en `verificacion-detalle.component.html` para no mostrar la `cantidadEsperada` ni la `diferencia`. Solo se deben mostrar `Recibida` y `Rechazada`.
- [x] **Inicializar Cantidad en Cero**: Asegurarse en `verificacion-detalle.component.ts` de que la primera variación siempre se cree con `cantidad: 0` y no se pre-cargue con la cantidad esperada.

### 6.2. Flujo de Validación por Discrepancia de Cantidad ✅ COMPLETADO
- [x] **Crear Servicio de Diálogo**: Crear un nuevo servicio (`DialogoService` o similar si no existe) que pueda abrir diálogos de confirmación genéricos con opciones personalizadas.
- [x] **Refactorizar `onVerificar()`**: Modificar el método en `verificacion-detalle.component.ts` para implementar la nueva lógica de validación.
  - [x] Calcular la cantidad total (`recibida + rechazada`) y compararla con `cantidadEsperada`.
  - [x] Si no coinciden, usar el servicio de diálogo para mostrar la alerta con las opciones "Volver a Contar" y "Confirmar y Rechazar Faltante".
- [x] **Implementar Lógica "Volver a Contar"**: Si el usuario elige esta opción, el diálogo simplemente se cierra.
- [x] **Implementar Lógica "Confirmar y Rechazar Faltante"**:
  - [x] Calcular la cantidad faltante.
  - [x] Crear una nueva variación (nuevo `FormGroup`) con la cantidad faltante.
  - [x] Marcar esta nueva variación como `rechazado: true`.
  - [x] **(Opcional Avanzado)**: Abrir un segundo diálogo o popover para que el usuario seleccione obligatoriamente un `motivoRechazo` para la variación recién creada.
  - [x] Una vez resuelto, proceder a llamar a la mutación `saveRecepcionMercaderiaItem` con la lista de variaciones actualizada (incluyendo la de rechazo).

### 6.3. Validación de Fechas de Vencimiento ✅ COMPLETADA
- [x] **Validación de Producto Vencido**: Implementar validación que detecte cuando la fecha de vencimiento es menor a la fecha actual.
- [x] **Validación de Vencimiento Próximo**: Implementar validación que detecte cuando la fecha de vencimiento está a menos de 30 días.
- [x] **Diálogos de Confirmación**: Implementar diálogos que permitan al usuario continuar o cambiar la fecha.
- [x] **Integración con Date Picker**: Integrar la validación en el flujo de selección de fechas.

### 6.4. Análisis de Procesos Post-Verificación (Documentación) ✅ COMPLETADO
- [x] **Verificar Manual de Implementación**: Revisar y asegurar que el manual distinga claramente que `saveRecepcionMercaderiaItem` solo actualiza el estado del ítem y sus variaciones, mientras que `finalizarRecepcion` es la que dispara los movimientos de stock y costos.
- [x] **Confirmar Flujo de Backend**: Validar que el backend efectivamente crea registros en `ProductoVencimiento` por cada variación que tenga una fecha de vencimiento al llamar a `saveRecepcionMercaderiaItem`.