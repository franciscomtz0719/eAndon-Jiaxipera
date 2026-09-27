using eAndon_MVC.Models;

namespace eAndon_MVC
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var host = CreateHostBuilder(args).Build();
            using (var scope = host.Services.CreateScope())
            {
                var services = scope.ServiceProvider;
                try
                {
                    var context = services.GetRequiredService<MyDbContext>();
                    context.Database.EnsureCreated();
                    SeedData(context);
                }
                catch (Exception ex)
                {
                    var logger = services.GetRequiredService<ILogger<Program>>();
                    logger.LogError(ex, "An error occurred while seeding the database.");
                }
            }
            host.Run();
        }

        private static void SeedData(MyDbContext context)
        {
            if (!context.WorkcenterList.Any())
            {
                context.WorkcenterList.AddRange(
                    new Workcenter { WorkcenterRow = 1, WorkcenterID = "A-003", WorkcenterName = "Mixing Station", Status1 = "green", Status2 = "green", Status3 = "green", Status4 = "green", Status5 = "green" },
                    new Workcenter { WorkcenterRow = 2, WorkcenterID = "A-012", WorkcenterName = "Heating Chamber", Status1 = "green", Status2 = "green", Status3 = "green", Status4 = "green", Status5 = "green" },
                    new Workcenter { WorkcenterRow = 3, WorkcenterID = "B-015", WorkcenterName = "Curing Area", Status1 = "green", Status2 = "green", Status3 = "green", Status4 = "green", Status5 = "green" },
                    new Workcenter { WorkcenterRow = 4, WorkcenterID = "B-019", WorkcenterName = "Assembly", Status1 = "green", Status2 = "green", Status3 = "green", Status4 = "green", Status5 = "green" },
                    new Workcenter { WorkcenterRow = 5, WorkcenterID = "C-020", WorkcenterName = "Inspection & Packing", Status1 = "green", Status2 = "green", Status3 = "green", Status4 = "green", Status5 = "green" }
                );
            }

            if (!context.StatusDefinition.Any())
            {
                context.StatusDefinition.AddRange(
                    new StatusDefinition { StatusRow = 1, StatusName = "Machine trouble", StatusEnabled = true, StatusDetailsEnabled = 1, IconName = "fa fa-cogs", AlarmStartText1Structure = "ON|Loading|Robot|Pressing|Machining|Assembly|Welding|Soldering|Cutting|Injection Molding|Extrusion|Painting|Coating|Laser Cutting|Testing|Quality Control|Material Handling|Packaging|Heat Treating|Casting|Forming|Grinding|Deburring|Polishing", AlarmStartText2Structure = "ON|Mechanical failure|Electrical failure|Software failure", AlarmStartText3Structure = "ON|", AlarmEndText1Structure = "OFF", AlarmEndText2Structure = "OFF", AlarmEndText3Structure = "OFF", AlarmEndText4Structure = "OFF" },
                    new StatusDefinition { StatusRow = 2, StatusName = "Quality issue", StatusEnabled = true, StatusDetailsEnabled = 0, IconName = "fa fa-search", AlarmStartText1Structure = "OFF", AlarmStartText2Structure = "OFF", AlarmStartText3Structure = "OFF", AlarmEndText1Structure = "OFF", AlarmEndText2Structure = "OFF", AlarmEndText3Structure = "OFF", AlarmEndText4Structure = "OFF" },
                    new StatusDefinition { StatusRow = 3, StatusName = "Material shortage", StatusEnabled = true, StatusDetailsEnabled = 1, IconName = "fa fa-bars", AlarmStartText1Structure = "OFF", AlarmStartText2Structure = "OFF", AlarmStartText3Structure = "ON", AlarmEndText1Structure = "OFF", AlarmEndText2Structure = "OFF", AlarmEndText3Structure = "OFF", AlarmEndText4Structure = "OFF" },
                    new StatusDefinition { StatusRow = 4, StatusName = "Process abnormality", StatusEnabled = true, StatusDetailsEnabled = 0, IconName = "fa fa-thermometer-full", AlarmStartText1Structure = "OFF", AlarmStartText2Structure = "OFF", AlarmStartText3Structure = "OFF", AlarmEndText1Structure = "OFF", AlarmEndText2Structure = "OFF", AlarmEndText3Structure = "OFF", AlarmEndText4Structure = "OFF" },
                    new StatusDefinition { StatusRow = 5, StatusName = "Teamleader needed", StatusEnabled = true, StatusDetailsEnabled = 0, IconName = "fa fa-street-view", AlarmStartText1Structure = "OFF", AlarmStartText2Structure = "OFF", AlarmStartText3Structure = "OFF", AlarmEndText1Structure = "OFF", AlarmEndText2Structure = "OFF", AlarmEndText3Structure = "OFF", AlarmEndText4Structure = "OFF" }
                );
            }

            if (!context.Settings.Any())
            {
                context.Settings.AddRange(
                    new Settings { SettingID = 1, SettingName = "Language", CurrentSetting = "English", PossibleSettings = "English|Translation", DefaultSetting = "English" },
                    new Settings { SettingID = 2, SettingName = "Show workcenter name?", CurrentSetting = "Yes", PossibleSettings = "Yes|No", DefaultSetting = "Yes" },
                    new Settings { SettingID = 3, SettingName = "Show only workcenters with alarms in Overivew?", CurrentSetting = "No", PossibleSettings = "Yes|No", DefaultSetting = "No" }
                );
            }

            if (!context.Localization.Any())
            {
                context.Localization.AddRange(
                    new Localization { Id = "AddWorkcenter", English = "Add workcenter", Translation = "Přidej pracoviště" },
                    new Localization { Id = "AlarmEndDate", English = "Ending Date", Translation = "Koncové datum" },
                    new Localization { Id = "AlarmEndTime", English = "Alarm End", Translation = "Konec alarmu" },
                    new Localization { Id = "AlarmHistory", English = "Alarm History for workcenter ", Translation = "Historie alarmů na pracovišti " },
                    new Localization { Id = "AlarmLog", English = "Alarm Log", Translation = "Záznamy" },
                    new Localization { Id = "AlarmName", English = "Alarm Type", Translation = "Typ alarmu" },
                    new Localization { Id = "AlarmOverview", English = "Alarm Overview", Translation = "Přehled alarmů" },
                    new Localization { Id = "AlarmRow", English = "Alarm Row", Translation = "Pořadí alarmu" },
                    new Localization { Id = "AlarmStartDate", English = "Starting Date", Translation = "Počáteční datum" },
                    new Localization { Id = "AlarmStartDetails", English = "Enter details to start the alarm", Translation = "Zadej detaily pro spuštění alarmu" },
                    new Localization { Id = "AlarmStartTime", English = "Alarm Start", Translation = "Začátek alarmu" },
                    new Localization { Id = "AlarmStatistics", English = "Alarm Statistics", Translation = "Statistiky alarmů" },
                    new Localization { Id = "AlarmTypeEnabled", English = "Alarm Type Enabled", Translation = "Typ alarmu aktivní" },
                    new Localization { Id = "AlarmTypeIcon", English = "Alarm Type Icon", Translation = "Ikona typu alarmu" },
                    new Localization { Id = "AlarmTypeName", English = "Alarm Type Name", Translation = "Jméno typu alarmu" },
                    new Localization { Id = "ALARMTYPES", English = "ALARM TYPES", Translation = "TYPY ALARMŮ" },
                    new Localization { Id = "AlarmTypesForWorkcenter", English = "Alarm types for Workcenter ", Translation = "Typy alarmů pro pracoviště " },
                    new Localization { Id = "All", English = "All", Translation = "Vše" },
                    new Localization { Id = "Cancel", English = "Cancel", Translation = "Zrušit" },
                    new Localization { Id = "ChooseIcon", English = "Choose Icon", Translation = "Vyber ikonu" },
                    new Localization { Id = "Close", English = "Close", Translation = "Zavřít" },
                    new Localization { Id = "ConfirmAlarm", English = "Confirm Alarm", Translation = "Potvrdit alarm" },
                    new Localization { Id = "CurrentValue", English = "Current value", Translation = "Současná hodnota" },
                    new Localization { Id = "DefaultText", English = "Default text (English)", Translation = "Standardní text (angličtina)" },
                    new Localization { Id = "DefineAlarmStartDetails", English = "Define alarm start details - ", Translation = "Definuj detaily pro začátek alarmu - " },
                    new Localization { Id = "DeleteWorkcenter", English = "Delete workcenter", Translation = "Smaž pracovíště" },
                    new Localization { Id = "DetailEnabled", English = "Detail enabled", Translation = "Detail aktivní" },
                    new Localization { Id = "DetailsFree", English = "Details (free text field)", Translation = "Detaily (volné textové pole)" },
                    new Localization { Id = "DetailsOptional", English = "Details (optional)", Translation = "Detaily (nepovinné)" },
                    new Localization { Id = "DurationMin", English = "Alarm Duration (min)", Translation = "Trvání alarmu (min)" },
                    new Localization { Id = "Enabled", English = "Enabled", Translation = "Aktivní" },
                    new Localization { Id = "EnabledForEnd", English = "Enabled for alarm end", Translation = "Zapnuty pro konec alarmů" },
                    new Localization { Id = "EnabledForStart", English = "Enabled for alarm start", Translation = "Zapnuty pro začátek alarmů" },
                    new Localization { Id = "EnabledForStartEnd", English = "Enabled for alarm start & end", Translation = "Zapnuty pro začátek i konec alarmů" },
                    new Localization { Id = "FailureDetails", English = "Failure Details", Translation = "Detaily problému" },
                    new Localization { Id = "FailureLocation", English = "Failure Location", Translation = "Místo problému" },
                    new Localization { Id = "FailureLocationForWorkcenter", English = "Failure locations for Workcenter ", Translation = "Místa problémů pro pracoviště " },
                    new Localization { Id = "FailureType", English = "Failure Type", Translation = "Typ problému" },
                    new Localization { Id = "FailureTypesForworkcenter", English = "Failure types for Workcenter ", Translation = "Typy problémů pro pracoviště " },
                    new Localization { Id = "INTERFACESETTINGS", English = "INTERFACE SETTINGS", Translation = "NASTAVENÍ PROSTŘEDÍ" },
                    new Localization { Id = "LOCALIZATION", English = "LOCALIZATION", Translation = "PŘEKLAD" },
                    new Localization { Id = "LocalizedText", English = "Localized text (translation)", Translation = "Přeložený text" },
                    new Localization { Id = "MTBF", English = "Mean time between failures (MTBF)", Translation = "Střední doba mezi poruchami (MTBF)" },
                    new Localization { Id = "MTTR", English = "Mean time to repair (MTTR)", Translation = "Střední doba opravy (MTTR)" },
                    new Localization { Id = "No", English = "No", Translation = "Ne" },
                    new Localization { Id = "NoDetailsEnabled", English = "No details enabled", Translation = "Detaily vypnuty" },
                    new Localization { Id = "NoOfFinishedAlarms", English = "Nr. of finished alarms", Translation = "Počet ukončených alarmů" },
                    new Localization { Id = "NoWorkcentersWithActiveAlarms", English = "--  No workcenters with active alarms --", Translation = "-- Žádná pracovíště s aktivními alarmy --" },
                    new Localization { Id = "NumberOfAlarms", English = "Number of Alarms", Translation = "Počet alarmů" },
                    new Localization { Id = "OptionsSeparated", English = "Options (separated by | )", Translation = "Volby (oddělené | )" },
                    new Localization { Id = "PercentageOfTotal", English = "Percentage of Total", Translation = "Procento z celku" },
                    new Localization { Id = "ResetToDefaultSettings", English = "Reset to default settings", Translation = "Vrátit původní nastavení" },
                    new Localization { Id = "SaveAndClose", English = "Save and close", Translation = "Uložit a zavřít" },
                    new Localization { Id = "SaveID", English = "Save ID", Translation = "Ulož ID" },
                    new Localization { Id = "SaveName", English = "Save name", Translation = "Ulož jméno" },
                    new Localization { Id = "SaveText", English = "Save text", Translation = "Ulož text" },
                    new Localization { Id = "SelectOption", English = "-- Select option --", Translation = "-- Zvol možnost --" },
                    new Localization { Id = "SettingName", English = "Setting name", Translation = "Jméno nastavení" },
                    new Localization { Id = "Settings", English = "Settings", Translation = "Nastavení" },
                    new Localization { Id = "ShowLogEntries", English = "Show Log Entries", Translation = "Ukaž záznamy" },
                    new Localization { Id = "ShowOnlyActiveAlarms", English = " Show only workcenters with active alarms", Translation = " Zobraz pouze pracoviště s aktivními alarmy" },
                    new Localization { Id = "ShowOnlyFinishedAlarms", English = "Show only finished alarms:", Translation = "Ukaž pouze ukončené alarmy:" },
                    new Localization { Id = "ShowStatistics", English = "Show Statistics", Translation = "Ukaž statistiku" },
                    new Localization { Id = "TerminalHeader", English = "Andon Terminal for workcenter", Translation = "Andon terminál pro pracoviště" },
                    new Localization { Id = "TerminalInstruction1", English = "⇒ If a problem arises, click on the relevant green field.", Translation = "⇒ Pokud nastane problém, klikněte na příslušné zelené pole." },
                    new Localization { Id = "TerminalInstruction2", English = "⇒ The field turns red, showing the time since the problem started.", Translation = "⇒ Pole zčervená a ukazuje čas od začátku problému." },
                    new Localization { Id = "TerminalInstruction3", English = "⇒ After resolving the issue, click on the red field to change it back to green. ", Translation = "⇒ Po vyřešení problému klikněte na červené pole a změňte jej zpět na zelené." },
                    new Localization { Id = "TypeOfDetail", English = "Type of detail", Translation = "Typ detailu" },
                    new Localization { Id = "WhatIsAndon", English = "What is Andon?", Translation = "Co je to Andon?" },
                    new Localization { Id = "Workcenter", English = "Workcenter", Translation = "Pracoviště" },
                    new Localization { Id = "WorkcenterID", English = "Workcenter ID", Translation = "ID pracoviště" },
                    new Localization { Id = "WorkcenterIDUnique", English = "Workcenter ID (unique)", Translation = "ID pracoviště (jedinečné)" },
                    new Localization { Id = "WorkcenterName", English = "Workcenter Name", Translation = "Název pracoviště" },
                    new Localization { Id = "WorkcenterRow", English = "Workcenter Row", Translation = "Pořadí pracoviště" },
                    new Localization { Id = "WORKCENTERS", English = "WORKCENTERS", Translation = "PRACOVIŠTĚ" },
                    new Localization { Id = "Yes", English = "Yes", Translation = "Ano" }
                );
            }

            context.SaveChanges();
        }

        public static IHostBuilder CreateHostBuilder(string[] args) =>
            Host.CreateDefaultBuilder(args)
                .ConfigureWebHostDefaults(webBuilder =>
                {
                    webBuilder.UseStartup<Startup>();
                });
    }
}