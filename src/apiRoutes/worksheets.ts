import { WorksheetDetail, WorksheetFile, WorksheetItem, WorksheetTemplateMediaItem } from "@/types/worksheet";
import AxiosInstance from "@/utils/axiosInstance";
import { MetaType } from "./main";

export type WorksheetResponse = {
  data: WorksheetItem[];
  meta: MetaType;
};

type QrRequestResponse = {
  qr_code: string;
  qr_code_name: string;
};

export type BulkCloneArchivedWorksheetPayload = {
  year: string;
  level?: string;
};

export type QrRequestPayload =
  | { type: "worksheet"; id: string }
  | {
      type: "file";
      payload: { name: string; type: string; worksheet_id: number | string };
    };

export const fetchArchivedWorksheetLevel = async (
  year: string
): Promise<number[]> => {
  const res = await AxiosInstance.get<{ data: number[] }>(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/e-lesson/level-by/archived-years/worksheets/${year}`
  );
  return res.data.data || [];
};

export const fetchArchivedWorksheet = async (
  year: string,
  limit: number,
  page: number
): Promise<WorksheetResponse> => {
  const res = await AxiosInstance.get<WorksheetResponse>(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/e-lesson/archived/worksheet/${year}?limit=${limit}&page=${page}`
  );
  return res.data || [];
};

export const fetchWorksheetDetail = async (
  id: string
): Promise<WorksheetDetail> => {
  const url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/e-lesson/worksheet/${id}`;
  const res = await AxiosInstance.get(url);
  const raw = res.data.data || res.data;
  return raw;
};
export const fetchArchivedWorksheetYears = async (): Promise<string[]> => {
  const res = await AxiosInstance.get(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/e-lesson/archived-years/worksheets`
  );
  return res.data.data || [];
};

export const cloneWorksheet = async (
  id: number | string
): Promise<string[]> => {
  const res = await AxiosInstance.get(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/e-lesson/clone/worksheet/${id}`
  );
  return res.data.data || [];
};


export const bulkCloneArchivedWorksheet = async (
  data: BulkCloneArchivedWorksheetPayload
): Promise<string[]> => {
  const res = await AxiosInstance.post(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/e-lesson/clone/worksheets`,
    data
  );
  return res.data.data || [];
};

export const fetchQrCode = async (req: QrRequestPayload): Promise<QrRequestResponse> => {
  let res;
  let data;
  if (req.type === "worksheet") {
    const url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/e-lesson/qrcode/worksheet/${req.id}`;
    res = await AxiosInstance.get(url);
    data = res.data;
  } else {
    const url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/e-lesson/qrcode/generate`;
    res = await AxiosInstance.post(url, req.payload);
    data = res.data.data;
  }

  return {
    qr_code: data.qr_code || data.qrcode,
    qr_code_name: data.qr_code_name || data.qrcode_name,
  };
};

export const fetchWorksheetArchiveYears = async () => {
    const { data } = await AxiosInstance.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/e-lesson/archiveable-years/worksheets`);
    return data.data;
};

export const fetchWorksheets = async (
  limit: number,
  page: number): Promise<WorksheetResponse> => {
    const { data } = await AxiosInstance.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/e-lesson/worksheet?limit=${limit}&page=${page}`);
    // Handle pagination wrapper if present (data.data vs data)
    return data;
};


export const deleteWorksheet = async (id: string) => {
    // Assuming the endpoint follows standard REST conventions based on your other routes
    const { data } = await AxiosInstance.delete(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/e-lesson/worksheet/${id}`);
    return data;
};


export const archiveSelectedWorksheets = async (ids: string[]) => {
  const { data } = await AxiosInstance.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/e-lesson/archive/selected/worksheets`, {
    worksheets: ids
  });
  return data;
};

// 2. Archive All By Year
export const archiveWorksheetsByYear = async (year: string) => {
  const { data } = await AxiosInstance.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/e-lesson/archive/worksheets`, {
    year: year
  });
  return data;
};


export const saveWorksheet = async (data: WorksheetDetail) => {
    if (data.id && data.id !== "0") {
        // Update existing
        const { data: res } = await AxiosInstance.patch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/e-lesson/worksheet/${data.id}`, data);
        return res.data;
    } else {
        // Create new
        const { data: res } = await AxiosInstance.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/e-lesson/worksheet`, data);
        return res.data; 
    }
};

export const checkWorksheetMedia = async (worksheetId: string, fileName: string, type: string) : Promise<{is_duplicated:boolean}>=> {
    const { data } = await AxiosInstance.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/e-lesson/check-worksheet-media`, {
        params: { elesson_worksheet_id: worksheetId, name: fileName, type }
    });
    return data; // Returns { is_duplicated: boolean }
};

export const deleteWorksheetMedia = async (mediaId: string) => {
    await AxiosInstance.delete(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/e-lesson/worksheet/media/${mediaId}`);
};
// 1. Define the base shape (everything is optional here)
type BasePayload = {
  graphics?: WorksheetFile[];
  videos?: WorksheetFile[];
  pdf?: WorksheetFile;
  latest_worksheets?: WorksheetFile[];
};

// 2. Define the helper utility
type RequireAtLeastOne<T> = {
  [K in keyof T]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<keyof T, K>>>;
}[keyof T];

// 3. Create your final type
export type UpdateWorksheetMediaPayload = RequireAtLeastOne<BasePayload>;
export const updateWorksheetMedia = async (id: string, payload: UpdateWorksheetMediaPayload) :Promise<WorksheetDetail>=> {
    const { data } = await AxiosInstance.patch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/e-lesson/worksheet/${id}`, payload);
    return data.data;
};



// Fetch Worksheets based on Topic and Level
export const fetchWorksheetsByTopicAndLevel = async (payload:{topicId: string | number, levelId: string | number}) => {
  if (!payload.topicId || !payload.levelId) return [];
  
  const { data } = await AxiosInstance.get<{data:WorksheetTemplateMediaItem[]}>(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/e-lesson/worksheet?topic=${payload.topicId}&level=${payload.levelId}`
  );
  return data.data; 
};