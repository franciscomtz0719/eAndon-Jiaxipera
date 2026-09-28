# Plan: del Andon actual al sistema del contexto técnico

Referencia: [`Andon_Contexto_Tecnico.md`](Andon_Contexto_Tecnico.md).
Regla de trabajo: cada fase se detalla y aprueba antes de ejecutarla.

---

## Dónde estamos vs. lo que pide el documento

| Tema | Hoy | Documento |
|---|---|---|
| Cómo se llama | Clic en la terminal web | Botón inalámbrico → gateway → Modbus TCP |
| Estado de la alarma | Texto `"red\|..."` en `status1..5` | Tabla de **eventos** con estados ABIERTA → RECONOCIDA → RESUELTA |
| Pulsaciones repetidas | Cada clic cambia el estado | Varias pulsaciones = un solo evento, con clave para no duplicar |
| Qué botón llama qué | No existe | Relación dispositivo → estación → tipo de alarma, editable en la UI |
| Sin comunicación | No se detecta | Watchdog: el tablero pasa a **gris**, nunca verde |
| Tablero | Pantalla web normal | TV en modo kiosco, letra grande, cronómetros, audio |
| Métricas | MTTR/MTBF | MTTA + MTTR por turno y área, pareto, exportar a Excel/CSV |
| Base de datos | SQLite con `db push` | Sugiere PostgreSQL o SQL Server; como mínimo, migraciones formales |

**Conclusión:** la interfaz, el tiempo real (Socket.IO), la configuración y el idioma se reutilizan.
Lo que hay que rehacer es **el núcleo de datos**: dejar `status1..5` y pasar a una tabla de eventos.
Todo lo demás depende de eso.

---

## Decisiones tomadas

- [x] **Botones por estación:** 4, uno por departamento (Producción, Calidad, Mantenimiento, Materiales).
- [x] **Modelo de botón:** transmisor **ZBRT1** (una señal al presionar). Es el que el manual del
      Panel Server confirma explícitamente (DOCA0172ES, pág. 245).
- [x] **Gateway:** tiempo de retención del ZBRT1 en **1000 ms** (el máximo); el servicio lee cada
      **300 ms**, así cada pulsación se ve al menos 3 veces y no se pierde ninguna.
- [x] **Regla de llamada y cierre** (misma botonera, sin botón de "atendido"):
  - Primera pulsación → abre la alarma.
  - Pulsaciones dentro del **tiempo de bloqueo** → se ignoran (quedan registradas).
  - Pulsación después del tiempo de bloqueo → **cierra** la alarma.
  - Tiempo de bloqueo **configurable desde la UI**, empezando en **30 s**; se afina en el piloto con
    los datos de pulsaciones registradas.
- [x] **Mitigaciones del riesgo de cerrar sin querer** (con ZBRT1, "insistir" y "cerrar" son la misma acción):
  - **Escalamiento automático** por tiempo: el operador no necesita volver a presionar para insistir.
    Capacitación: "una vez llama, otra vez cierra; no insistas, el sistema escala solo".
  - **Confirmación en la TV en menos de 2 s** al abrir ("ABIERTA") y al cerrar ("CERRADA").
  - ~~Deshacer cierre~~ (descartado 2026-09-26): si una alarma se cierra por error se abre una nueva;
    las TVs muestran el estado, así que el error se nota de inmediato.
  - **Registro de cada pulsación** (aceptada, ignorada, cerró) para ajustar el bloqueo con datos reales.
- [x] **Servicio de adquisición en TypeScript** (librería `modbus-serial`): un solo lenguaje y un solo
      entorno en el mini PC, tipos compartidos con el servidor y bajo las mismas reglas del CLAUDE.md.
      Para pruebas se puede usar el simulador de `pymodbus` como gateway falso.
- [x] **Plan B:** si en el piloto los cierres por error son frecuentes, cambiar a **ZBRT2** (envía señal
      al presionar y al soltar) con "toque llama, mantener 3 s cierra". El servicio de adquisición
      traduce todo a eventos "presionó / soltó", así que solo cambia la regla de cierre.

- [x] **En piso solo hay botones y TVs** (sin tablets en estaciones).
- [x] **Reconocida (MTTA):** sin pantalla en la estación no se registra; por ahora solo se mide
      apertura → cierre (MTTR).
