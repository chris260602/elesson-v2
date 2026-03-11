import { ApiErrorType } from "@/const/generalApis";
import {
  BOOKING_QUERY_KEY,
  BRANCH_OPTIONS_QUERY_KEY,
  BRANCH_QUERY_KEY,
  CUSTOMER_HISTORY_QUERY_KEY,
  CUSTOMER_OPTIONS_QUERY_KEY,
  CUSTOMER_QUERY_KEY,
  EMPLOYEE_BY_BRANCH_OPTIONS_QUERY_KEY,
  EMPLOYEE_POSITION_OPTIONS_QUERY_KEY,
  EMPLOYEE_QUERY_KEY,
  INVENTORY_ITEM_CATEGORY_OPTIONS_QUERY_KEY,
  INVENTORY_ITEM_QUERY_KEY,
  PROMOTION_QUERY_KEY,
  ROLE_QUERY_KEY,
  SERVICE_BY_BRANCH_OPTIONS_QUERY_KEY,
  SERVICE_CATEGORY_OPTIONS_QUERY_KEY,
  SERVICE_OPTIONS_QUERY_KEY,
  SERVICE_QUERY_KEY,
  TRANSACTION_QUERY_KEY,
  USER_HISTORY_QUERY_KEY,
  USER_WITH_ROLE_QUERY_KEY,
} from "@/const/queryKey";
import { QueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { showErrorMessage } from "./notificationUtils";


export async function safeAxios<T>(
  fn: () => Promise<T>,
): Promise<T | undefined> {
  try {
    return await fn();
  } catch (e) {
    if (e instanceof AxiosError) {
      const err = e as AxiosError<ApiErrorType>;
      showErrorMessage(err.response?.data?.error || 'An unknown error occurred');
    } else {
      showErrorMessage('An unexpected error occurred');
    }
  }
}


export const invalidateBranch = (queryClient: QueryClient) => {
  queryClient.invalidateQueries({ queryKey: [BRANCH_QUERY_KEY] });
  queryClient.invalidateQueries({ queryKey: [BRANCH_OPTIONS_QUERY_KEY] });
};
export const invalidateEmployee = (queryClient: QueryClient) => {
  queryClient.invalidateQueries({ queryKey: [EMPLOYEE_QUERY_KEY] });
  queryClient.invalidateQueries({
    queryKey: [EMPLOYEE_BY_BRANCH_OPTIONS_QUERY_KEY],
  });
};

export const invalidateBranchOptions = (queryClient: QueryClient) => {
  queryClient.invalidateQueries({ queryKey: [BRANCH_OPTIONS_QUERY_KEY] });
};

export const invalidateEmployeePositionOptions = (queryClient: QueryClient) => {
  queryClient.invalidateQueries({
    queryKey: [EMPLOYEE_POSITION_OPTIONS_QUERY_KEY],
  });
};

export const invalidateService = (queryClient: QueryClient) => {
  queryClient.invalidateQueries({ queryKey: [SERVICE_QUERY_KEY] });
  queryClient.invalidateQueries({ queryKey: [SERVICE_OPTIONS_QUERY_KEY] });
  queryClient.invalidateQueries({
    queryKey: [SERVICE_BY_BRANCH_OPTIONS_QUERY_KEY],
  });
};
export const invalidateServiceCategory = (queryClient: QueryClient) => {
  queryClient.invalidateQueries({
    queryKey: [SERVICE_CATEGORY_OPTIONS_QUERY_KEY],
  });
};

export const invalidateCustomer = (queryClient: QueryClient) => {
  queryClient.invalidateQueries({ queryKey: [CUSTOMER_QUERY_KEY] });
  queryClient.invalidateQueries({ queryKey: [CUSTOMER_OPTIONS_QUERY_KEY] });
  queryClient.invalidateQueries({ queryKey: [CUSTOMER_HISTORY_QUERY_KEY] });
};

export const invalidateCustomerHistory = (
  queryClient: QueryClient,
  customerId: number
) => {
  queryClient.invalidateQueries({
    queryKey: [`${CUSTOMER_HISTORY_QUERY_KEY}-${customerId}`],
  });
};

export const invalidateBooking = (queryClient: QueryClient) => {
  queryClient.invalidateQueries({ queryKey: [BOOKING_QUERY_KEY] });
};

export const invalidatePromotion = (queryClient: QueryClient) => {
  queryClient.invalidateQueries({ queryKey: [PROMOTION_QUERY_KEY] });
  invalidateService(queryClient);
};

export const invalidateTransaction = (queryClient: QueryClient) => {
  queryClient.invalidateQueries({ queryKey: [TRANSACTION_QUERY_KEY] });
};

export const invalidateInventoryItem = (queryClient: QueryClient) => {
  queryClient.invalidateQueries({ queryKey: [INVENTORY_ITEM_QUERY_KEY] });
};

export const invalidateInventoryItemCategoryOptions = (
  queryClient: QueryClient
) => {
  queryClient.invalidateQueries({
    queryKey: [INVENTORY_ITEM_CATEGORY_OPTIONS_QUERY_KEY],
  });
};

export const invalidateRole = (queryClient: QueryClient) => {
  queryClient.invalidateQueries({ queryKey: [ROLE_QUERY_KEY] });
};

export const invalidateUserWithRole = (queryClient: QueryClient) => {
  queryClient.invalidateQueries({ queryKey: [USER_WITH_ROLE_QUERY_KEY] });
};

export const invalidateUserHistory = (queryClient: QueryClient) => {
  queryClient.invalidateQueries({ queryKey: [USER_HISTORY_QUERY_KEY] });
};