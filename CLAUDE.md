# eAndon — Guía para Claude Code

Este archivo es la referencia principal para desarrollo asistido por IA en eAndon.
Léelo antes de escribir código. Tiene prioridad sobre los defaults generales.

---

## Qué es eAndon

Sistema Andon para una línea de ensamble. Cada estación (workcenter) tiene una terminal
donde el operador pide ayuda con un clic a Producción, Calidad, Mantenimiento o Materiales.
Incluye tablero general, registro de alarmas y estadísticas (MTTR/MTBF).

Usuarios: operadores de piso, supervisores, ingeniería.
Idiomas: UI en inglés con opción de español; nombres de estación en español + chino.

---

## Qué código está activo

| Carpeta | Estado | Regla |
|---|---|---|
| `server/` + `client/` (raíz) | **ACTIVA** — todo el desarrollo nuevo va aquí | Trabajar aquí por defecto |
| `legacy/` | LEGACY (.NET 6, EF Core 7, SignalR) | **No tocar salvo pedido explícito** |

### Stack
- **server:** Node + TypeScript (ESM/NodeNext), Express 4, Socket.IO, Prisma 5 + SQLite (`server/prisma/dev.db`)
- **client:** React + TypeScript + Vite, react-router, chart.js, lucide-react
- Dev (desde la raíz del repo): `npm run setup` y `npm run dev` → API :4000, UI :5173
  (Vite hace proxy de `/api` y `/socket.io` hacia :4000)
- Despliegue: solo local/on-prem. Una planta, una línea, una BD. No hay multi-tenant.

### Estructura
- `server/src/index.ts` — registro de routers
- `server/src/routes/*.ts` — workcenters, events (alarmas y pulsaciones), statistics, statusDefinitions,
  settingsAndLocalization, bootstrap, areas, screens, shifts, devices, translate
- `server/src/db.ts` (PrismaClient), `realtime.ts` (socket), `translate.ts`, `events.ts` (regla de alarmas)
- `server/src/http.ts` — `asyncHandler`, `parse` (zod), `HttpError`, `errorHandler`: usar en toda ruta nueva o modificada
- `server/prisma/schema.prisma`, `server/prisma/seed.ts`
- `client/src/` — pages/, components/, lib/ (api.ts, types.ts, socket.ts), i18n/

---

## Base de datos

- Todo acceso a datos va vía **Prisma**. Prohibido `$queryRawUnsafe` / `$executeRawUnsafe`.
  Si se necesita SQL crudo, solo `$queryRaw` con tagged template (parametrizado).
- Esquema: se maneja con **`prisma migrate`** (`server/prisma/migrations/`, base `0_init`).
  - Cambios de esquema: `npm run db:migrate:dev -- --name <nombre>` en `server/`.
    Instalación/despliegue: `npm run db:migrate` (`prisma migrate deploy`).
  - **Nunca editar una migración existente**, siempre crear una nueva. No usar `prisma db push`.
  - **Antes de cualquier migración o seed: respaldar `server/prisma/dev.db`.** Contiene datos reales de prueba.
  - Nunca correr `prisma migrate reset` ni borrar `dev.db` sin aprobación explícita.
- `seed.ts` debe ser idempotente (upsert). Respetar `update: {}` donde existe:
  sirve para no pisar ediciones del usuario.
- Nunca subir `.env` ni `*.db` a git.

---

## Invariantes frágiles (LEER antes de tocar estados o estaciones)

### E-1: Alarmas = eventos; departamento = posición del botón
Las alarmas viven en `AlarmEvent` (abierta/cerrada) y cada pulsación en `ButtonPress`.
`AlarmEvent.statusRow`, `ButtonPress.statusRow` y `Device.statusRow` apuntan a `StatusDefinition.statusRow`
(la posición del botón), no al nombre.
- **Nunca reordenar/eliminar StatusDefinition con alarmas abiertas**: mover intercambia campos entre filas.
- `Workcenter.status1..5` y la tabla `andon_logs` ya **no se usan** (se conservan por historial; no escribir en ellos).
- Máximo **una alarma abierta por estación + departamento**.

### E-2: Orden de estaciones
`Workcenter.workcenterRow` es la llave primaria y también el orden de despliegue. Mover y eliminar
**renumeran `workcenterRow` dentro de una transacción**; nunca copiar campos entre filas
(eso rompía la unicidad de `workcenterId` y tumbaba el servidor).
- Otras tablas referencian la estación por `workcenterId` (ej. `Device`, con FK en cascada), no por `workcenterRow`.
- `StatusDefinition` sí intercambia campos al mover (ver E-1).