- [x] **Interfaz web = panel de administración:** configuración y corrección de fallas (cerrar a mano,
      deshacer cierre, simular pulsación). La terminal web deja de ser forma de llamar.
- [x] **Una TV por área**, cada una con su mini PC **Windows** o **Android box**.
- [x] **Registros actuales:** se conservan para pruebas (se migran al modelo nuevo).
- [x] **Turnos:** parametrizables desde Configuración (horarios y política para alarmas abiertas
      al cambio de turno).

## Decisiones pendientes

- [ ] **Opciones de Mantenimiento** (ubicación/tipo de falla): las define el usuario.
- [ ] **Equipo servidor:** en qué máquina corren la API y el servicio Modbus (define cómo se instala
      el arranque automático).

## Recomendaciones sobre el stack (por confirmar)

- [ ] Mantener **Express y SQLite para el piloto** (1 área, 2 estaciones). Con Prisma, cambiar a
      PostgreSQL después es relativamente sencillo si el sistema crece.
- [ ] Arranque automático del servidor como servicio del sistema operativo, sin contenedores
      (ajustar si TI exige Docker).

---

## ⭐ Prioridad actual: tablero de TV en modo kiosco

Reordena partes de las Fases 1, 3 y 4. Se trabaja paso por paso, mostrando avance al terminar cada uno.

### Paso 1: base de datos con migraciones
- [x] Respaldar `dev.db` y pasar de `db push` a `prisma migrate` (migración base `0_init`, marcada
      como aplicada sin tocar datos; `npm run setup` ahora usa `migrate deploy`).

### Paso 2: áreas, estaciones, pantallas y turnos configurables desde el menú
- [x] `Area`: nombre, orden, activa.
- [x] Estación: se le agrega el área a la que pertenece.
- [x] `Pantalla` (TV): nombre, área que muestra, volumen, sonido activo. Cada TV abre una dirección
      fija (`/tv/:id`); lo que muestra se cambia desde el menú.
- [x] `Turno`: nombre, hora de inicio y fin, días; política para alarmas abiertas al cambio de turno
      (mantener abiertas / cerrar por sistema).
- [x] **Gateway** (una sola configuración): IP, puerto (502), intervalo de lectura (300 ms), tiempo de
      espera, ciclos sin respuesta para marcar "sin comunicación", habilitado.
      ("Probar conexión" queda para la Fase 2, cuando exista la librería Modbus.)
- [x] **Botones** (`Dispositivo`): estación, departamento, ID de servidor virtual Modbus, dirección de
      registro, tipo de lectura (bit/contador), activo. Campos Modbus editables y vacíos hasta tener
      el DOCA0241EN o el kit.
- [x] Secciones en Configuración para áreas, pantallas, turnos, gateway y botones.
- [x] Rutas nuevas con validación de entrada (zod) y manejo de errores async (reglas S-2 y S-4).

- [x] Corregido de paso: mover/eliminar estaciones tumbaba el servidor (choque de ID único al copiar
      campos entre filas). Ahora se renumeran las filas y hay manejador de errores global.

### Paso 2b: navegación por áreas y guardado explícito
- [x] Barra lateral con áreas (y "Sin área" solo si hay estaciones sin área); se actualiza al guardar.
- [x] Página del área (`/areas/:id`) con sus estaciones y estado en tiempo real.
- [x] Inicio con tarjetas de áreas (estaciones y alarmas abiertas).
- [x] Configuración: botón "Guardar cambios" y "Descartar" por sección, filas editadas resaltadas,
      confirmación al eliminar, aviso al salir con cambios sin guardar.
- [x] Notificaciones: verde "guardado" (4 s) / roja "rechazado" con fila y motivo (hasta cerrarla).
- [x] Rutas antiguas de tipos de alarma, ajustes y traducción con validación y manejo de errores.

### Paso 2c: estadísticas por área
- [x] Filtro obligatorio por área (en la URL, `/statistics?area=…`), estación opcional dentro del área, fechas.
- [x] Indicadores y gráficas solo con las alarmas del área; alarmas por estación (bilingüe) y por departamento.
- [x] Departamentos agrupados por posición del botón con su nombre actual.
- [x] Registros viejos corregidos (migración de datos): Machine trouble → Mantenimiento,
      Quality issue → Calidad, Material shortage → Materiales, Process abnormality → Producción.
