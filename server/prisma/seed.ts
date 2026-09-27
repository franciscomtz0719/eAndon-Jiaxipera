import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const workcenters = [
  { workcenterRow: 1, workcenterId: "A-003", workcenterName: "Mixing Station" },
  { workcenterRow: 2, workcenterId: "A-012", workcenterName: "Heating Chamber" },
  { workcenterRow: 3, workcenterId: "B-015", workcenterName: "Curing Area" },
  { workcenterRow: 4, workcenterId: "B-019", workcenterName: "Assembly" },
  { workcenterRow: 5, workcenterId: "C-020", workcenterName: "Inspection & Packing" },
];

const OFF = { alarmEndText1Structure: "OFF", alarmEndText2Structure: "OFF", alarmEndText3Structure: "OFF", alarmEndText4Structure: "OFF" };

const statusDefinitions = [
  {
    statusRow: 1, statusName: "Producción", statusEnabled: true, statusDetailsEnabled: 0, iconName: "fa fa-industry",
    alarmStartText1Structure: "OFF", alarmStartText2Structure: "OFF", alarmStartText3Structure: "OFF", ...OFF,
  },
  {
    statusRow: 2, statusName: "Calidad", statusEnabled: true, statusDetailsEnabled: 0, iconName: "fa fa-search",
    alarmStartText1Structure: "OFF", alarmStartText2Structure: "OFF", alarmStartText3Structure: "OFF", ...OFF,
  },
  {
    statusRow: 3, statusName: "Mantenimiento", statusEnabled: true, statusDetailsEnabled: 1, iconName: "fa fa-cogs",
    alarmStartText1Structure: "ON|Loading|Robot|Pressing|Machining|Assembly|Welding|Soldering|Cutting|Injection Molding|Extrusion|Painting|Coating|Laser Cutting|Testing|Quality Control|Material Handling|Packaging|Heat Treating|Casting|Forming|Grinding|Deburring|Polishing",
    alarmStartText2Structure: "ON|Mechanical failure|Electrical failure|Software failure",
    alarmStartText3Structure: "ON|", ...OFF,
  },
  {
    statusRow: 4, statusName: "Materiales", statusEnabled: true, statusDetailsEnabled: 1, iconName: "fa fa-cubes",
    alarmStartText1Structure: "OFF", alarmStartText2Structure: "OFF", alarmStartText3Structure: "ON", ...OFF,
  },
  {
    // The team leader belongs to production, so this slot stays disabled.
    statusRow: 5, statusName: "Líder de equipo", statusEnabled: false, statusDetailsEnabled: 0, iconName: "fa fa-street-view",
    alarmStartText1Structure: "OFF", alarmStartText2Structure: "OFF", alarmStartText3Structure: "OFF", ...OFF,
  },
];

const settings = [
  { settingId: 1, settingName: "Language", currentSetting: "English", possibleSettings: "English|Spanish", defaultSetting: "English" },
  { settingId: 2, settingName: "Show workcenter name?", currentSetting: "Yes", possibleSettings: "Yes|No", defaultSetting: "Yes" },
  { settingId: 3, settingName: "Show only workcenters with alarms in Overivew?", currentSetting: "No", possibleSettings: "Yes|No", defaultSetting: "No" },
  { settingId: 5, settingName: "Seconds before a button press closes the alarm", currentSetting: "30", possibleSettings: "5-600", defaultSetting: "30" },
  { settingId: 6, settingName: "Minutes before an open alarm turns red", currentSetting: "5", possibleSettings: "1-240", defaultSetting: "5" },
  { settingId: 4, settingName: "Open alarms at shift change", currentSetting: "Keep open", possibleSettings: "Keep open|Close by system", defaultSetting: "Keep open" },
];

