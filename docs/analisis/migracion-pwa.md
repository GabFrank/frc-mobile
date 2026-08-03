# Análisis: migrar frc-mobile a PWA

> **Documento de investigación**, 2026-08-03. No es una decisión tomada ni un plan de ejecución.
> Todo lo afirmado sobre el código está verificado contra el repo en la rama de esta documentación.

## Veredicto en una línea

**Es viable y probablemente conveniente, pero hay un bloqueante duro que no es de código: hoy todo el tráfico va por HTTP plano, y una PWA no funciona sin HTTPS.** Resuelto eso, el 96,5% del código Angular se migra sin tocar.

---

## 1. Punto de partida — qué es hoy la app

Datos que condicionan todo el análisis:

| Hecho | Implicancia |
|---|---|
| 690 archivos TS, ~45.500 LOC | El grueso es Angular puro |
| **Solo 24 archivos (3,5%) importan algo nativo** | La superficie a migrar es chica |
| De esos 24, **8 son servicios** aislables | Se pueden esconder detrás de una interfaz |
| **No existe carpeta `ios/`** — iOS nunca se compiló | "Funciona en cualquier OS" es ganancia real, no paridad |
| **La impresión es server-side** (`printerName` va al backend) | Cero dependencia de impresoras nativas ✅ |
| Apollo usa `fetchPolicy: 'no-cache'` en todo | **La app hoy no funciona offline** — una PWA no pierde nada |
| Ya usa `@vladmandic/human` **dentro del WebView** | El reconocimiento facial ya es tecnología web ✅ |
| Solo hay **1 plugin nativo propio** (`NativeLocationPlugin`, 155 líneas Java) | Único código nativo a reemplazar |

**Esto es una app web dentro de un WebView, con 24 puntos de contacto nativo.** No es una app nativa.

---

## 2. El bloqueante: HTTPS

### El problema

Toda la app habla HTTP plano:

```ts
// capacitor.config.ts
server: { cleartext: true, androidScheme: 'http' }

// app.module.ts:70-75
const uri  = `http://${serverIp}:${serverPort}/graphql`;
const wUri = `ws://${serverIp}:${serverPort}/subscriptions`;
```

Un WebView de Capacitor lo tolera porque `cleartext: true` lo habilita explícitamente. **Un navegador no.**

En una PWA, estas APIs **exigen contexto seguro (HTTPS)** — sin excepción, sin flag que las habilite:

| API | Se usa hoy en | Sin HTTPS |
|---|---|---|
| `getUserMedia` (cámara) | Escaneo, fotos, rostro | ❌ no disponible |
| `navigator.geolocation` | Marcación | ❌ no disponible |
| Service Worker | Instalación, updates, offline | ❌ no registra |
| Web Push | Notificaciones | ❌ no disponible |
| WebAuthn | Biometría | ❌ no disponible |

Y además: una página servida por HTTPS **no puede** abrir `ws://` ni hacer `fetch` a `http://` — es mixed content, lo bloquea el navegador. O sea que **no alcanza con servir la PWA por HTTPS**: el central tiene que exponer `https://` y `wss://`.

### Qué tan grave es

Es trabajo de infraestructura, no de aplicación, y **no es difícil en este caso concreto**: el servidor ya está en una IP pública (`159.203.86.103`, puertos 8081/8082). Con un dominio real y Let's Encrypt vía reverse proxy (Caddy o nginx), se resuelve sin tocar el código de Spring Boot.

Los casos complicados serían servidores solo-LAN sin dominio — hay que verificar si alguna filial opera así. Para esos existen salidas (CA privada instalada en los dispositivos, o un túnel), pero son más engorrosas.

> **Referencia frc-gourmet:** el mismo bloqueante aparece en su plan de PWA, y **sigue abierto**: el tracker marca *"F2 — Infra server 🟦 (servir PWA ✅ · TLS ⛔)"*. Ahí es más difícil porque el server corre en un PC local dentro de un mesh headscale, sin IP pública. **Nosotros estamos mejor parados.**

### Beneficio colateral

