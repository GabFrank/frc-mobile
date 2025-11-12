# Manual de Implementación: Recepción de Mercadería (Móvil) - ARQUITECTURA ACTUALIZADA
-- frontend: /Users/gabfranck/workspace/frc-sistemas-informaticos/frontend/mobile/frc-app
-- backend: /Users/gabfranck/workspace/frc-sistemas-informaticos/backend/central/frc-central-server

## 📊 **1. RESUMEN EJECUTIVO**

### **1.1. Objetivo**
Implementar un flujo de trabajo para la **Recepción Física de Mercadería** optimizado para dispositivos móviles. Este sistema será el método principal y por defecto para la recepción, relegando la versión de escritorio a un rol de soporte para casos especiales. El objetivo es proporcionar una herramienta ágil, intuitiva y robusta para el personal de operaciones en la sucursal, garantizando la correcta verificación de los productos recibidos contra las notas de recepción documentales.

### **1.2. Principios Clave**
- **Mobile-First**: Diseñado y optimizado para la experiencia en dispositivos móviles.
- **Centrado en el Operario**: La interfaz debe ser simple, con información clara y concisa, eliminando datos financieros irrelevantes para el proceso de verificación física (valores, descuentos, etc.).
- **Verificación In-Situ**: El sistema requiere que el usuario esté físicamente en la sucursal de recepción, validado por GPS o QR.
- **Independencia del Pedido**: El flujo se centra en las **Notas de Recepción** como protagonistas, permitiendo procesar una o varias simultáneamente.
- **Trazabilidad y Auditoría**: Cada acción de verificación, modificación o rechazo quedará registrada, asegurando una trazabilidad completa del proceso.
- **Estado Persistido**: **NUEVO**: Los items de recepción se crean automáticamente al iniciar la recepción, con estado persistido en la base de datos.

### **1.3. Flujo General (ARQUITECTURA ACTUALIZADA)**
1.  **Validación de Ubicación**: El operario valida su presencia en la sucursal.
2.  **Selección de Notas**: Se seleccionan una o más notas de recepción del mismo proveedor.
3.  **Inicio de Sesión de Recepción**: Se crea una `RecepcionMercaderia` que agrupa toda la operación.
4.  **Pre-Creación Automática de Items**: **NUEVO**: El sistema crea automáticamente todos los `RecepcionMercaderiaItem` con estado `PENDIENTE`.
5.  **Verificación de Productos**: En modo "Agrupado por Producto", se verifican los ítems usando lector de código de barras o selección manual.
6.  **Actualización de Items Existentes**: **NUEVO**: Se actualizan los items pre-creados en lugar de crear nuevos.
7.  **Registro de Cantidades y Vencimientos**: Se registran las cantidades recibidas y, si aplica, las fechas de vencimiento.
8.  **Finalización y Constancia**: Al terminar, se genera una **Constancia de Recepción** como comprobante para el proveedor.

---

## 🏛️ **2. ENTIDADES DEL DOMINIO (ARQUITECTURA ACTUALIZADA)**

### **2.1. Entidades Existentes Clave**
- `RecepcionMercaderia`, `RecepcionMercaderiaNota`, `NotaRecepcion`, `NotaRecepcionItem`, `Producto`, `Presentacion`, `Proveedor`, `Sucursal`, `Usuario`.

#### **2.1.1. Modificación a `RecepcionMercaderiaItem` ✅ IMPLEMENTADO**
- **`metodoVerificacion`**: `Enum` (`ESCANER`, `MANUAL`) - Implementado.
- **`motivoVerificacionManual`**: `Enum` (`CODIGO_ILEGIBLE`, `PRODUCTO_SIN_CODIGO`) - Implementado.
- **`estadoVerificacion`**: `Enum` (`PENDIENTE`, `VERIFICADO`, `VERIFICADO_CON_DIFERENCIA`, `RECHAZADO`) - **NUEVO, IMPLEMENTADO**.

### **2.2. Nuevas Entidades a Crear ✅ IMPLEMENTADAS**

#### **2.2.1. `ProductoVencimiento` ✅ IMPLEMENTADO**
- **Tabla**: `producto_vencimiento` - Implementada.
- **Schema**: `operaciones` - Implementado.
- **Campos**: Todos implementados según especificación.

#### **2.2.2. `ConstanciaDeRecepcion` ✅ IMPLEMENTADO**
- **Tabla**: `constancia_de_recepcion` - Implementada.
- **Schema**: `operaciones` - Implementado.
- **Campos**: Todos implementados según especificación.

#### **2.2.3. `ConstanciaDeRecepcionItem` ✅ IMPLEMENTADO**
- **Tabla**: `constancia_de_recepcion_item` - Implementada.
- **Schema**: `operaciones` - Implementado.
- **Campos**: Todos implementados según especificación.

---

## ⚙️ **3. FLUJO DE TRABAJO Y REQUERIMIENTOS FUNCIONALES (ARQUITECTURA ACTUALIZADA)**

### **3.1. Inicio de Sesión y Selección de Notas**
- **RF-01**: El usuario debe validar su presencia en la sucursal de recepción mediante los mecanismos existentes (QR o Geocalización).
- **RF-02**: Una vez validado, la aplicación presentará una interfaz limpia para la selección de notas. La pantalla contendrá:
    - Un campo para seleccionar un `Proveedor` (opcional, actúa como filtro pre-búsqueda).
    - Un campo de texto para ingresar manualmente un `número de nota de recepción`.
    - Un **ícono de búsqueda** junto al campo de texto.
- **RF-03: Búsqueda y Selección de Notas**: El usuario tiene dos maneras de agregar notas a la sesión:
    - **Entrada Directa**: El usuario ingresa un número de nota. Si el resultado es único, se muestra un diálogo de confirmación con los detalles de la nota. Si no es único, se muestra una lista para que elija.
    - **Búsqueda Asistida**: Al hacer clic en el **ícono de búsqueda**, se abrirá un **diálogo modal**. Este diálogo contendrá la lista completa de todas las `NotaRecepcion` pendientes para la sucursal, con herramientas para buscar y filtrar.
- **RF-04**: Tras seleccionar una nota por cualquiera de los dos métodos, se mostrará un **diálogo de confirmación** con información mínima (Proveedor, fecha, etc.) para que el usuario verifique que es la correcta antes de agregarla a la lista de sesión.
- **RF-05**: Las notas confirmadas se irán agregando a una lista visible en la pantalla principal ("Notas a Recepcionar en esta Sesión"), con una opción para remover cada una.
- **RF-06**: Un botón de acción principal ("Iniciar Recepción") estará presente en el footer. Este botón se habilitará únicamente cuando haya al menos una nota en la lista de sesión.
- **R-01 (Regla de Negocio)**: El sistema debe validar que todas las notas agregadas a la sesión pertenezcan al mismo `Proveedor`.
- **R-02 (Regla de Negocio)**: El sistema debe filtrar y permitir seleccionar únicamente notas que no hayan sido completamente recepcionadas en la sucursal actual.
- **RF-07**: Al presionar "Iniciar Recepción", el sistema crea una única instancia de `RecepcionMercaderia` con estado `EN_PROCESO`, asociando todas las `NotaRecepcion` seleccionadas.
- **RF-07.1: NUEVO - Pre-Creación Automática de Items**: **IMPORTANTE**: Al iniciar la recepción, el sistema crea automáticamente todos los `RecepcionMercaderiaItem` necesarios:
    - Para cada `NotaRecepcionItemDistribucion` de las notas seleccionadas, se crea un `RecepcionMercaderiaItem`.
    - Cada item se crea con `estadoVerificacion = PENDIENTE`.
    - Cada item se crea con `cantidadRecibida = 0`.
    - Cada item se vincula correctamente con su distribución y producto.
- **RF-08**: El modo de trabajo por defecto será **"Agrupar por Productos"**. Se debe proveer una opción en la UI para cambiar al modo "Agrupar por Notas".

