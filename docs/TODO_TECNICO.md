# TODO técnico — irregularidades detectadas

Hallazgos encontrados durante la documentación completa del repo (Olas 1-4). **Nada de esto está arreglado**: se documentó el comportamiento tal como es y se difirió la corrección para después de cerrar la documentación.

Cada ítem indica dónde está, qué pasa, por qué importa y el riesgo de tocarlo.

**Leyenda de severidad:**
- 🔴 **Alta** — puede causar pérdida de datos, error silencioso en producción o bloqueo de usuario
- 🟡 **Media** — bug real con impacto acotado, o deuda que causa errores recurrentes de desarrollo
- 🟢 **Baja** — limpieza, consistencia, código muerto

---

## 🔴 Alta

### 1. `onGetByFecha` calcula mal la fecha por defecto

**Dónde:** `src/app/generic/generic-crud.service.ts:401-402`

```ts
let hoy = new Date();
let ayer = new Date(hoy.getDay() - 1);   // getDay() = día de la SEMANA (0-6)
```

`getDay()` devuelve el día de la semana, no el del mes. `new Date(0..6)` produce una fecha de **1970**. Solo afecta al caso `inicio == null && fin == null`.

**Riesgo de tocarlo:** hay que revisar todos los llamadores. Si alguna pantalla depende hoy del rango degenerado (que en la práctica trae "todo el histórico"), corregirlo cambia lo que muestra. Auditar antes de arreglar.

**Fix propuesto:** `const ayer = new Date(hoy); ayer.setDate(hoy.getDate() - 1); ayer.setHours(0,0,0,0);`

---

### 2. Los observables de `GenericCrudService` no completan ni propagan errores

**Dónde:** `src/app/generic/generic-crud.service.ts`, todos los métodos salvo `onCustomSave`

Ningún método llama `obs.complete()`. En caso de error, muestran el toast genérico "Ups!! Algo salió mal" y **no emiten nada** — ni `next` ni `error`.

**Consecuencias:**
- `.toPromise()`, `firstValueFrom()` o `await` sobre esas llamadas **quedan colgados para siempre** si el backend falla.
- Toda suscripción queda viva hasta que el componente se destruya; sin `untilDestroyed` hay fuga.
- El llamador no puede distinguir "sin resultados" de "falló".

**Riesgo de tocarlo:** alto por volumen. Agregar `complete()` es seguro; agregar `obs.error()` cambia el flujo de control de decenas de pantallas que hoy no tienen `error` handler y empezarían a romper con excepciones no capturadas.

**Fix propuesto:** por etapas. Primero `complete()` en todos. Después, migrar pantalla por pantalla a un método nuevo que sí propague error, sin tocar los existentes.

---

### 3. El update in-app es forzado y corre cada 50 segundos

**Dónde:** `src/app/app.component.ts:128-129,135-146`

```ts
this.searchUpdate();
this.intervalID = setInterval(this.searchUpdate, 50000); // comentario dice "5 seconds", real: 50s
```

Si Play Store reporta una versión nueva, dispara `performImmediateUpdate()` — el flujo **bloqueante** — sin preguntar. Puede interrumpir al usuario en medio de una venta, un conteo de inventario o un cierre de caja.

**Fix propuesto:** usar `startFlexibleUpdate()` (descarga en segundo plano) y ofrecer `completeFlexibleUpdate()` cuando el usuario esté en una pantalla segura. Alternativamente, mantener el inmediato pero suprimirlo mientras haya una operación abierta. Corregir además el comentario.

---

### 4. `logOut()` persiste el string `"null"` en vez de limpiar las claves

**Dónde:** `src/app/services/login.service.ts:240-241`

```ts
localStorage.setItem('token', null);      // guarda la cadena "null"
localStorage.setItem('usuarioId', null);
```

Todo lector debe comparar contra `null` **y** contra `'null'`. El mismo patrón obliga al triple chequeo de `app.module.ts:53-67` para `serverIp`. `ChangeServerIpDialogComponent` repite el error.

**Fix propuesto:** `localStorage.removeItem(...)` en ambos lugares, y simplificar los chequeos defensivos una vez que no queden escrituras de `"null"`.

---

## 🟡 Media

### 5. `ProductoInput.tiempoGarantia` tipado como `boolean`

**Dónde:** `src/app/domains/productos/producto.model.ts`

`Producto.tiempoGarantia` es `number` (días de garantía) pero `ProductoInput.tiempoGarantia` está declarado `boolean`. TypeScript no ayuda a detectar el error en el punto de uso.

**Fix propuesto:** cambiar a `number`. Verificar antes qué manda hoy el formulario de producto.

---

### 6. `toInput()` pierde campos silenciosamente

**Dónde:** patrón general en `src/app/domains/`, ejemplo claro en `personas/usuario.model.ts:15-23`