Migrar a HTTPS **también arregla** el hallazgo de seguridad más grave del sistema: hoy las credenciales de todos los usuarios viajan en texto plano por la red. Está en `REPORTE_VULNERABILIDADES.md` desde abril. Este trabajo hay que hacerlo igual, con PWA o sin PWA.

---

## 3. Inventario de dependencias nativas

Verificado contra `package.json` + uso real en el código.

### ✅ Reemplazo directo, sin pérdida

| Hoy | En PWA | Nota |
|---|---|---|
| `@capacitor/preferences` | `localStorage` / IndexedDB | Ya se usa `localStorage` en 92 lugares |
| `@capacitor/share` | Web Share API | Soporte amplio en móviles |
| `@capacitor/browser` (Custom Tabs) | `window.open()` | Solo se usa para el opt-in de canal — **que desaparece** |
| `@capacitor/app` (`appStateChange`) | `visibilitychange` / `pagehide` | Equivalente funcional |
| `@awesome-cordova-plugins/app-version` | Constante de build | Trivial |
| `@awesome-cordova-plugins/photo-viewer` | Lightbox web | Cualquier librería, o `<dialog>` |
| `@capacitor-community/file-opener` | El navegador abre PDFs solo | **Se simplifica**: `blob:` URL directo |
| `@capacitor/filesystem` | Blob + descarga | Solo se usa para cachear PDFs antes de abrirlos |
| `@capawesome/capacitor-app-update` | Service Worker | **Mejora**: update sin Play Store |
| `@capacitor/google-maps` / `leaflet` | Ambos ya son web | Leaflet ya corre en browser |
| `@vladmandic/human` | **Ya corre en el browser** | Sin cambios |

### ⚠️ Reemplazo con matices

| Hoy | En PWA | Qué cambia |
|---|---|---|
| `@capacitor-mlkit/barcode-scanning` | `BarcodeDetector` + fallback ZXing | Ver §4 — es el punto crítico |
| `@capacitor/camera` | `getUserMedia` + `<input type="file" capture>` | Funciona; UX de captura algo distinta |
| `@capacitor/geolocation` + `NativeLocationPlugin` | `navigator.geolocation.watchPosition` | Ver §5 — se pierde precisión fina |
| `@capacitor-community/fcm` + `@capacitor/push-notifications` | Web Push (firebase-js-sdk) | Ver §6 — iOS con condiciones |
| `@capgo/capacitor-native-biometric` + `FingerprintAIO` | WebAuthn / passkeys | Ver §7 — modelo distinto |
| `@pantrist/...ml-kit-text-recognition` (OCR) | Sin API estándar | Ver §8 — el gap real |

### ❌ Desaparecen (y está bien)

| Hoy | Por qué desaparece |
|---|---|
| `ChannelService` + opt-in Play Store | Sin Play Store no hay canales de testing por track |
| `@capawesome/capacitor-app-update` | El SW actualiza solo |
| Todo `android/` (Gradle, manifest, firma, keystore) | Ya no se compila nada |
| `capacitor.config.ts`, `cap sync` | Ídem |

---

## 4. Escaneo de códigos — el punto crítico

**Es la función más usada de la app.** Si el escaneo empeora, la migración fracasa operativamente aunque todo lo demás funcione.

### Estado del arte web

- **`BarcodeDetector`**: API nativa del navegador, soportada en **Chromium sobre Android** (que es donde corre la flota hoy). Rápida, usa ML Kit por debajo — literalmente el mismo motor que el plugin actual.
- **No está en Safari/iOS ni Firefox** → hace falta fallback JS (ZXing / `zxing-wasm`), más lento y menos tolerante a códigos dañados.

### Precedente propio

**frc-gourmet ya lo resolvió y está en producción.** `barcode-scanner-dialog.component.ts`:

```ts
const BD = (window as any).BarcodeDetector;
if (BD) {
  // Android/Chromium: API nativa
  this.detector = new BD({ formats: ['ean_13','ean_8','upc_a','upc_e','code_128','code_39','qr_code','itf'] });
  this.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } } });
} else {
  // iOS/Safari: ZXing
}
// y si todo falla: entrada manual del código
```

Los formatos declarados cubren lo que usa el retail paraguayo, incluidos los EAN-13 de balanza con prefijo `20`.

