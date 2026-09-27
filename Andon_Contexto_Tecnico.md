# Sistema Andon — Contexto técnico y requerimientos

Documento de referencia para desarrollar una versión propia del Andon en TypeScript.
Describe cómo funciona el hardware elegido y qué debe considerar el software para operar
de forma confiable en piso.

**Alcance del piloto:** 1 área, 2 estaciones con botones inalámbricos, 1 tablero en TV y
1 alarma sonora. Sin conexión a los PLC de línea.

---

## 1. Arquitectura general

```
[Botón inalámbrico sin batería]
        │  Zigbee Green Power 2.4 GHz (IEEE 802.15.4)
        ▼
[Gateway EcoStruxure Panel Server PAS600L]
        │  Modbus TCP sobre Ethernet (una sola IP en red de planta)
        ▼
[Servicio de adquisición — Node.js/TypeScript]
        │  escritura de eventos
        ▼
[Base de datos]  ──►  [API + WebSocket]  ──►  [Tablero en TV + audio]
```

Puntos clave de esta arquitectura:

- El gateway vive en la red de planta con **una sola IP**. No toca las redes de los PLC,
  que están aisladas y con direcciones duplicadas.
- Toda la inteligencia (estados, tiempos, escalamiento) vive en el software, no en el
  hardware. El gateway solo expone el estado de los botones.
- No hay salidas físicas: la señalización es la TV y el audio del mini PC.

---

## 2. Cómo funciona el botón inalámbrico sin batería

Esta es la parte que más condiciona el diseño del software.

**Cosecha de energía.** El botón no tiene batería ni pilas. La energía la genera el propio
movimiento mecánico al presionarlo, mediante un generador piezoeléctrico o de inducción.
Con esa energía alcanza para encender el transmisor y mandar la señal.

**Una trama por pulsación.** Cada vez que se presiona, el transmisor manda **una sola trama
de radio**. No hay retransmisión ni confirmación de recepción desde el gateway hacia el
botón. Si la trama se pierde por interferencia, se pierde el evento: nadie se entera.

**Implicaciones directas para el software:**

| Característica del hardware | Qué debe hacer el software |
|---|---|
| Una trama, sin ACK | Nunca asumir que el operador solo presionó una vez. Tolerar duplicados y tolerar pérdidas. |
| Sin batería, sin estado propio | El estado de la alarma vive en la base de datos, no en el botón. |
| Protocolo 2.4 GHz | Compite con el Wi-Fi de planta. El diagnóstico de calidad de señal debe ser visible en la interfaz. |
| Sin retroalimentación nativa | Usar el módulo de retroalimentación visual (ZBRV1), o mostrar la confirmación en el tablero en menos de 2 segundos. |

**El riesgo humano:** si el operador no ve respuesta inmediata, presiona el botón cuatro o
cinco veces. El software debe agrupar esas pulsaciones en un solo evento, no generar cinco
alarmas.

---

## 3. Cómo se leen los botones desde el gateway

El Panel Server concentra los dispositivos inalámbricos y expone su estado por **Modbus TCP**
(también tiene páginas web para configuración y diagnóstico). El software no habla con los
botones: habla con el gateway.

**Modelo de sondeo (polling), no de eventos.** Modbus es un protocolo maestro-esclavo: el
servicio pregunta, el gateway responde. Nadie avisa nada por iniciativa propia. Esto define
tres parámetros críticos:

1. **Periodo de sondeo.** Entre 300 y 500 ms. Más lento, el operador percibe que el sistema
   no responde. Más rápido, se satura el gateway sin ganancia real.
2. **Retención del evento.** Hay que confirmar en el mapa de registros si el registro del
   botón guarda la pulsación hasta que se lee, o si solo refleja el instante. **Si es
   momentáneo, un sondeo de 500 ms puede perder pulsaciones y el diseño cambia por completo.**
   Este es el punto número uno a validar con el kit físico.
3. **Contador vs. bit.** Si el gateway expone un contador de pulsaciones, es mucho mejor que
   un bit: comparando el valor anterior con el nuevo se detectan pulsaciones aunque hayan
   ocurrido entre dos sondeos. Preguntar al distribuidor por la tabla de registros específica
   para botones inalámbricos y la versión de firmware donde quedó soportada.