`Usuario.toInput()` no propaga `email`, `avatar`, `roles` ni `creadoEn`. Si el backend interpreta la ausencia como borrado, una edición parcial destruye datos.

**Fix propuesto:** auditar cada `toInput()` contra el input real que espera el backend. Documentar en cada modelo qué campos quedan fuera a propósito.

---

### 7. Cuatro módulos son lazy y eager al mismo tiempo

**Dónde:** `src/app/app.module.ts:120-125` vs `src/app/app-routing.module.ts`

`InventarioModule`, `TransferenciasModule`, `ProductoModule` y `FuncionarioModule` están declarados con `loadChildren` en el router **y** importados en `AppModule`. La importación eager gana: entran al bundle inicial y el lazy loading no aporta nada.

**Causa:** `AppModule` declara componentes que dependen de piezas de esos módulos (`StockPorSucursalDialogComponent`, `HomeComponent`).

**Fix propuesto:** extraer las dependencias compartidas a un módulo común y sacar los cuatro del `imports`. Medir el tamaño del bundle inicial antes y después.

---

### 8. `@capacitor/preferences` se escribe pero nunca se lee

**Dónde:** `src/app/components/change-server-ip-dialog/change-server-ip-dialog.component.ts`

El diálogo guarda `serverIp`/`serverPort` en `Preferences` (storage nativo) además de `localStorage`, pero **ningún código lee de `Preferences`**. La intención era sobrevivir a limpiezas del WebView que borran `localStorage`; el paso de lectura nunca se implementó.

**Efecto:** si el WebView limpia `localStorage`, la app vuelve al default de `conectionConfig.ts` en vez de recuperar la IP configurada.

**Fix propuesto:** implementar la lectura en el arranque, antes de que `app.module.ts` calcule las URIs. Requiere cuidado: hoy esas URIs se calculan en carga de módulo, que es síncrona, y `Preferences` es asíncrono.

---

### 9. Dos estilos de chequeo de rol conviviendo, con strings inconsistentes

**Dónde:** templates varios vs `src/app/domains/personas/roles/role.service.ts`

Algunos templates hacen `roles?.includes('VER INVENTARIO')` inline. Los strings usados hoy son `'NUEVO-PRODUCTO'`, `'VER INVENTARIO'` y `'VER TRANSFERENCIA'` — formatos inconsistentes entre sí (guion vs. espacio).

**Fix propuesto:** migrar todo a `RoleService` + enum `ROLES`. Normalizar los nombres exige coordinar con el backend, que es quien los emite.

---

### 10. `marcacionRoute` detecta admin por nickname literal

**Dónde:** `src/app/app.component.ts:399`

```ts
const isAdmin = this.mainService.usuarioActual?.nickname?.toUpperCase() === 'ADMIN';
```

Un usuario con rol de administrador pero otro nickname no obtiene la ruta de admin.

**Fix propuesto:** usar `roleService.tieneRol(roles, ROLES.ADMIN)`.

---

### 11. `descodificarQr` no valida nada

**Dónde:** `src/app/generic/utils/qrUtils.ts`

Hace `split('-')` y asigna posiciones fijas. No verifica el prefijo `frc`, no escapa guiones dentro de los campos (un `data` con guion desplaza todo lo siguiente) y no valida el `timestamp` — un QR viejo es válido para siempre.

**Fix propuesto:** validar prefijo, usar un separador que no aparezca en los datos (o codificar en base64/JSON) y decidir una política de expiración. Cambiar el formato rompe compatibilidad con QR ya impresos: necesita soportar ambos formatos durante una transición.

---

### 12. `comparatorLike` no escapa caracteres especiales

**Dónde:** `src/app/generic/utils/string-utils.ts`

Construye un `RegExp` con la entrada del usuario sin escapar. Un `(`, `[` o `*` puede lanzar excepción.

**Fix propuesto:** escapar la entrada antes de construir el regex.

---

### 13. `npm run lint` y `npm test` están rotos

**Dónde:** `package.json:15-16`

- `ng lint` → `@angular-eslint/builder:lint not found`
- `ng test` → TS2724 por import con typo en `edit-transferenci-producto.component.spec.ts`

**Efecto:** no hay linting ni tests unitarios corriendo en el repo. El único gate es `npm run build`.

**Fix propuesto:** PR dedicado. Instalar el builder de eslint y corregir el spec. Evaluar cuántos specs más fallan una vez que `ng test` arranque.

---

### 14. `ModalService` y `PopOverService` guardan una sola referencia

**Dónde:** `src/app/services/modal.service.ts`, `src/app/services/pop-over.service.ts`

Ambos guardan `currentModal` / `currentPopover` como valor único. Anidar dos modales hace que `closeModal()` cierre el equivocado.

**Fix propuesto:** usar una pila, o devolver siempre la referencia y que el llamador cierre la suya.