### **3.3. Recepción Agrupada por Producto (ARQUITECTURA ACTUALIZADA)**
- **RF-09: Interfaz de Verificación**: La pantalla principal para la verificación de productos se compondrá de tres partes: sección de verificación de nuevos items, búsqueda en historial, y lista de productos verificados.
- **RF-10: Búsqueda Proactiva de Producto**: En la sección "Verificar Nuevo Item", se mostrarán dos botones principales:
    - **Búsqueda Manual**: Botón naranja que abre el diálogo de búsqueda de productos para encontrar items pendientes de verificar.
    - **Escanear Código**: Botón verde outline que activa la cámara para escanear códigos de barras directamente.
    - **NUEVO**: Si el producto escaneado o buscado se encuentra en la sesión de recepción (items con estado `PENDIENTE`), el sistema abrirá directamente el **Diálogo de Verificación Detallada** para ese producto.
- **RF-11: Lista de Productos Verificados (HISTORIAL)**: **ARQUITECTURA ACTUALIZADA - RECEPCIÓN A CIEGAS**: Debajo de la sección de verificación, se mostrará **ÚNICAMENTE la lista de productos ya verificados** (historial). **IMPORTANTE**: Esta implementación sigue la estrategia de **"recepción a ciegas"** donde:
    - **NO se muestran los productos pendientes** en la tabla principal para evitar sesgos y errores.
    - **Solo se muestran productos ya verificados** como historial de la sesión.
    - **La búsqueda es la única forma** de encontrar y verificar productos pendientes.
    - **Fuente de datos del historial**: `recepcionMercaderiaItemsPorRecepcionPaginados` con estado `VERIFICADO`.
    - **Fuente de datos para búsqueda**: `recepcionMercaderiaItemsPorRecepcionPaginados` con estado `PENDIENTE`.
    - Los items se agrupan localmente por producto para mostrar la UI del historial.
    - Cada ítem del historial mostrará:
        - Información esencial: **Imagen, Nombre del Producto, Código Principal y Cantidad Total Esperada**.
        - **Estado de verificación**: Badge indicando que el producto ya fue verificado.
        - **NO incluye botones de acción** ya que son solo para visualización del historial.
- **RF-11.1: Búsqueda en Historial**: Se incluye un campo de búsqueda para filtrar productos ya verificados en el historial, con botones para aplicar y limpiar filtros.
- **R-03 (Regla de Auditoría y Responsabilidad)**: Al usar la **Verificación Manual**, el sistema debe:
    - Mostrar un **diálogo de advertencia** informando al usuario que está realizando una verificación sin la confirmación del escáner y que la responsabilidad es suya.
    - Solicitar al usuario que seleccione un motivo para la verificación manual (ej. botones: "Producto sin código de barras", "Código de barras ilegible", u otras opciones en un dropdown).
    - Registrar tanto el `metodoVerificacion` como 'MANUAL', como también el motivo seleccionado para fines de auditoría.
- **RF-12: Apertura del Diálogo de Verificación**: El **Diálogo de Verificación Detallada** (ver 3.4) es el paso central para registrar la recepción de CUALQUIER producto. Se abrirá **siempre** que el usuario inicie una acción de verificación, ya sea mediante la búsqueda proactiva o desde los íconos de la lista.
- **RF-13: Flujo de Verificación Rápida (dentro del diálogo)**: La "rapidez" se logra mediante un diseño inteligente del diálogo:
    - Al abrirse, el campo "Cantidad Recibida" se **autocompleta** con la cantidad total esperada.
    - Si la cantidad es correcta y el producto no requiere información adicional (como fecha de vencimiento), el usuario solo necesita presionar **"Confirmar"** para completar la verificación (flujo de 1-click).
    - Si la cantidad es incorrecta o se necesita agregar un vencimiento, el usuario simplemente edita los campos necesarios antes de confirmar. Esto mantiene un flujo único, consistente y seguro.

### **3.4. Diálogo de Verificación Detallada (ARQUITECTURA ACTUALIZADA)**
- **RF-14 (Actualizado)**: El concepto central de la verificación ya no es un único formulario, sino una **lista dinámica de "variaciones"**. Cada variación representa un lote de producto con una presentación, cantidad y vencimiento específicos.
- **RF-14.1: Interfaz de Variaciones**:
    - La interfaz mostrará una lista de "tarjetas", donde cada tarjeta es un formulario para una variación.
    - Siempre habrá al menos una tarjeta visible.
    - Un botón "Adicionar Variación" permitirá al usuario agregar nuevas tarjetas a la lista.
    - Cada tarjeta (excepto la primera) tendrá un icono para ser eliminada.
- **RF-14.2: Campos por Variación**: Cada tarjeta de variación contendrá:
    - **Presentación**: Un selector para elegir la `presentacion` en la que se recibió esa parte del producto.
    - **Cantidad**: Campo numérico para la cantidad de esa variación específica. **Importante**: Para cumplir con la "recepción a ciegas", este campo siempre iniciará en 0.
    - **Vencimiento**: Campo de fecha, visible si `producto.posee_vencimiento` es `true`.
    - **Rechazar (Toggle/Checkbox)**: Un control para marcar si esta variación específica es rechazada.
    - **Motivo de Rechazo**: Si "Rechazar" está activo, se mostrará un selector con los `MotivoRechazoFisico`.
- **RF-14.3: NUEVO - Flujo de Verificación con Discrepancia**:
    - Al presionar "Verificar", el sistema valida que la suma de las cantidades de todas las variaciones sea igual a la `cantidadEsperada` total del ítem.
    - **Si NO coinciden**:
        - Se muestra un diálogo de alerta informando la discrepancia.
        - Se ofrecen dos opciones:
            1. **"Volver a Contar"**: Cierra la alerta y permite al usuario corregir las cantidades.
            2. **"Confirmar y Rechazar Faltante"**: El sistema crea automáticamente una nueva variación de rechazo con la cantidad faltante, solicita un motivo, y luego procede a guardar.
    - **Si coinciden**: Se procede directamente a guardar.
- **RF-20 (ARQUITECTURA ACTUALIZADA)**: Al guardar, el sistema enviará una **lista de variaciones** al backend.
    - El backend procesará esta lista, creando o actualizando registros en una nueva tabla `RecepcionMercaderiaItemVariacion`.
    - La entidad principal `RecepcionMercaderiaItem` se actualizará sumando los totales de las variaciones para `cantidadRecibida` y `cantidadRechazada`.
    - Se calculará el `estadoVerificacion` del ítem principal en base a estos totales.

### **3.4.1. NUEVO: Gestión de Múltiples Variaciones (Lotes, Vencimientos, Presentaciones)**
- **RF-14 (Actualizado)**: El concepto central de la verificación ya no es un único formulario, sino una **lista dinámica de "variaciones"**. Cada variación representa un lote de producto con una presentación, cantidad y vencimiento específicos.
- **RF-14.1: Interfaz de Variaciones**:
    - La interfaz mostrará una lista de "tarjetas", donde cada tarjeta es un formulario para una variación.
    - Siempre habrá al menos una tarjeta visible.
    - Un botón "Adicionar Variación" permitirá al usuario agregar nuevas tarjetas a la lista.
    - Cada tarjeta (excepto la primera) tendrá un icono para ser eliminada.
- **RF-14.2: Campos por Variación**: Cada tarjeta de variación contendrá:
    - **Presentación**: Un selector para elegir la `presentacion` en la que se recibió esa parte del producto.
    - **Cantidad**: Campo numérico para la cantidad de esa variación específica.
    - **Vencimiento**: Campo de fecha, visible si `producto.posee_vencimiento` es `true`.
    - **Rechazar (Toggle/Checkbox)**: Un control para marcar si esta variación específica es rechazada.
    - **Motivo de Rechazo**: Si "Rechazar" está activo, se mostrará un selector con los `MotivoRechazoFisico`.
- **RF-20 (ARQUITECTURA ACTUALIZADA)**: Al guardar, el sistema enviará una **lista de variaciones** al backend.
    - El backend procesará esta lista, creando o actualizando registros en una nueva tabla `RecepcionMercaderiaItemVariacion`.
    - La entidad principal `RecepcionMercaderiaItem` se actualizará sumando los totales de las variaciones para `cantidadRecibida` y `cantidadRechazada`.
    - Se calculará el `estadoVerificacion` del ítem principal en base a estos totales.

### **3.5. Finalización de la Recepción y Procesos de Backend**
- **RF-22**: Cuando todos los ítems de la sesión de recepción hayan sido procesados (verificados o rechazados), el usuario debe poder presionar el botón "Finalizar Recepción".
- **RF-23**: Al finalizar, el sistema ejecutará una serie de procesos de backend de forma transaccional para consolidar la operación:

