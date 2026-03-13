import { apiRequest } from "../https";
import { API_PATHS } from "../constants/constants";
import {
  SubscriptionResponse,
  UpdateSubscriptionRequest,
} from "../dto/SubscriptionResponse";

/* ======================================================
   LANDLORD (SELF)
====================================================== */

/** GET /api/subscriptions/me */
export const fetchMySubscription = () =>
  apiRequest<null, SubscriptionResponse>({
    path: API_PATHS.MY_SUBSCRIPTION,
    method: "GET",
  });

/** POST /api/subscriptions/me/upgrade */
export const upgradeMySubscription = (data: UpdateSubscriptionRequest) =>
  apiRequest<UpdateSubscriptionRequest, SubscriptionResponse>({
    path: API_PATHS.UPGRADE_MY_SUBSCRIPTION,
    method: "POST",
    body: data,
  });

/** POST /api/subscriptions/me/renew */
export const renewMySubscription = () =>
  apiRequest<null, SubscriptionResponse>({
    path: API_PATHS.RENEW_MY_SUBSCRIPTION,
    method: "POST",
  });

/* ======================================================
   ADMIN
====================================================== */

/** GET /api/subscriptions */
export const fetchAllSubscriptions = () =>
  apiRequest<null, SubscriptionResponse[]>({
    path: API_PATHS.SUBSCRIPTIONS,
    method: "GET",
  });

/** GET /api/subscriptions/{landlordId} */
export const fetchSubscriptionByLandlord = (landlordId: number) =>
  apiRequest<null, SubscriptionResponse>({
    path: API_PATHS.SUBSCRIPTION_BY_LANDLORD(landlordId),
    method: "GET",
  });

/** POST /api/subscriptions/{landlordId}/suspend */
export const suspendSubscription = (landlordId: number) =>
  apiRequest<null, SubscriptionResponse>({
    path: API_PATHS.SUSPEND_SUBSCRIPTION(landlordId),
    method: "POST",
  });

/** POST /api/subscriptions/{landlordId}/renew */
export const renewSubscriptionAdmin = (landlordId: number) =>
  apiRequest<null, SubscriptionResponse>({
    path: API_PATHS.RENEW_SUBSCRIPTION(landlordId),
    method: "POST",
  });