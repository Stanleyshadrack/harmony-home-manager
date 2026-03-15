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

export const waterReadingsApi = {
  /* ===============================
     Fetch All Readings
  =============================== */
  fetchAll: () =>
    apiRequest<null, WaterReadingResponse[]>({
      path: API_PATHS.WATER_READINGS,
      method: "GET",
    }),

  /* ===============================
     Fetch Reading By ID
  =============================== */
  getById: (id: number) =>
    apiRequest<null, WaterReadingResponse>({
      path: API_PATHS.WATER_READING_BY_ID(id),
      method: "GET",
    }),

  /* ===============================
     Create Reading
  =============================== */
  create: (data: CreateWaterReadingRequest) =>
    apiRequest<CreateWaterReadingRequest, WaterReadingResponse>({
      path: API_PATHS.CREATE_WATER_READING,
      method: "POST",
      body: data,
    }),

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
  reject: (id: number) =>
    apiRequest<null, void>({
      path: API_PATHS.REJECT_WATER_READING(id),
      method: "PUT",
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
    }),

  /* ===============================
     Get Last Reading for Unit
  =============================== */
  getLastReading: (unitId: number) =>
    apiRequest<null, WaterReadingResponse>({
      path: API_PATHS.LAST_READING_BY_UNIT(unitId),
      method: "GET",
    }),

  /* ===============================
     Get Readings By Property
  =============================== */
  getByProperty: (propertyName: string) =>
    apiRequest<null, WaterReadingResponse[]>({
      path: API_PATHS.WATER_READINGS_BY_PROPERTY(propertyName),
      method: "GET",
    }),

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