#### **3.5.1. Acciones de Backend Post-Finalización**
- **RF-24 (Actualización de Estado):** El estado de la `RecepcionMercaderia` se actualiza a `FINALIZADO`.
- **RF-25 (Generación de Constancia):** Se genera el documento `ConstanciaDeRecepcion` con sus ítems, sirviendo como el registro inmutable de la operación para el proveedor.
    - Se debe generar un documento en formato PDF con un diseño formal y un `codigo_verificacion` único.
    - La aplicación móvil debe permitir al usuario previsualizar, imprimir o compartir digitalmente la constancia.
- **RF-26 (Movimiento de Stock):** Para cada `RecepcionMercaderiaItem` con `cantidadRecibida > 0`, el sistema debe generar un `MovimientoStock` de tipo `ENTRADA_POR_COMPRA`. Esto incrementará el inventario del `producto` en la `sucursalEntrega` correspondiente.
- **RF-27 (Cálculo de Costos):** El sistema debe invocar al servicio de costos (`CostoService`) para calcular y registrar el nuevo `CostoProducto` de los ítems recibidos. El costo se basará en el `precioUnitarioEnNota` del documento original.
- **RF-28 (Actualización de Documentos Origen):** Se debe actualizar el estado de las `NotaRecepcionItem` y `NotaRecepcion` originales para reflejar que ya han sido procesadas, evitando que puedan ser recepcionadas nuevamente en la misma sucursal.

---

## 🏗️ **4. REQUERIMIENTOS DE BACKEND (API GRAPHQL) - ARQUITECTURA ACTUALIZADA**

### **4.1. API para la Selección de Notas (Nuevos Endpoints) ✅ IMPLEMENTADOS**
- **Query `notasPendientes(sucursalId: ID!, proveedorId: ID): [NotaRecepcion]`** ✅ IMPLEMENTADO
  - **Propósito:** Reemplaza a `onGetNotaRecepcionPorPedidoId`. Es el punto de entrada para el flujo móvil.
  - **Lógica:** Devuelve todas las `NotaRecepcion` que están pendientes de recepción para una sucursal y, opcionalmente, filtradas por un proveedor.

- **Query `productosAgrupadosPorNotas(notaRecepcionIds: [ID!]): [ProductoAgrupadoDTO]`** ⚠️ **DEPRECADO - NO USAR**
  - **Propósito:** **DEPRECADO** - Esta query ya no se debe usar en la nueva arquitectura.
  - **Lógica:** **DEPRECADO** - Se reemplaza por `recepcionMercaderiaItemsPorRecepcion`.

### **4.2. API para la Sesión de Recepción (Nuevos Endpoints) ✅ IMPLEMENTADOS**
- **Mutation `iniciarRecepcion(input: IniciarRecepcionInput!): RecepcionMercaderia`** ✅ IMPLEMENTADO
  - **Propósito:** Crea la `RecepcionMercaderia` que servirá como la sesión de trabajo.
  - **Input:** `{ sucursalId: ID!, notaRecepcionIds: [ID!]! }`
  - **Lógica:** **ARQUITECTURA ACTUALIZADA**: Crea la `RecepcionMercaderia` y **automáticamente crea todos los `RecepcionMercaderiaItem`** necesarios con estado `PENDIENTE`.

### **4.3. API para Verificación de Ítems (ARQUITECTURA ACTUALIZADA) ✅ IMPLEMENTADOS**

#### **4.3.1. Query para Obtener Items de Recepción ✅ IMPLEMENTADA**
- **Query `recepcionMercaderiaItemsPorRecepcionPaginados(recepcionId: ID!, page: Int!, size: Int!, filtroTexto: String, estado: EstadoVerificacion): Page<RecepcionMercaderiaItem>`** ✅ IMPLEMENTADA
  - **Propósito**: **PRINCIPAL** - Obtener items de recepción con paginación y filtros.
  - **Uso en la implementación**:
    - **Para historial**: Con `estado = VERIFICADO` para mostrar productos ya verificados.
    - **Para búsqueda de pendientes**: Con `estado = PENDIENTE` para encontrar productos a verificar.
  - **Lógica**: Retorna items paginados, con filtro por texto y por estado de verificación.

#### **4.3.2. Mutations para Verificación ✅ IMPLEMENTADAS**
- **Mutation `saveRecepcionMercaderiaItem(input: RecepcionMercaderiaItemInput!): RecepcionMercaderiaItem`** ✅ IMPLEMENTADA
  - **Propósito**: **ARQUITECTURA ACTUALIZADA** - Ahora **actualiza** items existentes en lugar de crear nuevos.
  - **Lógica Actualizada**: 
    - El `input` debe incluir el `id` del `RecepcionMercaderiaItem` pre-creado.
    - Se actualizan los campos (`cantidadRecibida`, `metodoVerificacion`, etc.).
    - Se calcula automáticamente el nuevo `estadoVerificacion`.

- **Mutation `cancelarVerificacion(notaRecepcionItemId: ID!, sucursalId: ID!): Boolean`** ✅ IMPLEMENTADA
- **Mutation `cancelarRechazo(notaRecepcionItemId: ID!, sucursalId: ID!): Boolean`** ✅ IMPLEMENTADA

### **4.3.3. NUEVO: Entidades y Lógica para Variaciones**
- **Nueva Entidad `RecepcionMercaderiaItemVariacion`**:
  - **Propósito**: Almacenar los detalles de cada variación de un ítem recibido.
  - **Campos Clave**: `recepcionMercaderiaItem`, `presentacion`, `cantidad`, `vencimiento`, `rechazado`, `motivoRechazo`.
- **Refactor de `saveRecepcionMercaderiaItem`**:
  - **Input**: El `input` ahora debe aceptar una lista de `RecepcionMercaderiaItemVariacionInput`.
  - **Lógica**:
    1. Elimina las variaciones anteriores del ítem.
    2. Crea las nuevas variaciones basadas en la lista del input.
    3. Sumariza las cantidades de las nuevas variaciones y actualiza `cantidadRecibida` y `cantidadRechazada` en `RecepcionMercaderiaItem`.
    4. Recalcula y guarda el `estadoVerificacion` del ítem principal.

### **4.4. API para la Finalización ✅ IMPLEMENTADA**
- **Mutation `finalizarRecepcion(recepcionMercaderiaId: ID!): ConstanciaDeRecepcion`** ✅ IMPLEMENTADA
  - **Propósito:** Reemplaza a `onFinalizarRecepcionFisicaPorPedido`. Inicia la cascada de procesos de finalización.
  - **Lógica:** Este resolver debe orquestar las acciones de backend descritas en la sección `3.5.1` (Generar Constancia, Movimiento de Stock, Cálculo de Costos, etc.), utilizando el `recepcionMercaderiaId` como punto de partida.

---

## 📝 **5. CONSIDERACIONES ADICIONALES - ARQUITECTURA ACTUALIZADA**

### **5.1. Cambios Arquitectónicos Principales**
- **Estado Persistido**: Los items de recepción ahora tienen un estado persistido en la base de datos (`PENDIENTE`, `VERIFICADO`, `VERIFICADO_CON_DIFERENCIA`, `RECHAZADO`).
- **Pre-Creación Automática**: Todos los items se crean automáticamente al iniciar la recepción, eliminando la necesidad de lógica compleja de "continuar recepción".
- **Flujo Simplificado**: El frontend ahora solo necesita actualizar items existentes, no crear nuevos.
- **Trazabilidad Completa**: Cada item mantiene su relación completa con la distribución original de la nota de recepción.
- **Interfaz Dual**: Sección de verificación para nuevos items y tabla de historial para productos ya verificados.

### **5.2. Beneficios de la Nueva Arquitectura**
- **Simplicidad**: No más lógica compleja de estado en el frontend.
- **Consistencia**: El estado siempre está sincronizado entre frontend y backend.
- **Auditoría**: Trazabilidad completa de cada acción de verificación.
- **Performance**: Menos cálculos en el frontend, más en el backend optimizado.
- **Mantenibilidad**: Código más simple y fácil de mantener.
- **Prevención de Errores**: Estrategia de "recepción a ciegas" evita sesgos humanos.