- [x] Botón "Estadísticas" en la página del área.

### Paso 3: núcleo de eventos (mínimo para el tablero)
Decisiones: bloqueo contado desde la apertura; sin "deshacer cierre"; el **botón físico** abre sin
preguntas (con bloqueo); la **computadora** abre con detalles opcionales y cierra sin bloqueo;
"simular pulsación" es solo para pruebas (origen "simulado", fuera de estadísticas).
- [x] Tablas `Evento` (abierta/cerrada, abierta por / cerrada por, pulsaciones, detalles opcionales)
      y `Pulsacion` (resultado: abrió / ignorada / cerró; clave para no duplicar).
- [x] Ajuste "segundos de bloqueo" (30 por defecto, 5–600) en Configuración.
- [x] Regla única en el servidor + ruta `POST /api/presses` (la usará el servicio Modbus).
- [x] Computadora: abrir alarma (con detalles opcionales) y cerrar alarma.
- [x] Página de la estación: estado por departamento, abrir/cerrar, simular pulsación, últimas pulsaciones.
- [x] Migrar los registros actuales (`andon_logs`) a eventos; la tabla vieja se conserva sin escribirse.
- [x] Resumen, área, inicio, registro, historial y estadísticas leen eventos; `status1..5` deja de usarse.

### Trabajo del agente de Multica (traído a main)
- [x] COMM-3: casillas clicables en área/resumen (abrir/cerrar desde computadora); alarma amarillo → rojo
      según ajuste 6 ("Minutes before an open alarm turns red").
- [x] COMM-4: página temporal "Botoneras de prueba" (`/test-buttons`). No se trajo su commit que borraba `plan.md`.
- [x] COMM-5: editor de detalles de alarma (chips, vista previa), formato procesado solo en
      `server/src/detailStructure.ts`; al mover un tipo de alarma se mueven también sus detalles.

### Paso 4: tablero de TV en modo kiosco `/tv/:id`
Decisiones: **solo aparecen las estaciones con alarma** (áreas con 25+ equipos); textos fijos y
departamentos en **español + chino**.
- [x] Sin alarmas: "SIN ALARMAS ABIERTAS / 无报警" con número de estaciones (solo con conexión confirmada).
- [x] Tarjeta por estación con alarma: ID + nombre ES/ZH; solo sus departamentos abiertos, en grande,
      con cronómetro; amarillo → rojo (ícono + texto, nunca solo color).
- [x] Orden: alarma más antigua primero (las nuevas se agregan al final); tamaño automático;
      páginas que rotan cada 10 s si no caben.
- [x] Al abrir: la tarjeta aparece con parpadeo (< 2 s). Al cerrar: "CERRADA / 已解除" en verde 3 s.
- [x] Sin comunicación → todo gris con aviso, nunca verde; reconexión automática y recarga de estado.
- [x] Estado del gateway expuesto por el servidor (se activa en la Fase 2).
- [x] Configuración de la pantalla y nombres se refrescan en < 1 min; recarga sola al cambiar de versión.
- [x] Nombre del departamento en chino (editable en Tipos de alarma) y columna de chino en Traducción.
- [x] Nombre del área en chino (Configuración → Áreas, botón Traducir; nunca desde el chino), mostrado en
      TV, menú lateral, inicio, página del área y filtros. Área piloto renombrada "Ensable" → "Ensamble / 装配".
- [x] Logo de Jiaxipera (placa blanca): en el menú lateral y en la TV; arriba del círculo verde sin alarmas,
      y se desliza al centro del encabezado cuando hay alarmas.

### Paso 4b: modo de botón único (para comparar en el demo)
Decisiones: coexiste con el modo de 4 botones (lo decide cada botón: sin departamento = botón único);
cada pulsación cambia el departamento y reinicia el tiempo de confirmación (ajuste, 10 s por defecto);
al confirmarse abre el llamado, o lo **cierra** si ese departamento ya tenía uno abierto; orden de
selección por frecuencia de llamados: Producción → Mantenimiento → Materiales → Calidad (editable).
- [x] Regla en `events.ts` (selección en memoria con temporizador) + `POST /api/presses/single`.
- [x] Ajuste "segundos para confirmar" (3–60) y columna "Orden en botón único" en Tipos de alarma.
- [x] Botones sin departamento en Configuración → Botones ("— Botón único —").
- [x] TV: departamento seleccionado parpadeando con cuenta regresiva ("ABRIR en 7 s" / "CERRAR en 7 s").
- [x] Botoneras de prueba: sección "Botón único" con un botón por estación.