const localization: { id: string; english: string; spanish: string; translation: string }[] = [
  { id: "AddWorkcenter", english: "Add workcenter", spanish: "Agregar estación", translation: "Přidej pracoviště" },
  { id: "AlarmEndDate", english: "Ending Date", spanish: "Fecha final", translation: "Koncové datum" },
  { id: "AlarmEndTime", english: "Alarm End", spanish: "Fin de alarma", translation: "Konec alarmu" },
  { id: "AlarmHistory", english: "Alarm History for workcenter ", spanish: "Historial de alarmas de la estación ", translation: "Historie alarmů na pracovišti " },
  { id: "AlarmLog", english: "Alarm Log", spanish: "Registro de alarmas", translation: "Záznamy" },
  { id: "AlarmName", english: "Alarm Type", spanish: "Tipo de alarma", translation: "Typ alarmu" },
  { id: "AlarmOverview", english: "Alarm Overview", spanish: "Resumen de alarmas", translation: "Přehled alarmů" },
  { id: "AlarmRow", english: "Alarm Row", spanish: "Orden de alarma", translation: "Pořadí alarmu" },
  { id: "AlarmStartDate", english: "Starting Date", spanish: "Fecha inicial", translation: "Počáteční datum" },
  { id: "AlarmStartDetails", english: "Enter details to start the alarm", spanish: "Ingrese los detalles para iniciar la alarma", translation: "Zadej detaily pro spuštění alarmu" },
  { id: "AlarmStartTime", english: "Alarm Start", spanish: "Inicio de alarma", translation: "Začátek alarmu" },
  { id: "AlarmStatistics", english: "Alarm Statistics", spanish: "Estadísticas de alarmas", translation: "Statistiky alarmů" },
  { id: "AlarmTypeEnabled", english: "Alarm Type Enabled", spanish: "Tipo de alarma activo", translation: "Typ alarmu aktivní" },
  { id: "AlarmTypeIcon", english: "Alarm Type Icon", spanish: "Ícono del tipo de alarma", translation: "Ikona typu alarmu" },
  { id: "AlarmTypeName", english: "Alarm Type Name", spanish: "Nombre del tipo de alarma", translation: "Jméno typu alarmu" },
  { id: "ALARMTYPES", english: "ALARM TYPES", spanish: "TIPOS DE ALARMA", translation: "TYPY ALARMŮ" },
  { id: "AlarmTypesForWorkcenter", english: "Alarm types for Workcenter ", spanish: "Tipos de alarma para la estación ", translation: "Typy alarmů pro pracoviště " },
  { id: "All", english: "All", spanish: "Todas", translation: "Vše" },
  { id: "Cancel", english: "Cancel", spanish: "Cancelar", translation: "Zrušit" },
  { id: "ChooseIcon", english: "Choose Icon", spanish: "Elegir ícono", translation: "Vyber ikonu" },
  { id: "Close", english: "Close", spanish: "Cerrar", translation: "Zavřít" },
  { id: "ConfirmAlarm", english: "Confirm Alarm", spanish: "Confirmar alarma", translation: "Potvrdit alarm" },
  { id: "CurrentValue", english: "Current value", spanish: "Valor actual", translation: "Současná hodnota" },
  { id: "DefaultText", english: "Default text (English)", spanish: "Texto predeterminado (inglés)", translation: "Standardní text (angličtina)" },
  { id: "DefineAlarmStartDetails", english: "Define alarm start details - ", spanish: "Definir detalles de inicio de alarma - ", translation: "Definuj detaily pro začátek alarmu - " },
  { id: "DeleteWorkcenter", english: "Delete workcenter", spanish: "Eliminar estación", translation: "Smaž pracovíště" },
  { id: "DetailEnabled", english: "Detail enabled", spanish: "Detalle activo", translation: "Detail aktivní" },
  { id: "DetailsFree", english: "Details (free text field)", spanish: "Detalles (campo de texto libre)", translation: "Detaily (volné textové pole)" },
  { id: "DetailsOptional", english: "Details (optional)", spanish: "Detalles (opcional)", translation: "Detaily (nepovinné)" },
  { id: "DurationMin", english: "Alarm Duration (min)", spanish: "Duración de alarma (min)", translation: "Trvání alarmu (min)" },
  { id: "Enabled", english: "Enabled", spanish: "Activo", translation: "Aktivní" },
  { id: "EnabledForEnd", english: "Enabled for alarm end", spanish: "Activo al finalizar la alarma", translation: "Zapnuty pro konec alarmů" },
  { id: "EnabledForStart", english: "Enabled for alarm start", spanish: "Activo al iniciar la alarma", translation: "Zapnuty pro začátek alarmů" },
  { id: "EnabledForStartEnd", english: "Enabled for alarm start & end", spanish: "Activo al iniciar y finalizar la alarma", translation: "Zapnuty pro začátek i konec alarmů" },
  { id: "FailureDetails", english: "Failure Details", spanish: "Detalles de la falla", translation: "Detaily problému" },
  { id: "FailureLocation", english: "Failure Location", spanish: "Ubicación de la falla", translation: "Místo problému" },
  { id: "FailureLocationForWorkcenter", english: "Failure locations for Workcenter ", spanish: "Ubicaciones de falla para la estación ", translation: "Místa problémů pro pracoviště " },
  { id: "FailureType", english: "Failure Type", spanish: "Tipo de falla", translation: "Typ problému" },
  { id: "FailureTypesForworkcenter", english: "Failure types for Workcenter ", spanish: "Tipos de falla para la estación ", translation: "Typy problémů pro pracoviště " },
  { id: "INTERFACESETTINGS", english: "INTERFACE SETTINGS", spanish: "CONFIGURACIÓN DE INTERFAZ", translation: "NASTAVENÍ PROSTŘEDÍ" },
  { id: "LOCALIZATION", english: "LOCALIZATION", spanish: "TRADUCCIÓN", translation: "PŘEKLAD" },
  { id: "LocalizedText", english: "Localized text (Spanish)", spanish: "Texto en español", translation: "Přeložený text" },
  { id: "MTBF", english: "Mean time between failures (MTBF)", spanish: "Tiempo medio entre fallas (MTBF)", translation: "Střední doba mezi poruchami (MTBF)" },
  { id: "MTTR", english: "Mean time to repair (MTTR)", spanish: "Tiempo medio de reparación (MTTR)", translation: "Střední doba opravy (MTTR)" },
  { id: "No", english: "No", spanish: "No", translation: "Ne" },
  { id: "NoDetailsEnabled", english: "No details enabled", spanish: "Sin detalles", translation: "Detaily vypnuty" },
  { id: "NoOfFinishedAlarms", english: "Nr. of finished alarms", spanish: "Núm. de alarmas terminadas", translation: "Počet ukončených alarmů" },
  { id: "NoWorkcentersWithActiveAlarms", english: "--  No workcenters with active alarms --", spanish: "-- No hay estaciones con alarmas activas --", translation: "-- Žádná pracovíště s aktivními alarmy --" },
  { id: "NumberOfAlarms", english: "Number of Alarms", spanish: "Número de alarmas", translation: "Počet alarmů" },
  { id: "OptionsSeparated", english: "Options (separated by | )", spanish: "Opciones (separadas por | )", translation: "Volby (oddělené | )" },
  { id: "PercentageOfTotal", english: "Percentage of Total", spanish: "Porcentaje del total", translation: "Procento z celku" },
  { id: "ResetToDefaultSettings", english: "Reset to default settings", spanish: "Restablecer configuración predeterminada", translation: "Vrátit původní nastavení" },
  { id: "SaveAndClose", english: "Save and close", spanish: "Guardar y cerrar", translation: "Uložit a zavřít" },
  { id: "SaveID", english: "Save ID", spanish: "ID", translation: "Ulož ID" },
  { id: "SaveName", english: "Save name", spanish: "Guardar nombre", translation: "Ulož jméno" },
  { id: "SaveText", english: "Save text", spanish: "Guardar texto", translation: "Ulož text" },
  { id: "SelectOption", english: "-- Select option --", spanish: "-- Seleccione una opción --", translation: "-- Zvol možnost --" },
  { id: "SettingName", english: "Setting name", spanish: "Nombre de configuración", translation: "Jméno nastavení" },
  { id: "Settings", english: "Settings", spanish: "Configuración", translation: "Nastavení" },
  { id: "ShowLogEntries", english: "Show Log Entries", spanish: "Mostrar registros", translation: "Ukaž záznamy" },
  { id: "ShowOnlyActiveAlarms", english: " Show only workcenters with active alarms", spanish: " Mostrar solo estaciones con alarmas activas", translation: " Zobraz pouze pracoviště s aktivními alarmy" },
  { id: "ShowOnlyFinishedAlarms", english: "Show only finished alarms:", spanish: "Mostrar solo alarmas terminadas:", translation: "Ukaž pouze ukončené alarmy:" },
  { id: "ShowStatistics", english: "Show Statistics", spanish: "Mostrar estadísticas", translation: "Ukaž statistiku" },
  { id: "TerminalHeader", english: "Andon Terminal for workcenter", spanish: "Terminal Andon de la estación", translation: "Andon terminál pro pracoviště" },
  { id: "TerminalInstruction1", english: "⇒ If a problem arises, click on the relevant green field.", spanish: "⇒ Si surge un problema, haga clic en el campo verde correspondiente.", translation: "⇒ Pokud nastane problém, klikněte na příslušné zelené pole." },
  { id: "TerminalInstruction2", english: "⇒ The field turns red, showing the time since the problem started.", spanish: "⇒ El campo se vuelve rojo y muestra el tiempo desde que inició el problema.", translation: "⇒ Pole zčervená a ukazuje čas od začátku problému." },
  { id: "TerminalInstruction3", english: "⇒ After resolving the issue, click on the red field to change it back to green. ", spanish: "⇒ Después de resolver el problema, haga clic en el campo rojo para regresarlo a verde.", translation: "⇒ Po vyřešení problému klikněte na červené pole a změňte jej zpět na zelené." },
  { id: "TypeOfDetail", english: "Type of detail", spanish: "Tipo de detalle", translation: "Typ detailu" },
  { id: "WhatIsAndon", english: "What is Andon?", spanish: "¿Qué es Andon?", translation: "Co je to Andon?" },
  { id: "Workcenter", english: "Workcenter", spanish: "Estación de trabajo", translation: "Pracoviště" },
  { id: "WorkcenterID", english: "Workcenter ID", spanish: "ID de estación", translation: "ID pracoviště" },
  { id: "WorkcenterIDUnique", english: "Workcenter ID (unique)", spanish: "ID de estación (único)", translation: "ID pracoviště (jedinečné)" },
  { id: "WorkcenterNameZh", english: "Workcenter Name (Chinese)", spanish: "Nombre de estación (chino)", translation: "Název pracoviště (čínsky)" },
  { id: "WorkcenterName", english: "Workcenter Name", spanish: "Nombre de estación", translation: "Název pracoviště" },
  { id: "WorkcenterRow", english: "Workcenter Row", spanish: "Orden de estación", translation: "Pořadí pracoviště" },
  { id: "WORKCENTERS", english: "WORKCENTERS", spanish: "ESTACIONES DE TRABAJO", translation: "PRACOVIŠTĚ" },
  { id: "Yes", english: "Yes", spanish: "Sí", translation: "Ano" },
];