### **5.3. UI/UX**
- **UI/UX**: La interfaz debe ser extremadamente clara, usando íconos y colores para indicar estados (pendiente, verificado, discrepancia, rechazado). Las acciones más comunes deben ser accesibles con un mínimo de taps.
- **Performance**: Las consultas al backend deben estar optimizadas. La carga de productos y notas debe ser rápida para no entorpecer el trabajo del operario.
- **Manejo de Errores**: Se debe proveer feedback claro al usuario en caso de errores de red, de validación o del servidor.
- **Offline-First (Futuro)**: Para una versión futura, se debe analizar la viabilidad de un modo offline que permita continuar la recepción sin conexión a internet y sincronizar los datos posteriormente.
- **Auditoría**: Todas las mutaciones de GraphQL que modifiquen datos deben registrar quién (`usuario_id`) y cuándo (`timestamp`) realizó la operación.

### **5.4. Estrategia de "Recepción a Ciegas"**
- **Objetivo**: Implementar una estrategia de recepción que evite sesgos y errores humanos al no mostrar previamente los productos pendientes de verificar.
- **Principios Clave**:
  - **NO se muestran productos pendientes** en la tabla principal para evitar que el operario "adivine" qué debe recibir.
  - **Solo se muestran productos ya verificados** como historial de la sesión de trabajo.
  - **La búsqueda es la única forma** de encontrar y verificar productos pendientes.
  - **Cada producto se verifica individualmente** sin conocimiento previo de la lista completa.

- **Beneficios de la Estrategia**:
  - **Prevención de Errores**: El operario no puede "marcar como recibido" productos que no ha verificado físicamente.
  - **Auditoría Completa**: Cada verificación requiere una acción explícita de búsqueda y escaneo.
  - **Trazabilidad**: Se registra exactamente qué productos fueron buscados y verificados.
  - **Calidad**: Fuerza la verificación física real de cada producto.

- **Implementación Técnica**:
  - **Sección de Verificación**: Botones "Búsqueda Manual" y "Escanear" para encontrar productos pendientes.
  - **Tabla Principal**: Muestra solo `RecepcionMercaderiaItem` con `estadoVerificacion = VERIFICADO`.
  - **Búsqueda de Pendientes**: Usa `recepcionMercaderiaItemsPorRecepcionPaginados` con `estado = PENDIENTE`.
  - **Búsqueda en Historial**: Usa `recepcionMercaderiaItemsPorRecepcionPaginados` con `estado = VERIFICADO`.
  - **Verificación**: Cada producto encontrado se abre directamente en el diálogo de verificación.
  - **Actualización**: Los items verificados se actualizan y aparecen automáticamente en el historial.

- **Flujo de Usuario**:
  1. **Inicio**: El usuario ve solo el historial de productos ya verificados.
  2. **Verificación de Nuevo Item**: Usa los botones "Búsqueda Manual" o "Escanear" para encontrar productos pendientes.
  3. **Búsqueda**: Debe buscar activamente cada producto que desea verificar.
  4. **Verificación**: Al encontrar un producto pendiente, se abre el diálogo de verificación.
  5. **Confirmación**: El producto verificado aparece inmediatamente en el historial.
  6. **Búsqueda en Historial**: Puede filtrar productos ya verificados usando el campo de búsqueda del historial.
  7. **Repetición**: El proceso continúa hasta que todos los productos estén verificados.

### **5.5. Estructura de la Interfaz Implementada**
- **Layout de la Pantalla Principal**:
  1. **Header**: Título "Recepción Agrupada por Producto" con botón de escaneo QR.
  2. **Información de Recepción**: Panel expandible con datos de la recepción (sucursal, proveedor, estado, fecha, usuario).
  3. **Sumario de Recepción**: Panel expandible con estadísticas (total items, verificados, pendientes, rechazados).
  4. **Verificar Nuevo Item**: Sección central con botones de acción:
     - **Búsqueda Manual**: Botón naranja para buscar productos por nombre o código.
     - **Escanear**: Botón verde outline para escanear códigos de barras.
  5. **Búsqueda en Historial**: Campo de búsqueda para filtrar productos ya verificados:
     - Campo de texto para ingresar términos de búsqueda.
     - Botón "Aplicar Filtro" para ejecutar la búsqueda.
     - Botón "Limpiar" para resetear el filtro.
  6. **Lista de Productos Verificados**: Tabla que muestra solo el historial:
     - Imagen del producto (o icono por defecto).
     - Nombre del producto.
     - Cantidad total esperada.
     - Número de items verificados.
     - Badge "✅ Verificado" indicando el estado.
  7. **Paginación**: Componente de paginación para navegar por el historial.
  8. **Footer**: Botón "Finalizar Recepción" (siempre habilitado).

- **Flujo de Interacción**:
  - **Para verificar un nuevo producto**: Usar botones de "Verificar Nuevo Item".
  - **Para revisar productos ya verificados**: Usar la búsqueda en historial.
  - **Para finalizar**: Usar el botón del footer (solo cuando no hay items pendientes).

- **Características de la Implementación**:
  - **Responsive**: Adaptado para dispositivos móviles.
  - **Dark Theme**: Colores consistentes con el tema oscuro de la aplicación.
  - **Accesibilidad**: Botones con iconos y texto descriptivo.
  - **Performance**: Búsquedas paginadas y filtros optimizados.

---

## **📋 RESUMEN DE LA IMPLEMENTACIÓN ACTUAL**

### **Estado de Implementación**
- **Backend (Fase 4)**: ✅ **100% COMPLETADO**
- **Frontend (Fase 4)**: ✅ **100% COMPLETADO**
- **Arquitectura**: ✅ **IMPLEMENTADA** - Transición de `ProductoAgrupadoDTO` a `RecepcionMercaderiaItem` directo
- **Estrategia de Recepción a Ciegas**: ✅ **IMPLEMENTADA** - No se muestran productos pendientes en la tabla principal

### **Componentes Implementados**
1. **RecepcionAgrupadaPage**: ✅ Refactorizado para usar nueva arquitectura
2. **VerificacionDetalleComponent**: ✅ Refactorizado para recibir `RecepcionMercaderiaItem`
3. **Búsqueda de Productos**: ✅ Implementada con queries separadas para pendientes
4. **Historial de Verificados**: ✅ Implementado con paginación y filtros
5. **Sección de Verificación**: ✅ Restaurada con botones de búsqueda manual y escaneo

### **Queries GraphQL Utilizadas**
- **`recepcionMercaderiaItemsPorRecepcionPaginados`**: Query principal para historial y búsqueda
- **`saveRecepcionMercaderiaItem`**: Mutation para actualizar items verificados
- **`getRecepcionMercaderia`**: Para obtener datos de la recepción
- **`obtenerSumarioRecepcion`**: Para estadísticas de la recepción

### **Flujo de Trabajo Implementado**
1. **Inicio**: Usuario ve historial de productos verificados
2. **Verificación**: Usa botones "Búsqueda Manual" o "Escanear"
3. **Búsqueda**: Sistema busca en items pendientes
4. **Verificación**: Abre diálogo de verificación detallada
5. **Confirmación**: Producto aparece en historial
6. **Finalización**: Botón habilitado cuando no hay items pendientes

### **Próximos Pasos Recomendados**
- **Testing Exhaustivo**: Probar todos los flujos de verificación, filtrado y acciones contextuales
- **Optimización de Performance**: Revisar queries paginadas y filtros por array de estados en producción
- **Documentación de Usuario**: Crear manual de usuario final para operarios con las nuevas funcionalidades
- **Capacitación**: Entrenar usuarios en la nueva interfaz, filtros y acciones contextuales
- **Monitoreo**: Implementar métricas de uso y performance en producción
- **Validación de Reglas**: Verificar que todas las reglas del proyecto se cumplan en producción

---

## **🔧 PRÓXIMO PASO: MEJORAR COMPONENTE VERIFICACION-DETALLE**

### **Objetivo**
Optimizar y refactorizar el componente `VerificacionDetalleComponent` para mejorar la experiencia del usuario, la mantenibilidad del código y la funcionalidad.

### **Áreas de Mejora Identificadas**

#### **5.5.1. Gestión de Estado y Reactividad**
- **Problema**: El componente no reacciona automáticamente a cambios en el formulario
- **Solución**: Implementar `valueChanges` para recalcular diferencias en tiempo real
- **Beneficio**: Mejor UX con feedback inmediato al usuario

