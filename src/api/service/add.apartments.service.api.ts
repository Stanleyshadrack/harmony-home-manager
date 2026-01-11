import { createRequest } from "@/apiActions/meta.payload.wrapper";
import { apiRequest } from "../https";

import { ApartmentApiResponse, ApartmentFormData } from "../dto/apartmentApiResponse";

export const ApartmentsApi = {
  add: async (data: ApartmentFormData) => {
    const payload = createRequest(
      {
        name: data.name,
        address: data.location,
        status: data.status,
        unitTypes: data.unitType,
        waterUnitCost: data.waterUnitCost,
      },
      "ADD_APARTMENTS"
    );

    return apiRequest<typeof payload, ApartmentApiResponse>({
      path: ADD_APARTMENT_URL,
      method: "POST",
      body: payload,
    });
  },

  fetchAll: () =>
    apiRequest<null, ApartmentApiResponse[]>({
      path: "apartments",
      method: "GET",
    }),
};