**Pendiente de validar antes de escribir código definitivo:** mapa de registros exacto,
comportamiento de retención, latencia real medida de punta a punta, y si el gateway reporta
calidad de señal o última comunicación por dispositivo.

---

## 4. Capa de adquisición (servicio Node.js)

Responsabilidades, en orden:

1. **Conexión Modbus TCP** al gateway, con reconexión automática y backoff.
2. **Sondeo periódico** de los registros configurados.
3. **Detección de flanco**: comparar la lectura actual contra la anterior y emitir un evento
   solo en la transición, no en cada sondeo.
4. **Antirrebote lógico**: ignorar pulsaciones del mismo botón dentro de una ventana de
   2 a 3 segundos. Esto resuelve el problema del operador que presiona varias veces.
5. **Sellado de tiempo en el servidor**, no en el gateway, y siempre en UTC.
6. **Watchdog**: si el gateway no responde durante N ciclos, marcar el sistema como degradado
   y propagarlo hasta el tablero.

**Regla de oro:** el tablero nunca debe mostrar verde cuando en realidad perdió comunicación.
Sin datos es gris, nunca verde. Un Andon que miente es peor que no tener Andon.

---

## 5. Modelo de datos mínimo

```
Estacion       : id, nombre, area, linea, orden_en_tablero, activa
Dispositivo    : id, id_radio_gateway, registro_modbus, estacion_id, funcion (LLAMADA|ATENDIDO), activo
TipoAlarma     : id, nombre, color, prioridad, minutos_para_escalar
Evento         : id, estacion_id, tipo_alarma_id, estado, creado_en, reconocido_en,
                 resuelto_en, origen, clave_idempotencia
Usuario        : id, nombre, rol, area
```

**Importante:** el mapeo dispositivo → estación → tipo de alarma debe vivir en base de datos
y ser editable desde la interfaz. Nunca en el código. Los botones se reubican en piso mucho
más seguido de lo que uno cree.

---

## 6. Máquina de estados de la alarma

```
ABIERTA ──(botón ATENDIDO o acción de usuario)──► RECONOCIDA ──► RESUELTA
   │                                                                ▲
   └──────────────(cierre automático por turno o supervisor)────────┘
```

Dos tiempos distintos, y conviene no confundirlos:

- **Tiempo de respuesta (MTTA):** de `creado_en` a `reconocido_en`. Mide qué tan rápido llega
  el técnico.
- **Tiempo de solución (MTTR):** de `creado_en` a `resuelto_en`. Mide qué tan rápido se
  resuelve el problema.

Con solo botones y TV, hay que **definir quién presiona el botón de atendido**: si lo presiona
el operador al ver llegar al técnico, se mide respuesta; si lo presiona el técnico al terminar,
se mide solución. No se pueden medir las dos cosas con un solo botón por estación.

**Casos borde que hay que resolver:**

- Botón de atendido presionado sin que haya alarma abierta: ignorar, pero registrar.
- Segunda llamada de una estación que ya tiene alarma abierta: no crear un evento nuevo,
  refrescar la última pulsación y opcionalmente subir prioridad.
- Alarmas que quedan abiertas al terminar el turno: política explícita de cierre automático,
  marcándolas como cerradas por sistema para que no contaminen las estadísticas.

---

## 7. Tablero (TV)

- **Push, no polling.** WebSocket o Server-Sent Events desde el servidor. Que el navegador
  esté recargando la página cada 5 segundos es un antipatrón: parpadea y pierde eventos.
- **Reconexión automática** con reintento, y un indicador visible de "conectado / sin conexión".
- **Legibilidad a distancia.** Se lee desde 10 o 15 metros: tipografía grande, mucho contraste,
  máximo la información que quepa de un vistazo. El color nunca debe ser el único
  diferenciador, por daltonismo.
- **Cronómetro en vivo** por alarma abierta, que es lo que genera la presión de atención.
- **Modo kiosco**: pantalla completa, sin barra de direcciones, arranque automático al encender
  el mini PC y recuperación sola después de un corte de energía.
- **Estado degradado** bien visible cuando el watchdog detecta pérdida del gateway.

