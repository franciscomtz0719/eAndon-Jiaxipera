import type {
  AlarmEvent,
  Area,
  Bootstrap,
  ButtonPress,
  Device,
  GatewayConfig,
  Screen,
  Shift,
  StatisticsBreakdown,
  StatisticsSummary,
  Workcenter,
} from "./types";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Request to ${path} failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  getBootstrap: () => request<Bootstrap>("/bootstrap"),
  getWorkcenters: () => request<Workcenter[]>("/workcenters"),
  getWorkcenter: (id: string) => request<Workcenter>(`/workcenters/${encodeURIComponent(id)}`),

  addWorkcenter: (data: { workcenterId: string; workcenterName: string; workcenterNameZh: string; areaId: number | null }) =>
    request<Workcenter>("/workcenters", { method: "POST", body: JSON.stringify(data) }),
  /** Spanish/English → Chinese only; the server rejects names that already contain Chinese. */
  translateToChinese: (text: string) =>
    request<{ text: string }>("/translate/zh", { method: "POST", body: JSON.stringify({ text }) }).then((r) => r.text),
  updateWorkcenter: (row: number, data: { workcenterName?: string; workcenterNameZh?: string; workcenterId?: string; areaId?: number | null }) =>
    request<Workcenter>(`/workcenters/${row}`, { method: "PATCH", body: JSON.stringify(data) }),
  moveWorkcenter: (row: number, direction: "up" | "down") =>
    request(`/workcenters/${row}/move`, { method: "POST", body: JSON.stringify({ direction }) }),
  deleteWorkcenter: (row: number) => request(`/workcenters/${row}`, { method: "DELETE" }),

  /** Open alarms, optionally only for one area ("none" = stations without area). */
  getOpenEvents: (areaId?: string) => request<AlarmEvent[]>(`/events/open${areaId ? `?areaId=${encodeURIComponent(areaId)}` : ""}`),
  getEvents: (params: { areaId?: string; workcenterId?: string; state?: "open" | "closed"; startDate?: string; endDate?: string; limit?: string }) =>
    request<AlarmEvent[]>(`/events?${new URLSearchParams(cleanParams(params)).toString()}`),
  /** Computer (admin page): opens with optional details. */
  openAlarm: (data: { workcenterId: string; statusRow: number; detailLocation?: string; detailType?: string; detailText?: string }) =>
    request<AlarmEvent>("/events", { method: "POST", body: JSON.stringify(data) }),
  closeAlarm: (eventId: number) => request<AlarmEvent>(`/events/${eventId}/close`, { method: "POST" }),
  /** Test tool: follows the physical button rule (lockout included). */
  simulatePress: (workcenterId: string, statusRow: number) =>
    request<{ result: ButtonPress["result"]; event: AlarmEvent }>("/presses", { method: "POST", body: JSON.stringify({ workcenterId, statusRow, source: "simulated" }) }),
  getPresses: (workcenterId: string, limit = 20) => request<ButtonPress[]>(`/presses?workcenterId=${encodeURIComponent(workcenterId)}&limit=${limit}`),

  /** areaId is an area id or "none" for stations without area. */
  getStatistics: (params: { areaId: string; startDate?: string; endDate?: string; workcenterId?: string }) =>
    request<StatisticsSummary>(`/statistics?${new URLSearchParams(cleanParams(params)).toString()}`),
  getStatisticsBreakdown: (params: { areaId: string; startDate?: string; endDate?: string; workcenterId?: string }) =>
    request<StatisticsBreakdown>(`/statistics/breakdown?${new URLSearchParams(cleanParams(params)).toString()}`),

  updateStatusDefinition: (
    statusRow: number,
    data: { statusName?: string; statusEnabled?: boolean; statusDetailsEnabled?: number; iconName?: string },
  ) => request(`/status-definitions/${statusRow}`, { method: "PATCH", body: JSON.stringify(data) }),
  moveStatusDefinition: (statusRow: number, direction: "up" | "down") =>
    request(`/status-definitions/${statusRow}/move`, { method: "POST", body: JSON.stringify({ direction }) }),
  updateStartDetails: (
    statusIndex: number,
    data: { failureLocationOptions: string; failureTypeOptions: string; detailsTextOptions: string },
  ) => request(`/status-definitions/index/${statusIndex}/start-details`, { method: "PATCH", body: JSON.stringify(data) }),

  updateSetting: (settingId: number, value: string) =>
    request(`/settings/${settingId}`, { method: "PATCH", body: JSON.stringify({ value }) }),
  resetSettings: () => request("/settings/reset", { method: "POST" }),

  getAreas: () => request<Area[]>("/areas"),
  addArea: (name: string) => request<Area>("/areas", { method: "POST", body: JSON.stringify({ name }) }),
  updateArea: (id: number, data: Partial<Omit<Area, "id">>) => request<Area>(`/areas/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteArea: (id: number) => request(`/areas/${id}`, { method: "DELETE" }),

  getScreens: () => request<Screen[]>("/screens"),
  addScreen: (name: string, areaId: number | null) => request<Screen>("/screens", { method: "POST", body: JSON.stringify({ name, areaId }) }),
  updateScreen: (id: number, data: Partial<Omit<Screen, "id">>) => request<Screen>(`/screens/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteScreen: (id: number) => request(`/screens/${id}`, { method: "DELETE" }),

  getShifts: () => request<Shift[]>("/shifts"),
  addShift: (data: Omit<Shift, "id" | "active">) => request<Shift>("/shifts", { method: "POST", body: JSON.stringify(data) }),
  updateShift: (id: number, data: Partial<Omit<Shift, "id">>) => request<Shift>(`/shifts/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteShift: (id: number) => request(`/shifts/${id}`, { method: "DELETE" }),

  getGateway: () => request<GatewayConfig>("/gateway"),
  updateGateway: (data: Partial<GatewayConfig>) => request<GatewayConfig>("/gateway", { method: "PATCH", body: JSON.stringify(data) }),

  getDevices: () => request<Device[]>("/devices"),
  addDevice: (workcenterId: string, statusRow: number) => request<Device>("/devices", { method: "POST", body: JSON.stringify({ workcenterId, statusRow }) }),
  updateDevice: (id: number, data: Partial<Omit<Device, "id">>) => request<Device>(`/devices/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteDevice: (id: number) => request(`/devices/${id}`, { method: "DELETE" }),

  updateLocalization: (id: string, spanish: string) =>
    request(`/localization/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify({ spanish }) }),
};

function cleanParams(params: Record<string, string | boolean | undefined>): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") result[key] = String(value);
  }
  return result;
}