// Failure location/type options are stored in their original text; these rows translate them for display.
const optionTranslations: Record<string, string> = {
  Loading: "Carga",
  Robot: "Robot",
  Pressing: "Prensado",
  Machining: "Maquinado",
  Assembly: "Ensamble",
  Welding: "Soldadura",
  Soldering: "Soldadura con estaño",
  Cutting: "Corte",
  "Injection Molding": "Moldeo por inyección",
  Extrusion: "Extrusión",
  Painting: "Pintura",
  Coating: "Recubrimiento",
  "Laser Cutting": "Corte láser",
  Testing: "Pruebas",
  "Quality Control": "Control de calidad",
  "Material Handling": "Manejo de materiales",
  Packaging: "Empaque",
  "Heat Treating": "Tratamiento térmico",
  Casting: "Fundición",
  Forming: "Formado",
  Grinding: "Rectificado",
  Deburring: "Rebabeo",
  Polishing: "Pulido",
  "Mechanical failure": "Falla mecánica",
  "Electrical failure": "Falla eléctrica",
  "Software failure": "Falla de software",
};
for (const [english, spanish] of Object.entries(optionTranslations)) {
  localization.push({ id: `Option.${english}`, english, spanish, translation: english });
}

const DEFAULT_AREA_ID = 1;

