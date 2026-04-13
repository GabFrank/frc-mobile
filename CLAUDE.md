# CLAUDE.md — frc-comercial/mobile

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

`frc-app` (`package.json` name), aplicación **móvil Android/iOS** del producto **Franco Systems 3.0.9**. Empaquetada con marca comercial **"Bodega Franco"** (`appName` en `capacitor.config.ts`, `appId: com.sistemasinformaticos.frc`). Es uno de los 4 componentes que forman `frc-comercial/`. Repo git independiente: `GabFrank/frc-mobile`.

Stack: **Angular 15.2** + **Ionic 6** + **Capacitor 5** + **Apollo Client** (GraphQL) + Husky pre-commit. Apunta al backend **`frc-comercial/central`** vía GraphQL. Tiene capacidades de AI/visión (Azure Face, Google Cloud Vision, `@vladmandic/human`), biometría, push notifications via FCM, barcode scanning via ML Kit, geolocation, mapas (Google Maps + Leaflet).

## Build & Run

```bash
npm start                  # ng serve --port 4300 (web preview)
npm run build              # ng build (web bundle en www/)
npm run refresh            # build + cap sync + cap copy → actualiza Android/iOS native projects
npm run lint               # ng lint
npm test                   # Karma
npm run clean-install      # nuke node_modules + package-lock + cache → npm install --legacy-peer-deps
```

### ⚠️ Peculiaridades de instalación

1. **`--legacy-peer-deps` es obligatorio.** El árbol de dependencias tiene conflictos peer (mezcla `@ionic-native/*` viejo con `@awesome-cordova-plugins/*`, varias versiones de Angular/Ionic). Sin la flag, `npm install` falla. Por eso `clean-install` la incluye.

2. **El `postinstall` hook patchea** `node_modules/phonegap-plugin-barcodescanner/src/android/barcodescanner.gradle` reemplazando `compile(` por `implementation(`. Es porque el plugin original usa la sintaxis Gradle deprecada y el build de Android Gradle Plugin moderno la rechaza. Si ves un diff sorpresa en `node_modules/`, es esto — no es cache podrido. El hook es idempotente.

3. **`npm run refresh`** es el comando que hay que correr **siempre** después de cambios en código Angular antes de probar en device/emulador, no `npm run build` solo. Ejecuta build → `cap sync` (instala plugins/actualiza configs nativas) → `cap copy` (copia el bundle a `android/app/src/main/assets/public` e iOS equivalente).

## ⚠️ REGLA CRÍTICA: modificar backend desde el mobile

**El desktop está completo y funcional. El mobile es desarrollo activo.** Cualquier cambio en `frc-comercial/central` (backend) que se haga para soportar el mobile **debe respetar el desktop existente**. La regla detallada está en [docs/REGLAS_DESARROLLO.md](docs/REGLAS_DESARROLLO.md), resumen:

### Antes de modificar un método del backend

1. **Verificar si el método ya es usado por el desktop** (grep en `frc-comercial/desktop/src/`).
2. Si **sí lo usa el desktop**: NO modificar el método existente. **Crear un método nuevo en paralelo**:
   ```java
   // mantener intacto
   public RecepcionMercaderia getRecepcionMercaderia(Long id) { ... }

   // nuevo, solo para mobile
   public RecepcionMercaderiaMobileDTO getRecepcionMercaderiaMobile(Long id) { ... }
   ```
3. Si **NO lo usa el desktop**: se puede modificar directamente.

### Documentar uso en cada método del backend

Agregar comentario JavaDoc indicando quién usa el método:

```java
/**
 * Obtiene lista de pedidos paginados
 *
 * Usado en:
 * - Desktop: Sí (módulo de compras, lista principal)
 * - Mobile: No
 */
public Page<Pedido> getPedidosPaginated(...) { ... }
```

### Checklist obligatorio

- [ ] Verificar si el método/endpoint es usado por desktop
- [ ] Si lo usa: crear método separado para mobile (sufijo `Mobile`)
- [ ] Si no lo usa: modificar directamente
- [ ] Agregar/actualizar comentarios `Usado en: Desktop / Mobile`
- [ ] Probar que desktop sigue funcionando (si aplica)
- [ ] Probar mobile

**Por qué importa:** el desktop es producto en producción para clientes reales (instalado en farmacias y bodegas). Una regresión en el desktop por un cambio "para el mobile" es un incidente de cliente. La regla del sufijo `Mobile` es deuda técnica controlada.