---

### 15. `CargandoService.close()` tiene un `setTimeout` de 500 ms

**Dónde:** `src/app/services/cargando.service.ts`

El loading no se cierra al instante. Abrir y cerrar dos loadings seguidos los pisa visualmente. Además `open()` no lleva registro: si se pierde la referencia, el loading queda colgado.

**Fix propuesto:** evaluar por qué está el delay (probablemente evita un parpadeo) y llevar registro de loadings activos para poder cerrarlos todos.

---

## 🟢 Baja

### 16. `src/app/app-update/` es código muerto

**Dónde:** `src/app/app-update/`

`app-update.component.ts:16` hace `throw new Error('Method not implemented.')` en `ngOnInit`. El componente no está declarado en ningún módulo — solo lo referencia su propio `.spec`. Es un resto de la integración con CapacitorUpdater.

**Fix propuesto:** borrar la carpeta completa (componente + spec).

---

### 17. Configuración muerta de `CapacitorUpdater` en `capacitor.config.ts`

**Dónde:** `capacitor.config.ts:12-14`

```ts
CapacitorUpdater: { autoUpdate: true }
```

El plugin `@capgo/capacitor-updater` no está instalado. La config no hace nada y confunde a quien lee el archivo — de hecho fue la causa de que la documentación afirmara durante meses que existía un canal OTA.

**Fix propuesto:** eliminar el bloque. Cambiar `capacitor.config.ts` requiere `cap sync` y release nativo, así que conviene agruparlo con otro cambio nativo.

---

### 18. Código de CapacitorUpdater comentado en `main.ts`

**Dónde:** `src/main.ts:4,9,52,61`

Bloques comentados de la integración OTA descartada.

**Fix propuesto:** borrar. El historial de git conserva la implementación si alguna vez se quiere volver.

---

### 19. Archivo duplicado con nombre de copia

**Dónde:** `src/app/graphql/financiero/venta-credito/count-by-cliente-id copy.ts`

Nombre con `" copy"` — resto de un duplicado accidental.

**Fix propuesto:** verificar si algo lo importa y borrarlo.

---

### 20. `solicitud-gastos` ruteado dos veces

**Dónde:** `src/app/app-routing.module.ts:12` y `src/app/pages/operaciones/operaciones-routing.module.ts`

El mismo módulo se carga desde `/solicitud-gastos` (raíz) y `/operaciones/solicitud-gastos`. El menú usa la ruta hija.

**Fix propuesto:** eliminar la ruta raíz y verificar que ningún deep link ni QR la use.

---

### 21. `MainService.load()` está vacío

**Dónde:** `src/app/services/main.service.ts:25-27`

Se invoca vía `APP_INITIALIZER` pero no hace nada.

**Fix propuesto:** dejarlo como punto de extensión documentado, o quitar el `APP_INITIALIZER` hasta que haga falta.

---

### 22. `MainService.authenticationSub` arranca en `null`

**Dónde:** `src/app/services/main.service.ts`

`BehaviorSubject<boolean>(null)` — el primer valor no es booleano. Los suscriptores que asumen booleano reciben `null`.

**Fix propuesto:** tipar como `BehaviorSubject<boolean | null>` para que TypeScript obligue a manejar el caso, o inicializar en `false` si nadie depende de distinguir "todavía no sé".

---

### 23. `extractCodigoBarra` marcada `@deprecated` pero aún en uso

**Dónde:** `src/app/generic/utils/barcodeUtils.ts:70-74`

**Fix propuesto:** migrar los llamadores a `codigosParaBuscar` y borrarla.

---

### 24. `errorLink` de Apollo es un no-op

**Dónde:** `src/app/app.module.ts:77`

```ts
const errorLink = onError(({ graphQLErrors, networkError }) => { });
```

Cuerpo vacío. No hay manejo global de errores de red ni GraphQL.

**Fix propuesto:** al menos loguear. Idealmente, detectar 401 para forzar re-login y errores de red para alimentar `ServerConnectionService`.

---

### 25. Campos comentados en `Producto` que el input sí acepta

**Dónde:** `src/app/domains/productos/producto.model.ts`

`subfamilia`, `sucursales`, `productoUltimasCompras` y `costo` están comentados en el modelo, pero `ProductoInput` declara `subfamiliaId`. Se puede enviar la subfamilia pero no leerla con tipo.

**Fix propuesto:** completar el modelo con los tipos reales o borrar los comentarios si esos campos ya no existen en el backend.

---

## Cómo usar este archivo

Al arrancar la fase de corrección: convertir cada ítem en un issue, empezando por los 🔴. Los ítems 16-19 son borrado puro y pueden agruparse en un solo PR de limpieza — pero el 17 toca `capacitor.config.ts` y por lo tanto exige release nativo.