const shifts = [
  { id: 1, name: "1st", startTime: "06:00", endTime: "14:00", days: "1,2,3,4,5" },
  { id: 2, name: "2nd", startTime: "14:00", endTime: "22:00", days: "1,2,3,4,5" },
  { id: 3, name: "3rd", startTime: "22:00", endTime: "06:00", days: "1,2,3,4,5" },
];

const configTexts: { id: string; english: string; spanish: string }[] = [
  { id: "AREAS", english: "AREAS", spanish: "ÁREAS" },
  { id: "Area", english: "Area", spanish: "Área" },
  { id: "AreaName", english: "Area name", spanish: "Nombre del área" },
  { id: "NoArea", english: "-- No area --", spanish: "-- Sin área --" },
  { id: "SortOrder", english: "Order", spanish: "Orden" },
  { id: "Active", english: "Active", spanish: "Activo" },
  { id: "AddArea", english: "Add area", spanish: "Agregar área" },
  { id: "SCREENS", english: "SCREENS (TV)", spanish: "PANTALLAS (TV)" },
  { id: "ScreenName", english: "Screen name", spanish: "Nombre de pantalla" },
  { id: "Volume", english: "Volume", spanish: "Volumen" },
  { id: "SoundEnabled", english: "Sound", spanish: "Sonido" },
  { id: "KioskAddress", english: "Kiosk address", spanish: "Dirección para el kiosco" },
  { id: "AddScreen", english: "Add screen", spanish: "Agregar pantalla" },
  { id: "SHIFTS", english: "SHIFTS", spanish: "TURNOS" },
  { id: "ShiftName", english: "Shift name", spanish: "Nombre del turno" },
  { id: "ShiftStart", english: "Start", spanish: "Inicio" },
  { id: "ShiftEnd", english: "End", spanish: "Fin" },
  { id: "Days", english: "Days", spanish: "Días" },
  { id: "AddShift", english: "Add shift", spanish: "Agregar turno" },
  { id: "ShiftCrossesMidnight", english: "A shift that ends before it starts continues into the next day.", spanish: "Un turno que termina antes de su hora de inicio continúa al día siguiente." },
  { id: "Day1", english: "Mon", spanish: "Lun" },
  { id: "Day2", english: "Tue", spanish: "Mar" },
  { id: "Day3", english: "Wed", spanish: "Mié" },
  { id: "Day4", english: "Thu", spanish: "Jue" },
  { id: "Day5", english: "Fri", spanish: "Vie" },
  { id: "Day6", english: "Sat", spanish: "Sáb" },
  { id: "Day7", english: "Sun", spanish: "Dom" },
  { id: "GATEWAY", english: "GATEWAY (MODBUS TCP)", spanish: "GATEWAY (MODBUS TCP)" },
  { id: "GatewayNote", english: "Connection used by the acquisition service (phase 2).", spanish: "Conexión que usará el servicio de adquisición (fase 2)." },
  { id: "GatewayHost", english: "Gateway IP / host", spanish: "IP / host del gateway" },
  { id: "Port", english: "Port", spanish: "Puerto" },
  { id: "PollInterval", english: "Poll interval (ms)", spanish: "Intervalo de lectura (ms)" },
  { id: "TimeoutMs", english: "Timeout (ms)", spanish: "Tiempo de espera (ms)" },
  { id: "WatchdogCycles", english: "Failed polls before \"no communication\"", spanish: "Lecturas fallidas para \"sin comunicación\"" },
  { id: "Save", english: "Save", spanish: "Guardar" },
  { id: "Saved", english: "Saved", spanish: "Guardado" },
  { id: "BUTTONS", english: "BUTTONS", spanish: "BOTONES" },
  { id: "ButtonsNote", english: "Modbus fields stay empty until the gateway register map (DOCA0241EN) is available.", spanish: "Los campos Modbus quedan vacíos hasta tener el mapa de registros del gateway (DOCA0241EN)." },
  { id: "Name", english: "Name", spanish: "Nombre" },
  { id: "Department", english: "Department", spanish: "Departamento" },
  { id: "ModbusUnitId", english: "Modbus virtual server ID", spanish: "ID servidor virtual Modbus" },
  { id: "RegisterAddress", english: "Register address", spanish: "Dirección de registro" },
  { id: "ReadType", english: "Read type", spanish: "Tipo de lectura" },
  { id: "ReadBit", english: "Bit", spanish: "Bit" },
  { id: "ReadCounter", english: "Counter", spanish: "Contador" },
  { id: "AddButton", english: "Add button", spanish: "Agregar botón" },
  { id: "Delete", english: "Delete", spanish: "Eliminar" },
  { id: "SaveChanges", english: "Save changes", spanish: "Guardar cambios" },
  { id: "Discard", english: "Discard", spanish: "Descartar" },
  { id: "UnsavedChanges", english: "Unsaved changes", spanish: "Cambios sin guardar" },
  { id: "ChangesSaved", english: "Changes saved", spanish: "Cambios guardados" },
  { id: "Rejected", english: "Rejected", spanish: "Rechazado" },
  { id: "SavedCount", english: "saved", spanish: "guardados" },
  { id: "ItemAdded", english: "Added", spanish: "Agregado" },
  { id: "ItemDeleted", english: "Deleted", spanish: "Eliminado" },
  { id: "ConfirmDelete", english: "Delete this item? This cannot be undone.", spanish: "¿Eliminar este elemento? No se puede deshacer." },
  { id: "ConfirmReset", english: "Reset all interface settings to their defaults?", spanish: "¿Restablecer toda la configuración de interfaz a sus valores predeterminados?" },
  { id: "LeaveWithoutSaving", english: "You have unsaved changes. Leave without saving?", spanish: "Tienes cambios sin guardar. ¿Salir sin guardar?" },
  { id: "Stay", english: "Stay", spanish: "Quedarme" },
  { id: "Leave", english: "Leave without saving", spanish: "Salir sin guardar" },
  { id: "NoAreaLabel", english: "No area", spanish: "Sin área" },
  { id: "AreaNotFound", english: "Area not found", spanish: "Área no encontrada" },
  { id: "NoStationsInArea", english: "No stations in this area", spanish: "No hay estaciones en esta área" },
  { id: "Stations", english: "stations", spanish: "estaciones" },
  { id: "OpenAlarms", english: "open alarms", spanish: "alarmas abiertas" },
  { id: "ChineseTranslateNote", english: "Use Translate to fill the Chinese name from the Spanish/English name, then save. It never translates from Chinese.", spanish: "Usa Traducir para llenar el nombre en chino a partir del nombre en español/inglés y luego guarda. Nunca traduce desde el chino." },
  { id: "Translate", english: "Translate", spanish: "Traducir" },
  { id: "NoData", english: "No data for this selection", spanish: "Sin datos para esta selección" },
  { id: "AlarmsByStation", english: "Alarms by station", spanish: "Alarmas por estación" },
  { id: "AlarmsByDepartment", english: "Alarms by department", spanish: "Alarmas por departamento" },
  { id: "Actor_button", english: "Button", spanish: "Botón" },
  { id: "Actor_computer", english: "Computer", spanish: "Computadora" },
  { id: "Actor_simulated", english: "Simulated (test)", spanish: "Simulado (prueba)" },
  { id: "Actor_system", english: "System", spanish: "Sistema" },
  { id: "Actor_migrated", english: "Imported", spanish: "Importado" },
  { id: "Result_opened", english: "Opened", spanish: "Abrió" },
  { id: "Result_ignored", english: "Ignored (lockout)", spanish: "Ignorada (bloqueo)" },
  { id: "Result_closed", english: "Closed", spanish: "Cerró" },
  { id: "OpenedBy", english: "Opened by", spanish: "Abierta por" },
  { id: "ClosedBy", english: "Closed by", spanish: "Cerrada por" },
  { id: "State", english: "State", spanish: "Estado" },
  { id: "StateOpen", english: "Open", spanish: "Abierta" },
  { id: "StateClosed", english: "Closed", spanish: "Cerrada" },
  { id: "OpenAlarm", english: "Open alarm", spanish: "Abrir alarma" },
  { id: "CloseAlarm", english: "Close alarm", spanish: "Cerrar alarma" },
  { id: "AlarmOpened", english: "Alarm opened", spanish: "Alarma abierta" },
  { id: "AlarmClosed", english: "Alarm closed", spanish: "Alarma cerrada" },
  { id: "NoOpenAlarm", english: "No open alarm", spanish: "Sin alarma abierta" },
  { id: "SimulatePress", english: "Simulate button press", spanish: "Simular pulsación de botón" },
  { id: "SimulatePressHint", english: "Test tool: follows the physical button rule and does not count in statistics.", spanish: "Herramienta de prueba: sigue la regla del botón físico y no cuenta en las estadísticas." },
  { id: "RecentPresses", english: "Recent button presses", spanish: "Últimas pulsaciones" },
  { id: "Time", english: "Time", spanish: "Hora" },
  { id: "Source", english: "Source", spanish: "Origen" },
  { id: "PressResult", english: "Result", spanish: "Resultado" },
  { id: "NoPressesYet", english: "No button presses yet", spanish: "Aún no hay pulsaciones" },
  { id: "WorkcenterNotFound", english: "Station not found", spanish: "Estación no encontrada" },
  { id: "StationPageNote", english: "Normal operation is with the physical buttons. Use this page when a button fails.", spanish: "La operación normal es con los botones físicos. Usa esta página cuando un botón falle." },
  { id: "NoButtonsYet", english: "No buttons configured yet", spanish: "Aún no hay botones configurados" },
  { id: "TranslateNeedsName", english: "Type the Spanish/English name first.", spanish: "Primero escribe el nombre en español/inglés." },
  // TEST-BUTTONS: remove with module (temporary button-panel test page)
  { id: "TestButtons.Menu", english: "Test buttons", spanish: "Botoneras de prueba" },
  { id: "TestButtons.Title", english: "Test button panels", spanish: "Botoneras de prueba" },
  { id: "TestButtons.Warning", english: "Test tool: each click acts as a physical button press. Its alarms are marked as simulated and do not count in statistics.", spanish: "Herramienta de prueba: cada clic actúa como una pulsación del botón físico. Sus alarmas se marcan como simuladas y no cuentan en estadísticas." },
  { id: "TestButtons.SelectArea", english: "Area", spanish: "Área" },
  { id: "TestButtons.LastPress", english: "Last press", spanish: "Última pulsación" },
  { id: "TestButtons.NoPress", english: "No presses yet", spanish: "Sin pulsaciones" },
  // end TEST-BUTTONS
];
for (const text of configTexts) {
  if (!localization.some((l) => l.id === text.id)) localization.push({ ...text, translation: text.english });
}