---

## 8. Alarma sonora

- Los navegadores **bloquean la reproducción automática de audio** hasta que haya una
  interacción del usuario. En modo kiosco hay que arrancar el navegador con la política de
  autoplay deshabilitada, o generar una interacción sintética al inicio.
- **Escalamiento sonoro:** un sonido corto al abrirse la alarma, y repetición cada N minutos
  mientras siga abierta. Sonido continuo permanente y la gente desconecta la bocina.
- **Silencio configurable** por tipo de alarma, por horario y por turno.
- Sonidos distintos por prioridad, pero pocos: dos o tres máximo, o nadie los distingue.
- El volumen debe poder ajustarse sin entrar al código.

---

## 9. Robustez operativa

- **Idempotencia:** cada evento con una clave derivada de dispositivo más ventana de tiempo,
  para que un reintento no duplique registros.
- **Cola local en disco:** si la base de datos no responde, el servicio de adquisición encola
  y reenvía después. Nunca perder un evento por una caída de red.
- **Logs con rotación** y un registro de auditoría de cambios de configuración.
- **Health endpoint** que reporte estado del gateway, de la base de datos y de los clientes
  conectados.
- **Respaldo** de la base de datos, y la configuración de estaciones exportable a archivo.
- **Sincronización de hora por NTP** en servidor y mini PC. Si los relojes se desfasan, los
  tiempos de respuesta pierden todo sentido.

---

## 10. Métricas que el sistema debe entregar

- Pareto de alarmas por estación, por área y por tipo.
- MTTA y MTTR por turno, por área y por técnico.
- Número de llamadas por turno y su distribución horaria.
- Alarmas escaladas y alarmas cerradas por sistema.
- Exportación a Excel o CSV, porque esos datos van a terminar en las juntas de producción.

---

## 11. Restricciones y advertencias

- **Nada de funciones de seguridad.** Este sistema es informativo. No debe usarse para paros
  de emergencia ni enclavamientos. La comunicación inalámbrica no es adecuada para eso.
- **Nunca escribir hacia los PLC de línea.** El sistema solo lee del gateway de botones.
- **Cobertura de radio:** hacer prueba de cobertura antes de fijar la ubicación del gateway y
  la antena. El 2.4 GHz compite con el Wi-Fi y las estructuras metálicas lo atenúan.
- **Coordinar con TI** la IP fija del gateway, la VLAN y los permisos de red.
- **Etapa 2, no ahora:** para jidokas automáticos desde los PLC se requerirían routers con
  NAT 1:1 por línea, por el tema de las IPs duplicadas.

---

## 12. Stack sugerido

| Capa | Propuesta |
|---|---|
| Adquisición | Node.js con TypeScript, biblioteca Modbus TCP, proceso independiente |
| Base de datos | PostgreSQL o SQL Server; tabla de eventos particionada por fecha |
| API | Fastify o NestJS, con WebSocket para el tablero |
| Tablero | React o Svelte, modo kiosco a pantalla completa |
| Configuración | Todo por variables de entorno y base de datos, nada codificado |
| Despliegue | Contenedores, con reinicio automático y arranque con el sistema |

Conviene mantener **el servicio de adquisición como proceso separado** de la API. Si la
interfaz web se cae o se reinicia por un despliegue, la captura de eventos no se detiene.

---

## 13. Lista de verificación para la prueba de aceptación

- [ ] Latencia medida del botón al tablero, menor a 2 segundos.
- [ ] Cinco pulsaciones seguidas generan un solo evento.
- [ ] Desconectar el cable del gateway: el tablero pasa a gris en menos de 30 segundos.
- [ ] Reconectar: el sistema se recupera solo, sin intervención.
- [ ] Reiniciar el mini PC: el tablero vuelve solo a pantalla completa.
- [ ] Detener la base de datos 5 minutos: al volver, no se perdió ningún evento.
- [ ] Alarma abierta al cambio de turno: se cierra según la política definida.
- [ ] Audio suena al abrir alarma y se repite según lo configurado.
- [ ] Prueba de alcance del botón en la posición real de la estación, con la línea operando.
- [ ] Reporte exportado a Excel con los tiempos correctos.