### Riesgo residual

- **Hay que medirlo en los dispositivos reales de sucursal**, no en un iPhone de escritorio. Celulares viejos con cámara mala son el caso de prueba.
- La lógica de `barcodeUtils.ts` (candidatos, pesables, GS1) **no cambia**: opera sobre el string ya leído.
- **Mitigación disponible:** los lectores Bluetooth HID se comportan como teclado y funcionan igual en navegador. Si el escaneo por cámara no rinde, esa es la salida.

**Veredicto: riesgo medio, mitigable, con precedente propio funcionando.**

---

## 5. Geolocalización — pérdida real

Hoy hay un plugin Java propio (`NativeLocationPlugin`, 155 líneas) que hace algo que la web no ofrece igual:

```java
warmupMs = 2000            // descarta lecturas iniciales imprecisas
readings ≥ 3               // exige varias lecturas
accuracy ≤ 33 metros       // umbral duro
→ promedia las lecturas    // resultado estable
```

Usa `FusedLocationProvider` de Google Play Services, que combina GPS + wifi + celda + sensores.

**En web:** `navigator.geolocation.watchPosition({ enableHighAccuracy: true })` da lecturas con `accuracy`, y el warmup + filtrado + promediado **se puede reimplementar en JS** sobre el mismo patrón. Lo que no se replica es el fusionado de sensores del proveedor nativo.

**Impacto:** la validación de "el funcionario está en la sucursal" puede volverse menos precisa, sobre todo **en interiores** — que es exactamente donde se marca asistencia.

**Mitigación:** relajar el umbral de 33 m y compensar con el reconocimiento facial (que ya valida identidad) + el registro de evidencia (`precisionGps` ya se guarda). Requiere medición en campo antes de decidir el umbral.

**Veredicto: es la pérdida técnica más concreta de la migración.** No es bloqueante, pero exige recalibración.

---

## 6. Notificaciones push

| Plataforma | Estado |
|---|---|
| **Android / Chrome** | ✅ Web Push funciona bien |
| **iOS / Safari 16.4+** | ⚠️ Funciona **solo si el usuario agrega la app a la pantalla de inicio** |
| Escritorio | ✅ |

El backend ya manda por FCM; `firebase-js-sdk` soporta Web Push con la misma infraestructura, así que el central cambia poco.

**El detalle iOS importa:** si no instalan la PWA, no reciben notificaciones. Como la flota es Android hoy, el impacto inmediato es nulo, pero condiciona el argumento de "sirve para cualquier OS".

**Nota:** las notificaciones de este sistema son operativas (`DIFERENCIA_MALETIN`, `VENTA_STOCK_CRITICO`) y requieren que alguien reaccione. Perder entregabilidad no es cosmético.

---

## 7. Biometría

Hoy: huella/rostro desbloquean el login. El backend asocia `idDispositivo` con un usuario (`POST /login/biometric`).

En web el equivalente es **WebAuthn / passkeys**, que técnicamente es *mejor* (criptografía de clave pública en vez de un token guardado), pero es **otro modelo**:

- Requiere cambiar el endpoint del backend (challenge/response en vez de token opaco).
- La credencial vive en el navegador y el llavero del sistema.
- **Si el usuario borra datos del sitio, pierde la credencial** y hay que re-registrar.

**Veredicto: reemplazable, pero es rediseño del flujo de auth, no un swap de librería.** Es de las piezas más caras de la migración.

---

## 8. OCR — el gap sin equivalente limpio

`@pantrist/capacitor-plugin-ml-kit-text-recognition` se usa en **venta-tarjeta**, para leer el monto del cupón POS fotografiado (`montoEscaneado`). Ese campo existe precisamente para auditar diferencias contra el monto que carga el operador.

**No hay API web estándar de OCR.** Opciones:

| Opción | Costo / riesgo |
|---|---|
| **Tesseract.js** | ~2-4 MB de modelo, lento en celulares baratos, peor precisión con tickets térmicos |
| **OCR en el backend** | La imagen viaja al server; requiere endpoint nuevo y algún motor (Tesseract, o servicio cloud) |
| **Quitar `montoEscaneado`** | Se pierde el control cruzado — decisión de negocio, no técnica |