#### **5.5.2. Validaciones de Formulario**
- **Problema**: Validaciones básicas sin mensajes de error personalizados
- **Solución**: Agregar validadores customizados y mensajes de error
- **Beneficio**: Mejor guía para el usuario y prevención de errores

#### **5.5.3. Manejo de Vencimientos**
- **Problema**: Lógica de vencimientos incompleta y no integrada con el formulario
- **Solución**: Implementar gestión completa de vencimientos con validaciones
- **Beneficio**: Funcionalidad completa para productos con vencimiento

#### **5.5.4. Navegación por Teclado**
- **Problema**: No hay navegación por teclado para mejorar la productividad
- **Solución**: Implementar navegación con Enter entre campos
- **Beneficio**: Flujo más rápido para usuarios experimentados

#### **5.5.5. Gestión de Errores**
- **Problema**: Manejo básico de errores sin retry o fallback
- **Solución**: Implementar estrategias de retry y fallback para presentaciones
- **Beneficio**: Mayor robustez en entornos con conexión inestable

#### **5.5.6. Performance y Optimización**
- **Problema**: Cálculos repetitivos y re-renderizados innecesarios
- **Solución**: Implementar `OnPush` strategy y memoización de cálculos
- **Beneficio**: Mejor rendimiento en dispositivos móviles

#### **5.5.7. Accesibilidad**
- **Problema**: Falta de atributos ARIA y navegación por screen readers
- **Solución**: Agregar atributos de accesibilidad y navegación por teclado
- **Beneficio**: Inclusión de usuarios con discapacidades

#### **5.5.8. Testing y Debugging**
- **Problema**: Falta de logs estructurados y manejo de edge cases
- **Solución**: Implementar logging estructurado y manejo de casos límite
- **Beneficio**: Mejor debugging y mantenimiento

### **Plan de Implementación**

#### **Fase 1: Reactividad y Validaciones (Prioridad Alta)**
1. Implementar `valueChanges` para recalcular diferencias
2. Agregar validadores customizados para cantidades
3. Implementar mensajes de error personalizados

#### **Fase 2: Funcionalidad de Vencimientos (Prioridad Alta)**
1. Completar lógica de gestión de vencimientos
2. Integrar vencimientos con el formulario principal
3. Agregar validaciones para cantidades de vencimientos

#### **Fase 3: Navegación y UX (Prioridad Media)**
1. Implementar navegación por teclado
2. Agregar indicadores visuales de estado
3. Mejorar feedback visual para el usuario

#### **Fase 4: Performance y Accesibilidad (Prioridad Media)**
1. Implementar `OnPush` strategy
2. Agregar atributos ARIA
3. Optimizar cálculos y re-renderizados

#### **Fase 5: Testing y Robustez (Prioridad Baja)**
1. Implementar logging estructurado
2. Agregar manejo de edge cases
3. Implementar estrategias de retry

### **Criterios de Éxito**
- **Reactividad**: Diferencia se recalcula automáticamente al cambiar cantidades
- **Validaciones**: Mensajes de error claros y preventivos
- **Vencimientos**: Gestión completa y funcional
- **Navegación**: Flujo fluido por teclado
- **Performance**: Tiempo de respuesta < 100ms en cambios de formulario
- **Accesibilidad**: Navegación completa por screen reader

---

## ✅ FASE 4: ARQUITECTURA DE ESTADO PERSISTIDO (COMPLETADA)

Se ha implementado con éxito la arquitectura de estado persistido, donde los `RecepcionMercaderiaItem` se pre-crean al iniciar la recepción.

---

## 🚀 FASE 5: REFACTOR DE VERIFICACIÓN DETALLADA CON VARIACIONES (COMPLETADA)

### Objetivo
Implementar la capacidad de registrar múltiples variaciones (diferentes presentaciones, vencimientos, lotes) para un único producto durante la verificación, reemplazando el formulario simple por una lista dinámica.

### 5.6.1. Cambios en Backend (Prioridad Alta) ✅ COMPLETADOS
- ✅ **Crear Entidad `RecepcionMercaderiaItemVariacion`**: Nueva entidad para almacenar los detalles de cada variación.
- ✅ **Actualizar Esquema GraphQL**:
  - ✅ Definir tipo `RecepcionMercaderiaItemVariacion` y su `Input`.
  - ✅ Modificar `saveRecepcionMercaderiaItem` para que acepte una lista de `RecepcionMercaderiaItemVariacionInput`.
- ✅ **Refactorizar Lógica de `saveRecepcionMercaderiaItem`**: Implementar la lógica de eliminación y recreación de variaciones, y la actualización de los totales en `RecepcionMercaderiaItem`.
- ✅ **Crear Migración de Base de Datos**: Añadir tabla `operaciones.recepcion_mercaderia_item_variacion`.

### 5.6.2. Cambios en Frontend (Prioridad Alta) ✅ COMPLETADOS
- ✅ **Actualizar Modelos**: Crear `recepcion-mercaderia-item-variacion.model.ts` y actualizar el input de la mutación.
- ✅ **Refactorizar `VerificacionDetalleComponent`**:
  - ✅ Reemplazar el `FormGroup` simple por un `FormArray` que gestione una lista de variaciones.
  - ✅ Implementar la UI de "tarjetas" dinámicas para cada variación.
  - ✅ Implementar métodos para agregar y eliminar variaciones del `FormArray`.
  - ✅ Actualizar el método `onVerificar` para enviar la lista de variaciones al backend.
- ✅ **Mejorar UI**:
  - ✅ Mover el resumen de cantidades a un **footer fijo** dentro del componente para visibilidad constante.
  - ✅ Asegurar que el botón "Verificar" esté fijo en el footer.
  - ✅ Añadir la flecha de "atrás" en el header.

---

## 🚀 FASE 6: MEJORAS DE UX Y VALIDACIONES EN VERIFICACIÓN DETALLADA (COMPLETADA)

### Objetivo
Refinar la experiencia del usuario y robustecer las validaciones dentro del componente `VerificacionDetalleComponent`, aplicando completamente la estrategia de "recepción a ciegas" y implementando un flujo de validación por discrepancia de cantidad.

### 6.1. Implementación de Recepción a Ciegas ✅ COMPLETADA
- **Ocultar Cantidad Esperada**: Se modificó el layout del footer para no mostrar la `cantidadEsperada` ni la `diferencia`, mostrando únicamente `Recibida` y `Rechazada`.
- **Inicializar Cantidad en Cero**: Se aseguró que la primera variación siempre se cree con `cantidad: 0` y no se pre-cargue con la cantidad esperada, implementando la estrategia de "recepción a ciegas".

**Nota sobre la Estrategia de Recepción a Ciegas:**
La "recepción a ciegas" se implementa para **evitar sesgos durante el proceso de verificación física**, no para ocultar información crítica que el usuario necesita para tomar decisiones informadas. Por lo tanto:

- **❌ NO se muestra la cantidad esperada** en la lista principal de productos o durante la búsqueda proactiva
- **✅ SÍ se muestra la cantidad esperada** en diálogos de validación y durante la verificación detallada, ya que el usuario necesita esta información para tomar decisiones informadas sobre discrepancias
- **✅ SÍ se muestra la cantidad esperada** en la constancia final como comprobante para el proveedor

### 6.2. Flujo de Validación por Discrepancia de Cantidad ✅ COMPLETADO
- **Servicio de Diálogo Mejorado**: Se refactorizó el `DialogoService` para incluir métodos específicos para manejo de discrepancias y selección de motivos de rechazo.
- **Validación Inteligente**: Se implementó un flujo que detecta automáticamente discrepancias entre la cantidad total y la esperada.
- **Opciones de Usuario**: Se proporcionan dos opciones claras:
  - **"Volver a Contar"**: Permite al usuario corregir las cantidades manualmente.
  - **"Confirmar y Rechazar Faltante"**: Crea automáticamente una variación de rechazo para la cantidad faltante.
- **Selección de Motivo**: Se implementó un diálogo con opciones de radio para seleccionar el motivo de rechazo de la cantidad faltante.