async function main() {
  await prisma.area.upsert({ where: { id: DEFAULT_AREA_ID }, update: {}, create: { id: DEFAULT_AREA_ID, name: "Área 1", sortOrder: 1 } });
  for (const w of workcenters) {
    await prisma.workcenter.upsert({ where: { workcenterRow: w.workcenterRow }, update: {}, create: { ...w, areaId: DEFAULT_AREA_ID } });
  }
  await prisma.screen.upsert({ where: { id: 1 }, update: {}, create: { id: 1, name: "TV Área 1", areaId: DEFAULT_AREA_ID } });
  for (const shift of shifts) {
    await prisma.shift.upsert({ where: { id: shift.id }, update: {}, create: shift });
  }
  await prisma.gatewayConfig.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } });
  for (const s of statusDefinitions) {
    await prisma.statusDefinition.upsert({ where: { statusRow: s.statusRow }, update: {}, create: s });
  }
  for (const s of settings) {
    await prisma.settings.upsert({ where: { settingId: s.settingId }, update: { possibleSettings: s.possibleSettings }, create: s });
  }
  // Databases seeded before Spanish existed may still point at the old "Translation" option.
  await prisma.settings.updateMany({ where: { settingName: "Language", currentSetting: { notIn: ["English", "Spanish"] } }, data: { currentSetting: "English" } });
  for (const l of localization) {
    await prisma.localization.upsert({ where: { id: l.id }, update: { english: l.english, spanish: l.spanish }, create: l });
  }
  console.log("Seed complete.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