### E-3: Detalle de StatusDefinition
Formato `"ON|opt1|opt2"` / `"OFF"`. Hoy no hay un helper compartido: se parsea en
`parseStructure` (`client/src/components/AlarmDetailsModal.tsx`) y con `split("|")[0] === "ON"`
inline en `server/src/routes/status.ts`. Antes de agregar más usos, centralizarlo en un helper.

### E-4: Localización
- Todo texto de UI **nuevo** va vía `t()` / `tOption()`, con su fila en `seed.ts`.
  (Aún existen textos hardcodeados heredados; no agregar más.)
- Los ids de la tabla localization los usa el client (incluye el prefijo `"Option.<texto>"`).
  No renombrar ids existentes.

### E-5: Un solo lugar para abrir y cerrar alarmas
Toda apertura o cierre pasa por `server/src/events.ts` (`registerPress`, `openFromComputer`,
`closeFromComputer`). Ahí se serializan las escrituras (para no abrir dos alarmas a la vez), se
guarda la pulsación y se emite `event:changed` por socket. No crear ni cerrar `AlarmEvent` en otro lado.
- **Botón físico**: abre sin preguntas; dentro del bloqueo (ajuste 5, "segundos", desde la apertura)
  se ignora; después cierra. **Computadora**: abre con detalles opcionales y cierra sin bloqueo.
- Las alarmas `openedBy = "simulated"` son pruebas y **no cuentan en estadísticas**.

---

## Reglas de seguridad

- **S-1: Sin secretos en el repo.** Connection strings, contraseñas y API keys van en `.env`
  o variables de entorno. Revisar `git diff` antes de commit. (Ya hubo una fuga en appsettings.json.)
- **S-2: Validar toda entrada en la frontera.** Endpoints nuevos o modificados validan `req.body`,
  `req.params` y `req.query` (tipos, rangos, longitudes). No confiar en casts `as`.
  Usar `parse(schema, req.body)` de `http.ts` con esquemas zod.
- **S-3: Queries parametrizadas.** Solo Prisma o `$queryRaw` con tagged template.
- **S-4: Errores async.** Todo handler async nuevo o modificado va envuelto en `asyncHandler`
  y lanza `HttpError` para errores esperados; `errorHandler` responde `{ error: 'mensaje' }` con el
  status correcto. (Algunos handlers antiguos aún no están envueltos; `index.ts` registra sus
  promesas rechazadas para que no tumben el servidor.)
- **S-5: Sin autenticación hoy.** Cualquier endpoint de escritura es alcanzable por cualquiera
  en la red. No agregar endpoints destructivos nuevos sin discutirlo. La auth es deuda pendiente.
- **S-6: Datos externos.** `translate.ts` envía nombres de estación a Google (API no oficial).
  No enviar otros datos a servicios externos sin aprobación.

---

## Convenciones

- Respuestas: éxito → datos o `{ success: true, ... }`; error → `{ error: 'mensaje legible' }`.
- Auditoría: cada alarma queda en `alarm_events` (quién abrió y quién cerró) y cada pulsación en `button_presses`.
- Deletes: hoy son físicos. Antes de agregar un DELETE nuevo, preguntar si debe ser soft delete.
- **No inventar opciones de dominio** (ej. opciones de Mantenimiento): las define el usuario.

---

## Verificación

No hay tests. Antes de dar una tarea por terminada:
- `npx tsc --noEmit` en `server/`
- `npx tsc -b` en `client/`
- `npm run lint` en `client/` si se tocó el client
Si algo falla, reportarlo con la salida. No declarar éxito sin correrlo.

---

## Flujo de trabajo

- Presentar el plan y esperar aprobación antes de hacer cambios.
- Commit/push solo cuando el usuario lo pida.

---

## AI Task Gate (OBLIGATORIO)

Antes de empezar cualquier tarea, mostrar:

### CLAUDE.md Acknowledgement
- Trabajo en server/ + client/ (legacy/ intacto salvo pedido)
- Invariantes E-1..E-5 entendidos
- Reglas de seguridad S-1..S-6 reconocidas
- dev.db se respalda antes de migraciones/seed

Al terminar cualquier tarea, mostrar:

### CLAUDE.md Compliance Check
- legacy/ sin tocar (o tocado por pedido explícito)
- Sin secretos introducidos
- Entrada validada en endpoints tocados
- Mover/eliminar estaciones renumeran filas, sin copiar campos (si aplica)
- Textos de UI nuevos vía t() con fila en seed
- tsc server/client (y lint client si aplica) en verde

Status: PASS / FAIL