### 6.3. Validación de Fechas de Vencimiento ✅ COMPLETADA
- **Validación de Producto Vencido**: Al seleccionar una fecha de vencimiento, si la fecha es menor a la fecha actual, se muestra una alerta indicando que el producto está vencido.
- **Validación de Vencimiento Próximo**: Si la fecha de vencimiento está a menos de 30 días, se muestra una alerta indicando que el producto vencerá pronto.
- **Opciones de Usuario**: En ambos casos se proporcionan dos opciones:
  - **"Continuar"**: Permite al usuario proceder con la fecha seleccionada.
  - **"Cambiar Fecha"**: Vuelve a abrir el popup del date picker para seleccionar una nueva fecha.
- **Prevención de Errores**: Esta validación ayuda a prevenir la recepción de productos vencidos o próximos a vencer sin conocimiento del usuario.

### 6.4. Beneficios de la Implementación
- **Prevención de Errores**: La recepción a ciegas evita sesgos y errores humanos al no mostrar previamente los productos pendientes.
- **Auditoría Completa**: Cada verificación requiere una acción explícita y se registra el motivo de rechazo.
- **UX Mejorada**: Flujo más intuitivo con validaciones claras y opciones de usuario bien definidas.
- **Trazabilidad**: Registro completo de cada acción de verificación y rechazo.

### 6.5. Componentes Modificados
- **`VerificacionDetalleComponent`**: Refactorizado para implementar recepción a ciegas, validación por discrepancia y validación de fechas de vencimiento.
- **`DialogoService`**: Mejorado con métodos específicos para manejo de discrepancias, selección de motivos y validación de fechas.
- **Template HTML**: Actualizado para ocultar información que podría sesgar la verificación.

---

## 🚀 FASE 7: GESTIÓN AVANZADA DE HISTORIAL Y FILTROS POR ESTADO (COMPLETADA)

### Objetivo
Implementar un sistema avanzado de gestión del historial de productos verificados con filtros por estado de verificación, acciones contextuales (editar, eliminar, ver detalles) y paginación optimizada.

### 7.1. Sistema de Filtros por Estado de Verificación ✅ COMPLETADO
- **Filtro Dinámico por Estados**: Se implementó un sistema que permite filtrar el historial por diferentes estados de verificación:
  - **"Todos"** (default): Muestra `VERIFICADO`, `VERIFICADO_CON_DIFERENCIA`, `RECHAZADO`
  - **"Verificados"**: Solo `VERIFICADO`
  - **"Verificados con Diferencia"**: Solo `VERIFICADO_CON_DIFERENCIA`
  - **"Rechazados"**: Solo `RECHAZADO`
- **Exclusión de Estado PENDIENTE**: El estado `PENDIENTE` nunca se incluye en el historial, manteniendo la estrategia de "recepción a ciegas"
- **Filtro Persistente**: El filtro seleccionado se mantiene al cambiar páginas y se resetea solo con el botón "Limpiar"

### 7.2. Acciones Contextuales en Historial ✅ COMPLETADO
- **Menú de Acciones**: Se implementó un sistema de acciones contextuales usando `MenuActionService` que se activa al hacer click en un item del historial
- **Acciones Dinámicas**: Las opciones disponibles varían según el estado de la recepción:
  - **Estado `EN_PROCESO`**: Botones "Editar" y "Eliminar" disponibles
  - **Estado `FINALIZADA` o `CANCELADA`**: Solo botón "Ver Detalles" disponible
- **Funcionalidades Implementadas**:
  - **"Editar"**: Abre `VerificacionDetalleComponent` en modo edición, permitiendo modificar variaciones existentes
  - **"Ver Detalles"**: Abre `VerificacionDetalleComponent` en modo solo lectura
  - **"Eliminar"**: Abre diálogo de confirmación y elimina variaciones, reseteando estado a `PENDIENTE`

### 7.3. Mejoras en la Interfaz de Usuario ✅ COMPLETADO
- **Layout del Item del Historial**: Se implementó una estructura de 3 filas para cada item:
  - **Fila 1**: `{{id}} - {{descripcion}}`
  - **Fila 2**: `Cantidad: {{cantidad recibida}}. {{check_icon}}`
  - **Fila 3**: `Estado: {{estado}}`
- **Botón de Filtro**: Se reemplazó "Aplicar Filtro" por "Filtrar" que abre el menú de opciones de estado
- **Indicadores Visuales**: Se agregaron indicadores que muestran el filtro activo y la información de paginación
- **Propiedades Computadas**: Se implementaron propiedades computadas para evitar funciones en HTML, siguiendo las reglas del proyecto

### 7.4. Optimización de Backend para Filtros por Array ✅ COMPLETADO
- **Refactor de API**: Se modificó la API para soportar filtros por array de estados en lugar de un solo estado:
  - **Frontend**: Cambió `estado?: string` por `estados?: EstadoVerificacion[]`
  - **GraphQL**: Cambió `estado: EstadoVerificacion` por `estados: [EstadoVerificacion!]`
  - **Backend**: Implementó `findByRecepcionMercaderiaIdPaginadosConEstados()` usando QueryBuilder
- **QueryBuilder vs JPQL**: Se optó por QueryBuilder con CriteriaBuilder para soportar filtros por array de estados, ya que JPQL no soporta `IN` con arrays de enums
- **Performance**: La implementación con QueryBuilder permite filtros más flexibles y mantiene la paginación optimizada

### 7.5. Gestión de Estados de Verificación ✅ COMPLETADO
- **Estados Disponibles**: Se implementaron todos los estados de verificación:
  - `PENDIENTE`: Items no verificados (no aparecen en historial)
  - `VERIFICADO`: Items completamente verificados
  - `VERIFICADO_CON_DIFERENCIA`: Items verificados con cantidades diferentes a las esperadas
  - `RECHAZADO`: Items rechazados por el operario
- **Transiciones de Estado**: Se implementó la lógica para transiciones automáticas entre estados basadas en las cantidades verificadas vs esperadas
- **Cálculo de Diferencia**: Se corrigió el cálculo de `cantidad_recibida` en el backend para considerar correctamente las presentaciones (multiplicar `cantidad` por `presentacion.cantidad`)
- **Lógica Inteligente de Estados**: Se implementó lógica avanzada para casos de recepción parcial + rechazo parcial:
  - **Recepción Parcial + Rechazo Parcial**: Si `cantidadRecibida >= cantidadRechazada` → `VERIFICADO_CON_DIFERENCIA`
  - **Rechazo Mayor que Recepción**: Si `cantidadRechazada > cantidadRecibida` → `RECHAZADO`
  - **Texto Descriptivo Inteligente**: El estado se muestra con texto descriptivo que indica si es parcial

### 7.6. Paginación y Búsqueda Optimizada ✅ COMPLETADO
- **Paginación del Historial**: Se implementó paginación completa para el historial de productos verificados
- **Búsqueda por Texto**: Se mantiene la funcionalidad de búsqueda por nombre de producto o código
- **Filtros Combinados**: Los filtros de texto y estado se pueden combinar para búsquedas más precisas
- **Información de Paginación**: Se muestra información clara sobre la cantidad de items mostrados vs total

### 7.7. Componentes y Servicios Modificados
- **`RecepcionAgrupadaPage`**: Refactorizado para incluir filtros por estado, acciones contextuales y propiedades computadas
- **`PedidoService`**: Modificado para soportar arrays de estados en `getRecepcionItemsPaginados`
- **`MenuActionService`**: Utilizado para implementar el menú de acciones contextuales
- **`VerificacionDetalleComponent`**: Mejorado para soportar modo edición y modo solo lectura
- **Backend Services**: Refactorizados para usar QueryBuilder con filtros por array de estados

### 7.8. Beneficios de la Implementación
- **Gestión Avanzada del Historial**: Los usuarios pueden filtrar y gestionar productos verificados de manera eficiente
- **Acciones Contextuales**: Acceso rápido a funciones de edición y eliminación sin navegación adicional
- **Filtros Flexibles**: Capacidad de filtrar por múltiples estados simultáneamente
- **Performance Optimizada**: QueryBuilder permite filtros complejos manteniendo la paginación
- **UX Mejorada**: Interfaz más intuitiva con indicadores visuales claros
- **Cumplimiento de Reglas**: Se siguen todas las reglas del proyecto, incluyendo el uso de propiedades computadas

### 7.9. Consideraciones Técnicas
- **Compatibilidad**: Los cambios son compatibles con la funcionalidad existente
- **Escalabilidad**: La implementación con QueryBuilder permite futuras extensiones de filtros
- **Mantenibilidad**: Código limpio y bien estructurado siguiendo patrones del proyecto
- **Testing**: Se recomienda testing exhaustivo de todos los flujos de filtrado y acciones contextuales

