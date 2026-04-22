import { ApiErrorType } from "@/const/generalApis";
import {
  LEVELS_QUERY_KEY,
  TOPICS_QUERY_KEY,
  TEMPLATES_QUERY_KEY,
  LESSON_QUERY_KEY,
  LESSON_DETAIL_QUERY_KEY,
  TEMPLATE_DETAIL_QUERY_KEY,
  WORKSHEETS_QUERY_KEY,
  WORKSHEET_DETAIL_QUERY_KEY,
  QR_CODE_QUERY_KEY,
  SCHEDULE_TERMS_QUERY_KEY,
  ARCHIVED_YEARS_QUERY_KEY,
  CLASSES_QUERY_KEY,
  E_LEARNING_QUERY_KEY,
  REVISION_QUERY_KEY,
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

// --- E-Lesson & Worksheets Invalidation Helpers ---

export const invalidateLevels = (queryClient: QueryClient) => {
  queryClient.invalidateQueries({ queryKey: [LEVELS_QUERY_KEY] });
};

export const invalidateTopics = (queryClient: QueryClient) => {
  queryClient.invalidateQueries({ queryKey: [TOPICS_QUERY_KEY] });
};

export const invalidateTemplates = (queryClient: QueryClient) => {
  queryClient.invalidateQueries({ queryKey: [TEMPLATES_QUERY_KEY] });
  queryClient.invalidateQueries({ queryKey: [LESSON_QUERY_KEY] });
};

export const invalidateLessonDetail = (queryClient: QueryClient, id?: number | string) => {
  if (id) {
    queryClient.invalidateQueries({ queryKey: [LESSON_DETAIL_QUERY_KEY, id] });
  } else {
    queryClient.invalidateQueries({ queryKey: [LESSON_DETAIL_QUERY_KEY] });
  }
};

export const invalidateTemplateDetail = (queryClient: QueryClient) => {
  queryClient.invalidateQueries({ queryKey: [TEMPLATE_DETAIL_QUERY_KEY] });
};

export const invalidateWorksheets = (queryClient: QueryClient) => {
  queryClient.invalidateQueries({ queryKey: [WORKSHEETS_QUERY_KEY] });
};

export const invalidateWorksheetDetail = (queryClient: QueryClient, id?: number | string) => {
  if (id) {
    queryClient.invalidateQueries({ queryKey: [WORKSHEET_DETAIL_QUERY_KEY, id] });
  } else {
    queryClient.invalidateQueries({ queryKey: [WORKSHEET_DETAIL_QUERY_KEY] });
  }
};

export const invalidateQrCode = (queryClient: QueryClient) => {
  queryClient.invalidateQueries({ queryKey: [QR_CODE_QUERY_KEY] });
};

export const invalidateScheduleTerms = (queryClient: QueryClient) => {
  queryClient.invalidateQueries({ queryKey: [SCHEDULE_TERMS_QUERY_KEY] });
};

export const invalidateArchivedYears = (queryClient: QueryClient) => {
  queryClient.invalidateQueries({ queryKey: [ARCHIVED_YEARS_QUERY_KEY] });
};

export const invalidateClasses = (queryClient: QueryClient) => {
  queryClient.invalidateQueries({ queryKey: [CLASSES_QUERY_KEY] });
};

export const invalidateELearning = (queryClient: QueryClient) => {
  queryClient.invalidateQueries({ queryKey: [E_LEARNING_QUERY_KEY] });
};

export const invalidateRevision = (queryClient: QueryClient) => {
  queryClient.invalidateQueries({ queryKey: [REVISION_QUERY_KEY] });
};