### Paso 5: audio, escalamiento y turnos
- [ ] Sonido al abrirse una alarma y repetición cada N minutos; sonido distinto al escalar (máx. 2–3).
- [ ] Minutos para escalar por departamento y volumen por pantalla, configurables.
- [ ] Aplicar la política de turno a las alarmas abiertas al cambio de turno.

### Paso 6: configuración de los equipos de TV
- [ ] **Windows:** Chrome/Edge en modo kiosco con audio automático, arranque al iniciar sesión,
      reapertura si se cierra, pantalla sin suspensión. Script + guía en el repo.
- [ ] **Android box:** navegador kiosco (ej. Fully Kiosk Browser) con arranque al encender,
      audio automático y recarga si pierde conexión. Guía en el repo.

Después sigue la **Fase 2 (servicio Modbus)**, que se conecta a la ruta de pulsaciones del Paso 3.

---

## Fase 0: decisiones y validación del hardware (sin código)

- [ ] Responder las decisiones pendientes de arriba.
- [ ] ¿Ya tienen el gateway PAS600L y los botones?
- [ ] Pedir al distribuidor el **DOCA0241EN (EcoStruxure Panel Server - Modbus File)**: registros
      exactos del ZBRT1 y versión de firmware requerida.
- [ ] Confirmar si cada botón expone **bit o contador**.
- [x] ~~Confirmar si la pulsación se retiene o es momentánea~~ → se retiene un tiempo configurable
      (100–1000 ms); se usará 1000 ms.
- [ ] Configurar la retención en 1000 ms (Configuración > Dispositivos inalámbricos > Ajustes funcionales globales).
- [ ] Conseguir el módulo de puesta en servicio **ZBRZ1** para dar de alta cada botón en el gateway.
- [ ] (Plan B) Preguntar si el PAS600L soporta **ZBRT2** y cómo expone presionar/soltar en Modbus.
- [ ] Confirmar qué diagnóstico de señal expone por Modbus (para ZBRT el manual indica RSSI y LQI;
      la tasa de pérdida de paquetes no está disponible).
- [ ] Medir la latencia real de punta a punta con el kit.
- [ ] Coordinar con TI: IP fija del gateway, VLAN y permisos de red.
- [ ] Prueba de cobertura de radio antes de fijar la ubicación del gateway.

## Fase 1: núcleo de eventos ⭐ lo primordial

No depende del hardware, se puede empezar en cuanto se resuelvan las decisiones.

- [x] Pasar de `db push` a **`prisma migrate`** (hecho en el Paso 1 de la prioridad actual).
- [ ] Modelo nuevo:
  - [ ] `Estacion`: agrega área, línea, orden en tablero, activa.
  - [ ] `TipoAlarma`: agrega prioridad, color, minutos para escalar.
  - [ ] `Evento`: estado, creado / reconocido / resuelto, origen (BOTON | WEB | SISTEMA),
        clave de idempotencia, cerrado por error / reabierto.
  - [ ] `Dispositivo`: botón → estación + tipo de alarma, id en el gateway, registro Modbus, activo.
  - [ ] `Pulsacion`: registro de cada pulsación y qué provocó (abrió, ignorada, cerró).
  - [ ] Configuración: tiempo de bloqueo (default 30 s).
- [ ] Un **único punto de entrada** para registrar pulsaciones (botones y terminal web) con la regla:
  - [ ] Sin alarma abierta → abre.
  - [ ] Alarma abierta y dentro del tiempo de bloqueo → ignora y registra.
  - [ ] Alarma abierta y fuera del tiempo de bloqueo → cierra.
- [ ] Deshacer cierre desde pantalla (reabre el mismo evento y lo marca).
- [ ] UI para editar el mapeo dispositivo → estación → tipo de alarma.
- [ ] Adaptar las pantallas actuales (terminal, resumen, registro, estadísticas) al modelo nuevo.
- [ ] Migrar o archivar los registros actuales.