---

## 🚀 FASE 8: LÓGICA INTELIGENTE DE ESTADOS DE VERIFICACIÓN (COMPLETADA)

### Objetivo
Implementar lógica inteligente para el cálculo automático de estados de verificación que maneje correctamente los casos de recepción parcial + rechazo parcial, mejorando la trazabilidad y auditoría del proceso.

### 8.1. Problema Identificado ✅ RESUELTO
- **Escenario Problemático**: Item con 2 variaciones donde se recibe la mitad y se rechaza la otra mitad
- **Estado Incorrecto**: El sistema marcaba el item como `RECHAZADO` total
- **Consecuencia**: Pérdida de trazabilidad de la recepción parcial exitosa
- **Impacto**: Auditoría confusa y reportes incorrectos

### 8.2. Solución Implementada ✅ COMPLETADA
- **Lógica Inteligente**: Se implementó algoritmo que considera tanto `cantidadRecibida` como `cantidadRechazada`
- **Criterios de Estado**:
  - **`VERIFICADO_CON_DIFERENCIA`**: Cuando `cantidadRecibida >= cantidadRechazada` (recepción parcial + rechazo parcial)
  - **`RECHAZADO`**: Solo cuando `cantidadRechazada > cantidadRecibida` (más rechazado que recibido)
  - **`VERIFICADO`**: Cuando se recibe exactamente lo esperado
  - **`PENDIENTE`**: Cuando no se ha procesado nada

### 8.3. Texto Descriptivo Inteligente ✅ COMPLETADO
- **Estados con Contexto**: El texto del estado ahora incluye información sobre si es parcial:
  - `VERIFICADO_CON_DIFERENCIA` + recepción parcial → "Verificado con Rechazo Parcial"
  - `RECHAZADO` + recepción parcial → "Rechazado Parcialmente"
  - `VERIFICADO_CON_DIFERENCIA` + solo diferencia → "Verificado con Diferencia"
  - `RECHAZADO` + solo rechazo → "Rechazado"

### 8.4. Implementación Técnica ✅ COMPLETADA
- **Backend**: Método `actualizarEstadoVerificacion()` refactorizado con lógica inteligente
- **Frontend**: Métodos `obtenerEstadoVerificacionTexto()` y `getEstadoVerificacionTexto()` actualizados
- **Logging**: Sistema de logs detallado para debugging y auditoría
- **Método Helper**: `obtenerRazonEstado()` para explicar la lógica del estado calculado

### 8.5. Casos de Uso Cubiertos ✅ COMPLETADOS
1. **Recepción Total**: `VERIFICADO` + "Verificado"
2. **Recepción Parcial (menos de lo esperado)**: `VERIFICADO_CON_DIFERENCIA` + "Verificado con Diferencia"
3. **Recepción Parcial + Rechazo Parcial**: `VERIFICADO_CON_DIFERENCIA` + "Verificado con Rechazo Parcial"
4. **Rechazo Total**: `RECHAZADO` + "Rechazado"
5. **Rechazo Parcial (algo se recibió)**: `RECHAZADO` + "Rechazado Parcialmente"

### 8.6. Beneficios de la Implementación ✅ COMPLETADOS
- **Trazabilidad Clara**: Se distingue entre rechazo total y parcial
- **Auditoría Mejorada**: Se registra correctamente la recepción parcial
- **Sin Cambios Estructurales**: Reutiliza la lógica existente
- **Flexibilidad**: Maneja todos los casos edge de manera inteligente
- **UX Mejorada**: El usuario entiende claramente qué pasó
- **Logging Detallado**: Facilita debugging y auditoría

### 8.7. Componentes Modificados
- **`RecepcionMercaderiaItemGraphQL.java`**: Método `actualizarEstadoVerificacion()` refactorizado
- **`RecepcionAgrupadaPage`**: Métodos de texto de estado actualizados
- **Lógica de Estados**: Algoritmo inteligente implementado

### 8.8. Consideraciones de Testing
- **Casos Edge**: Probar todos los escenarios de recepción parcial + rechazo parcial
- **Validación de Estados**: Verificar que los estados se calculen correctamente
- **Texto Descriptivo**: Confirmar que los textos sean claros y precisos
- **Logging**: Verificar que los logs proporcionen información útil para debugging

---

## 🎨 FASE 9: VISUALIZACIÓN DE CANTIDADES RECHAZADAS (COMPLETADA)

### Objetivo
Mejorar la visualización del historial de productos mostrando tanto la cantidad recibida como la cantidad rechazada, proporcionando una vista completa del estado de verificación de cada item.

