import { API_PATHS } from "../constants/constants";
import {
  CreateWaterReadingRequest,
  HighUsageResponse,
  MonthlyWaterStats,
  WaterReadingResponse,
  WaterStatsResponse,
} from "../dto/water.readings.dto";
import { apiRequest } from "../https";

/* ===============================
   Water Readings API
================================ */

// Normalize the backend propertyName field for the existing Water Data UI.
const normalize = (r: WaterReadingResponse): WaterReadingResponse =>
  ({...r, property: r.property || r.propertyName || ''});
export const waterReadingsApi = {
  /* ===============================
     Fetch All Readings
  =============================== */
  fetchAll: () =>
    apiRequest<null, WaterReadingResponse[]>({
      path: API_PATHS.WATER_READINGS,
      method: "GET",
    }).then(rows => rows.map(normalize)),

  /* ===============================
     Fetch Reading By ID
  =============================== */
  getById: (id: number) =>
    apiRequest<null, WaterReadingResponse>({
      path: API_PATHS.WATER_READING_BY_ID(id),
      method: "GET",
    }).then(normalize),

  /* ===============================
     Create Reading
  =============================== */
  create: (data: CreateWaterReadingRequest) =>
    apiRequest<CreateWaterReadingRequest, WaterReadingResponse>({
      path: API_PATHS.CREATE_WATER_READING,
      method: "POST",
      body: data,
    }).then(normalize),

  /* ===============================
     Approve Reading
  =============================== */
  approve: (id: number) =>
    apiRequest<null, void>({
      path: API_PATHS.APPROVE_WATER_READING(id),
      method: "PUT",
    }),

  /* ===============================
     Reject Reading
  =============================== */
  reject: (id: number, reason: string) =>
    apiRequest<{reason:string}, void>({
      path: API_PATHS.REJECT_WATER_READING(id),
      method: "PUT",
      body: {reason},
    }),

  /* ===============================
     Delete Reading
  =============================== */
  delete: (id: number) =>
    apiRequest<null, void>({
      path: API_PATHS.DELETE_WATER_READING(id),
      method: "DELETE",
    }),

  /* ===============================
     Get Readings By Unit
  =============================== */
  getByUnit: (unitId: number) =>
    apiRequest<null, WaterReadingResponse[]>({
      path: API_PATHS.WATER_READINGS_BY_UNIT(unitId),
      method: "GET",
    }).then(rows => rows.map(normalize)),

  /* ===============================
     Get Last Reading for Unit
  =============================== */
  getLastReading: (unitId: number) =>
    apiRequest<null, WaterReadingResponse>({
      path: API_PATHS.LAST_READING_BY_UNIT(unitId),
      method: "GET",
    }).then(normalize),

  /* ===============================
     Get Readings By Property
  =============================== */
  getByProperty: (propertyName: string) =>
    apiRequest<null, WaterReadingResponse[]>({
      path: API_PATHS.WATER_READINGS_BY_PROPERTY(propertyName),
      method: "GET",
    }).then(rows => rows.map(normalize)),

  /* ===============================
     High Usage Detection
  =============================== */
  getHighUsage: () =>
    apiRequest<null, HighUsageResponse[]>({
      path: API_PATHS.WATER_HIGH_USAGE,
      method: "GET",
    }),

  /* ===============================
     Water Stats
  =============================== */
  getStats: () =>
    apiRequest<null, WaterStatsResponse>({
      path: API_PATHS.WATER_STATS,
      method: "GET",
    }),

  /* ===============================
     Monthly Stats
  =============================== */
  getMonthlyStats: () =>
    apiRequest<null, MonthlyWaterStats[]>({
      path: API_PATHS.WATER_MONTHLY_STATS,
      method: "GET",
    }),
};