## Capacitor / nativo

- **`capacitor.config.ts`**: `appId: com.sistemasinformaticos.frc`, `appName: "Bodega Franco"`, `webDir: www`, `androidScheme: http` con `cleartext: true` (necesario porque las APIs del central pueden estar en HTTP en LAN local, no HTTPS).
- **CapacitorUpdater** (`@capgo/capacitor-updater`) con `autoUpdate: true` — actualizaciones OTA del bundle web. Esto es independiente del release del APK.
- **Splash screen**: rojo `#b40000` (color de marca), `CENTER_CROP`, fullscreen.
- **Plugins notables**: `@capacitor-mlkit/barcode-scanning` (scanner moderno), `@capgo/capacitor-native-biometric` (face/fingerprint), `@capacitor-community/fcm` (push), `@capacitor/google-maps`, `@capacitor/geolocation`, `@capacitor/camera` con `androidSource: 'both'`.
- **Cordova legacy**: todavía hay plugins Cordova viejos (`cordova-plugin-app-version`, `cordova-plugin-globalization`, `phonegap-plugin-barcodescanner`) conviviendo con los Capacitor modernos. Migración incompleta — no remover sin verificar uso.

## ⚠️ Claves Android pendientes de reubicar

Las claves de firma de Android no viven dentro de este repo, viven al lado del repo en el workspace padre y fueron marcadas como **TODO urgente** durante el refactor de carpetas (2026-04-08):

- `frc-sistemas-informaticos/frontend/mobile/key` — keystore Android (binario sin extensión)
- `frc-sistemas-informaticos/frontend/mobile/private_key.pepk` — Google Play upload signing key (PEPK)

Ambas están **fuera de `frc-comercial/`** intencionalmente. La carpeta vieja `frontend/mobile/` se mantiene viva solo para alojarlas. Ver [../../TODO_PENDIENTE.md](../../TODO_PENDIENTE.md) para el plan de reubicación. **No commitear estas claves a este repo bajo ninguna circunstancia.**

## CI/CD

Mismo modelo `semantic-release` que los demás componentes. Ver guía consolidada [../../cicd-implementation/guia-desarrollo-cicd.md](../../cicd-implementation/guia-desarrollo-cicd.md) para el detalle completo.

### Branches

- Tres branches long-lived: `develop` (alpha) → `release/beta` (beta) → `master` (stable)
- Este repo usa **`master`, no `main`**, y **`release/beta` long-lived**. Ambas protegidas con `enforce_admins=true` — siempre PR.
- Branch naming: `feature/modulo-descripcion`, `fix/modulo-descripcion`, `refactor/modulo-descripcion`, `chore/descripcion`, `hotfix/descripcion`. Minúsculas, guiones, sin acentos ni espacios.
- `feature/*`, `fix/*`, etc. salen de `develop`. **`hotfix/*` sale de `master`.**

### Releases automáticos

- `semantic-release` lee commits convencionales: `feat:` → minor, `fix:` → patch, `feat!:` o `BREAKING CHANGE:` → major. `chore:`/`refactor:`/`ci:`/`docs:`/`test:`/`perf:` no liberan.
- **Promoción `release/beta → master`: merge commit, NO squash.**
- Push a cualquiera de las 3 branches dispara release automático. **Nunca pushear sin confirmación explícita del usuario.**

### ⚙️ Deploy: dos canales independientes

El mobile tiene **dos mecanismos de actualización separados**:

1. **OTA del bundle web vía CapacitorUpdater** (ya descripto en sección Capacitor de arriba): `autoUpdate: true`. Cada release del canal correspondiente actualiza el bundle JS sin reinstalar el APK. Funciona para cambios de código Angular/TS pero **no** para cambios en plugins nativos, dependencias Capacitor o `capacitor.config.ts`.

2. **APK release a Play Store**: workflow GitHub Actions **"Deploy Play Store"** → elegir track (internal / closed / open / production). **Manual con aprobación del líder técnico**, no automático aunque haya release nuevo en GitHub. Necesario para:
   - Cambios en plugins nativos (`@capacitor-mlkit/barcode-scanning`, `@capacitor/camera`, etc.)
   - Bumps de versión de Capacitor o Cordova plugins
   - Cambios en `capacitor.config.ts` (permisos, appId, etc.)
   - Cambios en `android/app/build.gradle` o `ios/App/Podfile`