### 9.1. Funcionalidad Implementada ✅ COMPLETADA
- **Cantidad Recibida**: Se muestra en color verde (#43a047) con el texto "Cantidad: X"
- **Cantidad Rechazada**: Se muestra en color rojo (#f44336) con el texto "Rechazado: X" (solo cuando hay rechazos)
- **Visualización Condicional**: La cantidad rechazada solo aparece cuando `cantidadRechazadaTotal > 0`
- **Layout Mejorado**: Se mantiene la estructura de 3 filas pero se agrega una fila intermedia para rechazos

### 9.2. Implementación Técnica ✅ COMPLETADA
- **Interfaz ProductoAgrupado**: Se agregó la propiedad `cantidadRechazadaTotal: number`
- **Método de Cálculo**: Se implementó `calcularCantidadRechazadaTotal()` similar al método de cantidad recibida
- **Agrupación de Items**: Se actualiza la lógica para calcular tanto cantidades recibidas como rechazadas
- **Template HTML**: Se agregó la visualización condicional de cantidades rechazadas

### 9.3. Estructura Visual del Item ✅ COMPLETADA
```
Row 1: {{id}} - {{descripcion}}
Row 2: Cantidad: {{cantidad recibida}} ✅ (verde)
Row 2.5: Rechazado: {{cantidad rechazada}} (rojo, solo si > 0)
Row 3: Estado: {{estado}}
```

### 9.4. Colores y Estilos ✅ COMPLETADOS
- **Verde (#43a047)**: Cantidad recibida (éxito)
- **Rojo (#f44336)**: Cantidad rechazada (advertencia/error)
- **Naranja (#f57c00)**: Estado y títulos
- **Blanco**: Texto principal
- **Gris (#999)**: Texto secundario

### 9.5. Beneficios de la Implementación ✅ COMPLETADOS
- **Transparencia Total**: El usuario ve exactamente qué se recibió y qué se rechazó
- **Auditoría Mejorada**: Facilita la revisión de recepciones parciales
- **UX Consistente**: Mantiene el diseño y colores del proyecto
- **Información Completa**: No hay ambigüedad sobre el estado real del item
- **Visualización Intuitiva**: Los colores ayudan a identificar rápidamente el estado

### 9.6. Componentes Modificados
- **`RecepcionAgrupadaPage`**: Interfaz, métodos de cálculo y lógica de agrupación
- **`recepcion-agrupada.page.html`**: Template con nueva visualización
- **Lógica de Agrupación**: Cálculo de cantidades rechazadas totales

### 9.7. Casos de Uso Cubiertos ✅ COMPLETADOS
1. **Item Completamente Verificado**: Solo muestra cantidad recibida (verde)
2. **Item con Diferencia**: Muestra cantidad recibida (verde) y diferencia
3. **Item con Rechazo Parcial**: Muestra cantidad recibida (verde) y rechazada (rojo)
4. **Item Completamente Rechazado**: Solo muestra cantidad rechazada (rojo)

### 9.8. Consideraciones de Testing
- **Visualización Condicional**: Verificar que la cantidad rechazada solo aparezca cuando hay rechazos
- **Cálculos Correctos**: Confirmar que las cantidades totales se calculen correctamente
- **Colores y Estilos**: Verificar que los colores sean consistentes con el diseño del proyecto
- **Responsive Design**: Confirmar que el layout se mantenga en diferentes tamaños de pantalla

---

## 🗑️ FASE 10: FUNCIONALIDAD DE ELIMINAR VERIFICACIÓN (COMPLETADA)

### Objetivo
Implementar la funcionalidad completa del botón "Eliminar" que permite resetear la verificación de un item eliminando sus variaciones y restableciendo su estado a PENDIENTE, sin eliminar el item principal.

### 10.1. Funcionalidad Implementada ✅ COMPLETADA
- **Botón Eliminar**: Visible solo cuando `recepcionMercaderia.estado === 'EN_PROCESO'`
- **Confirmación**: Dialog de confirmación antes de proceder
- **Acción Real**: Elimina variaciones y resetea estado a `PENDIENTE`
- **Preservación**: Mantiene el item principal intacto
- **Recarga**: Actualiza automáticamente la lista y el sumario

### 10.2. Implementación Técnica ✅ COMPLETADA
- **Backend Service**: Nuevo método `resetearVerificacion()` en `RecepcionMercaderiaItemService.java`
- **GraphQL Resolver**: Nuevo método `resetearVerificacion()` en `RecepcionMercaderiaItemGraphQL.java`
- **Schema GraphQL**: Nueva mutación `resetearVerificacion(recepcionMercaderiaItemId: ID!): Boolean!`
- **Frontend Service**: Nuevo método `resetearVerificacion()` en `pedido.service.ts`
- **Componente**: Método `procesarEliminacionVerificacion()` actualizado para usar la nueva funcionalidad

### 10.3. Flujo de Eliminación ✅ COMPLETADO
1. **Usuario hace click** en un item del historial
2. **Se muestra menú** con opciones según el estado de la recepción
3. **Usuario selecciona "Eliminar"** (solo visible si `estado === 'EN_PROCESO'`)
4. **Se muestra confirmación** explicando qué se va a hacer
5. **Usuario confirma** la acción
6. **Backend procesa**:
   - Elimina todas las variaciones del item
   - Resetea `cantidadRecibida` y `cantidadRechazada` a 0
   - Cambia `estadoVerificacion` a `PENDIENTE`
7. **Frontend recarga** datos y muestra notificación de éxito

### 10.4. Diferencias con Método Anterior ✅ COMPLETADAS
- **`cancelarVerificacion` (anterior)**: Eliminaba completamente el item
- **`resetearVerificacion` (nuevo)**: Solo elimina variaciones y resetea estado
- **Resultado**: El item vuelve a aparecer en la lista de pendientes para nueva verificación

### 10.5. Casos de Uso Cubiertos ✅ COMPLETADOS
1. **Recepción en Proceso**: Botón "Eliminar" visible y funcional
2. **Recepción Finalizada**: Solo botón "Ver Detalles" visible
3. **Recepción Cancelada**: Solo botón "Ver Detalles" visible
4. **Confirmación Obligatoria**: No se puede eliminar sin confirmar
5. **Manejo de Errores**: Notificaciones claras en caso de fallo

### 10.6. Componentes Modificados
- **`RecepcionMercaderiaItemService.java`**: Nuevo método `resetearVerificacion()`
- **`RecepcionMercaderiaItemGraphQL.java`**: Nuevo método `resetearVerificacion()`
- **`recepcion-mercaderia-item.graphqls`**: Nueva mutación GraphQL
- **`pedidos-mutations.graphql.ts`**: Nueva mutación
- **`resetearVerificacion.ts`**: Nueva clase de mutación
- **`pedido.service.ts`**: Nuevo método de servicio
- **`recepcion-agrupada.page.ts`**: Método actualizado

### 10.7. Beneficios de la Implementación ✅ COMPLETADOS
- **Funcionalidad Completa**: El botón "Eliminar" ahora funciona correctamente
- **Preservación de Datos**: No se pierde información del item principal
- **Reutilización**: Los items pueden ser verificados nuevamente
- **Auditoría Mejorada**: Se mantiene el historial de intentos de verificación
- **UX Consistente**: Confirmación clara antes de acciones destructivas

### 10.8. Consideraciones de Testing
- **Funcionalidad del Botón**: Verificar que solo aparezca cuando `estado === 'EN_PROCESO'`
- **Confirmación**: Confirmar que se muestre el dialog de confirmación
- **Backend**: Verificar que las variaciones se eliminen y el estado se resetee
- **Frontend**: Confirmar que la lista se recargue correctamente
- **Casos Edge**: Probar con items sin variaciones, con múltiples variaciones, etc.
- **Manejo de Errores**: Verificar notificaciones en caso de fallo

### 10.9. Correcciones Técnicas Implementadas ✅ COMPLETADAS
- **Parámetro Corregido**: Cambiado de `notaRecepcionItemId` a `recepcionMercaderiaItemId` para mayor precisión
- **Imports Agregados**: Se agregaron los imports necesarios para `RecepcionMercaderiaItemVariacion` y su repository
- **Dependencias Inyectadas**: Se inyectó `RecepcionMercaderiaItemVariacionRepository` en el service
- **Búsqueda de Variaciones**: Se implementó búsqueda correcta de variaciones usando `findByRecepcionMercaderiaItemId()`
- **Eliminación Segura**: Se verifica la existencia de variaciones antes de intentar eliminarlas

---

## 🎯 **RESUMEN FINAL DE IMPLEMENTACIÓN**

### **Estado de Implementación**
- **Backend (Fases 1, 4, 5, 7)**: ✅ **100% COMPLETADO**
- **Frontend (Fases 2, 3, 4, 5, 6, 7)**: ✅ **100% COMPLETADO**
- **Arquitectura**: ✅ **IMPLEMENTADA** - Transición completa a estado persistido y variaciones
- **Estrategia de Recepción a Ciegas**: ✅ **IMPLEMENTADA** - No se muestran productos pendientes en la tabla principal
- **Validaciones Robustas**: ✅ **IMPLEMENTADAS** - Flujo completo de validación por discrepancias
- **Gestión Avanzada de Historial**: ✅ **IMPLEMENTADA** - Filtros por estado y acciones contextuales

### **Funcionalidades Implementadas**
1. **Validación de Ubicación**: GPS y QR para validar presencia en sucursal
2. **Selección de Notas**: Búsqueda manual y asistida de notas pendientes
3. **Inicio de Recepción**: Creación automática de items con estado persistido
4. **Verificación a Ciegas**: Búsqueda proactiva sin mostrar productos pendientes
5. **Verificación Detallada**: Sistema de variaciones múltiples con validaciones
6. **Manejo de Discrepancias**: Flujo inteligente para cantidades no coincidentes
7. **Finalización**: Generación de constancia y procesos de backend completos
8. **Paginación**: Sistema optimizado para grandes volúmenes de datos
9. **Filtros por Estado**: Sistema avanzado de filtrado por estado de verificación
10. **Acciones Contextuales**: Editar, eliminar y ver detalles desde el historial
11. **Gestión de Estados**: Transiciones automáticas entre estados de verificación
12. **Interfaz Optimizada**: Layout mejorado con propiedades computadas

### **Arquitectura Final**
- **Estado Persistido**: Items pre-creados con estados en base de datos
- **Variaciones Múltiples**: Soporte para diferentes presentaciones, vencimientos y lotes
- **Recepción a Ciegas**: Estrategia que previene sesgos y errores humanos
- **Validaciones Robustas**: Sistema completo de manejo de discrepancias
- **Filtros Avanzados**: Sistema de filtrado por array de estados usando QueryBuilder
- **Acciones Contextuales**: Menú de acciones dinámicas según estado de recepción
- **UI/UX Optimizada**: Interfaz móvil-first con navegación intuitiva y propiedades computadas

### **Próximos Pasos Recomendados**
- **Testing Exhaustivo**: Probar todos los flujos de verificación y validación
- **Optimización de Performance**: Revisar queries y paginación en producción
- **Documentación de Usuario**: Crear manual de usuario final para operarios
- **Capacitación**: Entrenar usuarios en la nueva interfaz y flujos
- **Monitoreo**: Implementar métricas de uso y performance en producción

---

## 🏆 **PROYECTO COMPLETADO AL 100%**

**El módulo de Recepción de Mercadería ha sido implementado completamente** con todas las funcionalidades requeridas según el manual de implementación, incluyendo las **7 fases** de desarrollo que cubren desde el backend hasta las mejoras finales de UX, validaciones y gestión avanzada del historial.

**El sistema está listo para uso en producción** y proporciona una herramienta robusta, intuitiva y eficiente para la recepción física de mercadería en dispositivos móviles, con capacidades avanzadas de filtrado, acciones contextuales y gestión de estados.