## Fase 2: servicio de adquisición (proceso separado)

- [ ] Proceso Node/TypeScript independiente de la API, con `modbus-serial` (si la web se reinicia,
      la captura sigue). Envía los eventos a la API por HTTP.
- [ ] Conexión Modbus TCP con reconexión automática y backoff.
- [ ] Lectura cada **300 ms** de los registros configurados en BD (retención del gateway en 1000 ms).
- [ ] Detección de cambios (soporta contador o bit).
- [ ] Hora del servidor en UTC.
- [ ] Watchdog: gateway sin respuesta N ciclos → sistema degradado, propagado al tablero.
- [ ] **Cola en disco** si la API o la base no responden; reenvío con la clave de idempotencia.
- [ ] **Simulador del gateway** para desarrollar y probar sin el kit físico.
- [ ] Ajustar a mapa de registros real cuando llegue.

## Fase 3: tablero de TV y audio

- [ ] Pantalla `/tablero` legible a 10–15 m: letra grande, alto contraste.
- [ ] Ícono y texto además del color (daltonismo).
- [ ] Cronómetro en vivo por alarma abierta.
- [ ] Confirmación visible en menos de 2 s al abrir y al cerrar una alarma.
- [ ] **Escalamiento automático** por minutos sin cierre (visual y sonoro), por tipo de alarma.
- [ ] Indicador conectado / sin conexión, con reconexión automática.
- [ ] **Gris cuando se pierde la comunicación, nunca verde.**
- [ ] Audio: sonido al abrirse la alarma y repetición cada N minutos.
- [ ] 2 o 3 sonidos según prioridad.
- [ ] Volumen y silencios (por tipo, horario, turno) configurables desde la UI.
- [ ] Mini PC: Chromium en modo kiosco, autoplay de audio habilitado, arranque automático,
      recuperación tras corte de energía.

## Fase 4: robustez y seguridad

- [ ] Endpoint de salud: gateway, base de datos, clientes conectados.
- [ ] Logs con rotación.
- [ ] Auditoría de cambios de configuración.
- [ ] Respaldos automáticos de la base.
- [ ] Exportar/importar la configuración de estaciones a archivo.
- [ ] Cierre automático de alarmas por turno (marcadas como cerradas por sistema).
- [ ] **Login y roles** para Configuración (hoy cualquiera en la red puede modificarla).
- [ ] Validación de entrada en endpoints (zod) y manejo de errores async.
- [ ] Sincronización de hora por NTP en servidor y mini PC.
- [ ] Rotar la contraseña de Azure SQL expuesta en el historial de git (`legacy/`).

## Fase 5: métricas y reportes

- [ ] MTTA y MTTR por turno y por área.
- [ ] Pareto de alarmas por estación, área y tipo.
- [ ] Llamadas por turno y distribución por hora.
- [ ] Alarmas escaladas y alarmas cerradas por sistema.
- [ ] Exportación a CSV / Excel.
- [ ] Nota: las métricas "por técnico" requieren identificar quién atendió; con solo botones no es posible.

## Fase 6: prueba de aceptación (con kit físico en piso)

- [ ] Latencia del botón al tablero menor a 2 segundos.
- [ ] Cinco pulsaciones seguidas generan un solo evento.
- [ ] Desconectar el cable del gateway: el tablero pasa a gris en menos de 30 segundos.
- [ ] Reconectar: el sistema se recupera solo, sin intervención.
- [ ] Reiniciar el mini PC: el tablero vuelve solo a pantalla completa.
- [ ] Detener la base de datos 5 minutos: al volver, no se perdió ningún evento.
- [ ] Alarma abierta al cambio de turno: se cierra según la política definida.
- [ ] Audio suena al abrir alarma y se repite según lo configurado.
- [ ] Prueba de alcance del botón en la posición real de la estación, con la línea operando.
- [ ] Reporte exportado a Excel con los tiempos correctos.

---

## Restricciones (no negociables)

- Sistema **informativo**: nada de paros de emergencia ni enclavamientos.
- **Nunca escribir hacia los PLC de línea**; solo se lee del gateway de botones.
- Etapa 2 (no ahora): jidokas automáticos desde PLC, requiere routers con NAT 1:1 por línea.