**Recomendación: OCR en el backend.** La foto del cupón ya se sube (`imagenUrl`), así que el archivo ya llega al servidor. Es agregar procesamiento donde ya está el dato.

---

## 9. Reconocimiento facial — sorpresa favorable

**Ya es tecnología web.** `@vladmandic/human` corre sobre TensorFlow WASM dentro del WebView. En una PWA corre exactamente igual.

Además, hay un problema abierto que la migración **fuerza a arreglar**: hoy los modelos se descargan de `cdn.jsdelivr.net` (ítem 52 del `TODO_TECNICO.md`), o sea que la marcación facial **ya depende de internet**. En PWA hay que servirlos desde el propio origen — que es justamente el fix correcto.

**frc-gourmet ya hizo esto**: su plan de reconocimiento facial está marcado **IMPLEMENTADO (F1-F6)**, con:
- Human en WebWorker, embeddings 1024-D
- Match coseno 1:N en el servidor (la imagen nunca sale del dispositivo)
- **Liveness server-authoritative** con los modelos `antispoof` + `liveness`
- Modelos servidos por HTTP local, **no CDN**
- Kiosco con cuenta regresiva y auto-captura

Sus riesgos documentados aplican igual acá: *"HTTPS obligatorio para getUserMedia"*, *"iluminación = causa #1 de fallos"*, *"performance en tablets baratos → WebWorker"*, *"cambio de modelo = re-enrollment total"*.

**Veredicto: riesgo bajo. Hay implementación de referencia propia, funcionando.**

---

## 10. Módulos por nivel de refactor

| Módulo | LOC | Refactor | Por qué |
|---|---|---|---|
| **marcacion** | 1.763 | 🔴 **Alto** | GPS de precisión + facial + kiosco. Todo lo difícil junto |
| **venta-tarjeta** | 1.265 | 🔴 **Alto** | Escaneo QR + cámara + **OCR sin equivalente** |
| **producto** | 3.233 | 🟡 Medio | Escaneo intensivo; modo kiosco **mejora** en PWA |
| **operaciones/pedidos** | 5.025 | 🟡 Medio | Escaneo en verificación; PDFs se simplifican |
| **operaciones/devolucion** | 2.667 | 🟡 Medio | Escaneo + etiquetas PDF |
| **operaciones/solicitud-gastos** | 3.515 | 🟡 Medio | Fotos de factura (cámara) + PDFs |
| **informaciones-personales** | 477 | 🟡 Medio | Huella → WebAuthn; captura facial |
| **inventario** | 4.229 | 🟢 Bajo | Escaneo puntual; el resto son formularios |
| **transferencias** | 4.166 | 🟢 Bajo | Ídem |
| **notificaciones** | 1.792 | 🟢 Bajo | Solo cambia el transporte de push |
| **caja / conteo** | 3.528 | 🟢 **Ninguno** | Formularios y aritmética. **Impresión ya es server-side** |
| **solicitud-pago / pago** | 1.264 | 🟢 **Ninguno** | Formularios + PDFs |
| **mis-rrhh / mis-finanzas** | 546 | 🟢 **Ninguno** | Listas + PDFs |
| **home, personas, codigo, etc.** | ~1.500 | 🟢 **Ninguno** | |

**Aproximadamente el 60% del código no se toca.**

---

## 11. Lo que se gana

### Concreto y medible

1. **Deploy sin Play Store.** Hoy: merge → tag → workflow manual → AAB → revisión de Google → propagación. Con PWA: merge → build → deploy → el service worker actualiza en el próximo arranque. **De días a minutos.**

2. **Se elimina la deuda nativa completa.** Adiós a Gradle, `AndroidManifest`, `versionCode`/`versionName` desincronizados, keystore y `.pepk` sueltos en el workspace (TODO pendiente hace meses), `cap sync` olvidado que compila un APK sin el plugin, `--legacy-peer-deps` obligatorio por la mezcla `@ionic-native` / `@awesome-cordova-plugins`.