**Implicancia importante:** un `feat:` que solo toca código Angular se propaga vía OTA en el próximo open de la app, pero un `feat:` que agrega un plugin nativo NO llega hasta que se haga release manual a Play Store. Documentar en el PR cuál de los dos casos es.

### Hotfix flow

1. `git checkout master && git pull` → branch desde **master**
2. `git checkout -b hotfix/descripcion`
3. Fix + commit `fix(modulo): ...` + push
4. PR `hotfix/* → master`, merge → semantic-release genera versión de producción
5. Si el fix es solo código Angular: OTA lo propaga automáticamente a usuarios en canal `stable`
6. Si el fix toca código nativo: ejecutar workflow "Deploy Play Store" manual, track production
7. **Inmediatamente después: PR `master → develop`** para que `develop` tenga el fix.

## Cambios en la API GraphQL (lado cliente)

El mobile consume GraphQL del `frc-comercial/central`. Si el backend cambia el schema:

1. **Agregar campos nuevos no rompe** al mobile (Apollo los ignora si no los pide).
2. **Eliminar o renombrar campos** que el mobile usa **rompe la app en runtime**.
3. Si el cambio es para soportar mobile específicamente, seguir la **regla del sufijo `Mobile`** descripta arriba — no modificar el método existente del desktop.
4. Si el cambio es inevitable (`feat!:` en el backend), versionar el mobile, desktop y backend coordinadamente.

## Pull Requests

- **Tamaño**: idealmente menos de 400 líneas de cambio neto.
- **Descripción del PR debe incluir**: qué resuelve, cómo probarlo, riesgo, **si requiere release a Play Store** (sí/no — depende de si toca código nativo) e impacto en backend si aplica.
- **Sin commits "WIP"** al mergear.

## Lo que NUNCA hacer

1. Push directo a `master`, `release/beta` o `develop` — siempre vía PR
2. `git push --force` a ramas compartidas
3. Commitear las claves Android (`key`, `private_key.pepk`) — están afuera del repo intencionalmente, ver TODO_PENDIENTE.md
4. Modificar un método del backend que el desktop usa — crear método paralelo `*Mobile()` (regla del proyecto)
5. Cambiar `appId` en `capacitor.config.ts` sin coordinar — rompe el upgrade path en Play Store
6. Squash merge en PRs — usar **merge commit**
7. Bumpear la versión major de Capacitor o Ionic sin testing exhaustivo — el árbol de deps ya tiene conflictos peer
8. Saltear `--legacy-peer-deps` en `npm install` — falla
9. Pushear los viernes (durante el período de adopción del workflow)
10. Saltear el CI con `--no-verify`

## Estructura

```
src/app/
├── app-update/         # CapacitorUpdater integration
├── components/         # Componentes reutilizables
├── dialog/             # Diálogos
├── domains/            # Modelos de dominio
├── generic/            # Servicios genéricos (CRUD, etc.)
├── graphql/            # Apollo / queries
├── pages/              # Pantallas Ionic
├── services/           # Servicios cross-cutting
└── splash/             # Splash screen
docs/
├── REGLAS_DESARROLLO.md          # ⚠️ Reglas críticas para tocar el backend (leer arriba)
├── manuales-refactor/
└── utilitarios/
```

## Convenciones generales

- **Idioma de dominio:** español. Identificadores genéricos en inglés.
- **GraphQL:** habla con `frc-comercial/central` (mismo backend que usa el desktop). NO con `frc-efact`.
- **Husky pre-commit**: configurado vía `npm run prepare`. Si falla, NO usar `--no-verify` — investigar.

## Referencias relacionadas

- [docs/REGLAS_DESARROLLO.md](docs/REGLAS_DESARROLLO.md) — Reglas críticas de modificación de backend (resumidas arriba).
- [../../REPORTE_VULNERABILIDADES.md](../../REPORTE_VULNERABILIDADES.md) — Auditoría 2026-04-02. Hallazgo en este repo: `src/app/services/face-ai.service.ts:8` (ver línea ~101).
- [../../TODO_PENDIENTE.md](../../TODO_PENDIENTE.md) — Item urgente: reubicar claves Android.
- [../../CLAUDE.md](../../CLAUDE.md) — Mapa cross-project del workspace.
- [../central/CLAUDE.md](../central/CLAUDE.md) — Backend GraphQL al que este mobile habla.
- [../desktop/CLAUDE.md](../desktop/CLAUDE.md) — App desktop hermana, mismo backend, ya completa.
