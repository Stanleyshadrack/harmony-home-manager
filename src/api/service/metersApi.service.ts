import { API_PATHS } from "../constants/constants";
import { WaterMeter, WaterMeterStats } from "../dto/WaterMeterDTO";
import { apiRequest } from "../https";



export const metersApi = {

  /* =========================
     📄 Fetch ALL meters
  ========================= */
  fetchAll: () =>
    apiRequest<null, WaterMeter[]>({
      path: API_PATHS.METERS,
      method: "GET",
    }),

  /* =========================
     🔍 Fetch meters by property
  ========================= */
  fetchByProperty: (propertyId: number | string) =>
    apiRequest<null, WaterMeter[]>({
      path: API_PATHS.METERS_BY_PROPERTY(propertyId),
      method: "GET",
    }),

  /* =========================
     🔍 Fetch meters by unit
  ========================= */
  fetchByUnit: (unitId: number | string) =>
    apiRequest<null, WaterMeter[]>({
      path: API_PATHS.METERS_BY_UNIT(unitId),
      method: "GET",
    }),

  /* =========================
     ➕ Create meter
  ========================= */
  create: (meter: WaterMeter) =>
    apiRequest<WaterMeter, WaterMeter>({
      path: API_PATHS.CREATE_METER,
      method: "POST",
      body: meter,
    }),

  /* =========================
     ✏️ Update meter
  ========================= */
  update: (id: number, meter: WaterMeter) =>
    apiRequest<WaterMeter, WaterMeter>({
      path: API_PATHS.UPDATE_METER(id),
      method: "PUT",
      body: meter,
    }),

    /* =========================
   🔗 Assign meter to unit
========================= */
assignUnit: (meterId: number | string, unitId: number | string) =>
  apiRequest<null, WaterMeter>({
    path: API_PATHS.ASSIGN_METER(meterId, unitId),
    method: "PUT",
  }),

  /* =========================
     ❌ Delete meter
  ========================= */
  delete: (id: number) =>
    apiRequest<null, void>({
      path: API_PATHS.DELETE_METER(id),
      method: "DELETE",
    }),

  /* =========================
     📊 Dashboard stats
  ========================= */
  getStats: () =>
    apiRequest<null, WaterMeterStats>({
      path: API_PATHS.METERS_STATS,
      method: "GET",
    }),
};