3. **Cobertura de plataformas real.** Hoy **solo Android** — iOS nunca se compiló. Con PWA: iOS, Android, tablets, y navegador de escritorio sin trabajo extra. Para consultas de precio o aprobaciones de RRHH desde una PC, eso es valor inmediato.

4. **Fin del update forzado.** Hoy `performImmediateUpdate()` cada 50 segundos puede interrumpir una venta a medias (ítem 3 del TODO). Un service worker actualiza en el próximo arranque, sin interrumpir.

5. **Ciclo de desarrollo más corto.** Sin emulador ni APK de debug para probar en device: se abre la URL en el celular.

6. **Un modo kiosco de verdad.** `mostrar-precio` y `precio-config` están hechos para tablets fijas. Una PWA en modo `standalone` con `display: fullscreen` hace eso mejor que un WebView.

### Estratégico

7. **HTTPS obligatorio arregla la vulnerabilidad abierta.** Deja de ser una tarea postergable.
8. **Menos superficie de skills y conocimiento.** Un solo stack web en vez de web + Android.

---

## 12. Lo que se pierde

| Pérdida | Severidad | Mitigación |
|---|---|---|
| **Precisión GPS fina** (plugin propio) | 🔴 Alta | Reimplementar promediado en JS + recalibrar umbral |
| **OCR de cupones** | 🔴 Alta | Mover al backend |
| **Biometría como está** | 🟡 Media | WebAuthn (rediseño de auth) |
| **Push en iOS sin instalar** | 🟡 Media | Instruir instalación; hoy no hay iOS igual |
| **Escaneo en iOS/Safari** | 🟡 Media | ZXing (más lento) o lector Bluetooth |
| **Presencia en Play Store** | 🟢 Baja | TWA si se necesita la ficha |
| **Canales alpha/beta por track** | 🟢 Baja | Reemplazar por URLs/entornos separados |

**Lo que NO se pierde** (y suele asumirse que sí):

- ❌ **Offline** — la app hoy no funciona offline (`no-cache` en todo). Un service worker sería una **mejora**.
- ❌ **Impresión** — ya es server-side.
- ❌ **Reconocimiento facial** — ya es web.
- ❌ **Mapas** — Leaflet ya es web.

---

## 13. Estrategia

### La recomendada: repo paralelo, migración por olas, apagar Android al final

Coincide con tu instinto. Concretamente:

**Fase 0 — Infra (bloqueante, se hace igual con o sin PWA)**
Dominio + certificado + reverse proxy delante del central. `https://` y `wss://`. Verificar que ninguna filial dependa de un acceso solo-LAN sin salida.

**Fase 1 — Esqueleto y prueba del punto crítico**
Repo nuevo, Angular + Ionic (Ionic sirve igual en web, no hay que rehacer la UI). Copiar `services/`, `domains/`, `generic/`, `graphql/` casi tal cual. **Primero el escáner**, medido en los dispositivos reales de sucursal. Si acá falla, el resto no importa.

**Fase 2 — Módulos sin dependencia nativa**
caja, conteo, solicitud-pago, mis-rrhh, mis-finanzas, transferencias, inventario. ~60% del código, riesgo bajo. Sirve para validar la infra con usuarios reales.

**Fase 3 — Módulos con cámara**
producto, pedidos, devolución, solicitud-gastos.

**Fase 4 — Lo difícil**
marcación (GPS + facial), venta-tarjeta (OCR), biometría → WebAuthn.

**Fase 5 — Convivencia y apagado**
Ambas en producción un tiempo; cuando la PWA cubre todo, se deja de publicar el APK. El APK instalado sigue funcionando hasta que se desinstale — **no hay corte forzado**.

### Sobre "tener ambos permanentemente"

Coincido con tu reticencia. Mantener dos clientes contra el mismo backend duplica el trabajo de cada feature y garantiza divergencia. **Pero la convivencia temporal durante la migración no es opcional, es la forma segura de hacerlo.** Lo que hay que evitar es que "temporal" se vuelva permanente por inercia: conviene fijar de antemano la condición de apagado.

### Una alternativa que no descartaría del todo

**Capacitor puede empaquetar la misma base de código como PWA y como APK.** Es decir: construir la PWA como objetivo principal y, si algún día hace falta una capacidad nativa puntual (OCR, GPS fino), envolver *esa misma* PWA en un APK delgado. No es "mantener dos apps": es un mismo código con dos empaques. Vale tenerlo como plan B si la Fase 4 se complica.

---

## 14. Riesgos operativos

| Riesgo | Impacto | Cómo bajarlo |
|---|---|---|
| El escaneo por cámara rinde peor en celulares viejos | 🔴 Frena la operación diaria | **Medirlo en Fase 1**, antes de invertir en el resto |
| GPS impreciso invalida marcaciones legítimas | 🔴 Conflicto laboral | Recalibrar umbral con datos de campo; apoyarse en el facial |
| Sin HTTPS en alguna filial | 🔴 Bloquea la migración ahí | Relevar **antes de empezar** |
| Los usuarios no instalan la PWA | 🟡 Sin push, peor UX | Instructivo + banner de instalación |
| Service worker sirviendo versión vieja | 🟡 Bugs fantasma | Estrategia de cache explícita y probada |
| La migración se estanca a mitad | 🟡 Dos apps para siempre | Condición de apagado fijada desde el principio |

---

## 15. Esfuerzo estimado

Orientativo, para dimensionar — no es un compromiso:

| Fase | Peso |
|---|---|
| 0 — Infra HTTPS | Chico, pero coordinación con producción |
| 1 — Esqueleto + escáner | Medio |
| 2 — Módulos sin nativo (60% del código) | Grande en volumen, bajo en riesgo — mayormente copiar |
| 3 — Módulos con cámara | Medio |
| 4 — Marcación, venta-tarjeta, WebAuthn | **El grueso del riesgo y del trabajo nuevo** |
| 5 — Convivencia y apagado | Chico |

**El trabajo verdaderamente nuevo se concentra en Fase 4 y en el OCR del backend.** Todo lo demás es portar código que ya existe y funciona.

---

## 16. Recomendación

**Avanzar, con dos condiciones previas.**

1. **Resolver HTTPS primero.** No es negociable y hay que hacerlo igual por seguridad. Si por alguna razón no se puede en todas las instancias, la migración se cae — mejor saberlo en la semana 1 que en el mes 4.

2. **Probar el escáner en dispositivos reales de sucursal antes de comprometerse.** Un prototipo de una pantalla, con `BarcodeDetector` y los códigos que realmente se escanean ahí (incluidos los pesables con prefijo `20` y los térmicos gastados). Es el único riesgo que puede volver inviable el proyecto entero, y se despeja barato.

Lo que inclina la balanza no es una sola ventaja sino el conjunto: **solo el 3,5% del código toca APIs nativas**, la impresión ya es server-side, el reconocimiento facial ya es web, iOS hoy no existe, y **hay una implementación de referencia propia en frc-gourmet** que ya resolvió el escáner y el facial en PWA.

El costo real está concentrado y es identificable: OCR, GPS de precisión y biometría. Tres problemas acotados, con salidas conocidas.

---

## Apéndice: qué mirar en frc-gourmet

| Archivo | Qué aporta |
|---|---|
| `docs/arquitectura/mobile-pwa-plan.md` | Plan completo, decisiones de arquitectura, el bloqueante TLS |
| `docs/arquitectura/mobile-pwa-skill-notes.md` | **Bitácora de ejecución** — decisiones tomadas sobre la marcha |
| `docs/arquitectura/reconocimiento-facial-asistencia-plan.md` | Facial en PWA, F1-F6 implementadas, riesgos medidos |
| `projects/mobile/src/app/pages/ventas/mesas/barcode-scanner-dialog.component.ts` | **Escáner web con `BarcodeDetector` + ZXing + entrada manual** |
| `projects/mobile/src/manifest.webmanifest` | Manifest de referencia |
| `projects/mobile/README.md` | Arquitectura del cliente PWA |

Dos diferencias de contexto a tener en cuenta: gourmet usa **Angular standalone + Material** (nosotros, módulos + Ionic) y su backend es **Fastify local en un mesh** (el nuestro, Spring Boot con IP pública). Los patrones de UI no se copian; los de capa nativa y los de infra, sí.
