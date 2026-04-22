import { LessonPlan, TemplateItem, SubLesson, ReviewLesson, LessonType } from "@/types/template";
import AxiosInstance from "@/utils/axiosInstance";
import { MetaType } from "./main";
import { LevelType } from "@/types/level";

export type LessonResponse = {
  data: LessonType[];
  meta: MetaType;
}
export type TemplateResponse = {
  data: TemplateItem[];
  meta: MetaType;
};

export type CreateLessonPlanType = {
  id: number;
  title: string;
  year: string;
  level: number;
  term: string;
  topical: boolean; //boolean
  topical_label: string;
  active_revision: boolean; //boolean
  active_revision_label: string;
  published: boolean;
  published_at: string | null;
  main_lesson: SubLesson[];
  homework: SubLesson[];
  not_homework: SubLesson[];
  review_lesson: ReviewLesson[];
  level_primary: LevelType;
}


export const fetchTemplates = async (
  limit: number,
  page: number
): Promise<TemplateResponse> => {
  const { data } = await AxiosInstance.get(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/e-lesson/template?limit=${limit}&page=${page}`
  );
  return data;
};

export const fetchArchivedLesson = async (
  year: string,
  limit: number,
  page: number
): Promise<TemplateResponse> => {
  const res = await AxiosInstance.get<TemplateResponse>(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/e-lesson/archived/template/${year}?limit=${limit}&page=${page}`
  );
  return res.data || [];
};


export const fetchLessonDetail = async (id: number): Promise<LessonPlan> => {
  if (!id) throw new Error("No ID provided");
  const url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/e-lesson/template/${id}`;
  try {
    const res = await AxiosInstance.get(url);
    return res.data.data || res.data; 
  } catch (error) {
    console.error("Failed to fetch lesson details:", error);
    throw error;
  }
};

export const deleteTemplate = async (id: number) => {
  // TODO: Implement on backend
  const { data } = await AxiosInstance.delete(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/e-lesson/template/${id}`
  );
  return data;
};

export const cloneTemplate = async (id: number): Promise<string[]> => {
  // TODO: Implement on backend
  const res = await AxiosInstance.get(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/e-lesson/clone/template/${id}`
  );
  return res.data.data || [];
};

export const saveTemplate = async (data: LessonPlan) => {
  if (data.id && data.id !== 0) {
    // Update existing
    const { data: res } = await AxiosInstance.patch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/e-lesson/template/${data.id}`,
      data
    );
    return res.data;
  } else {
    // Create new
    const { data: res } = await AxiosInstance.post(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/e-lesson/template`,
      data
    );
    return res.data;
  }
};


export const togglePublishTemplate = async (
  id: number, 
  status: boolean, 
  isTopical: boolean = false
) => {
  const payload = {
    published: status,
    type: 'only-status',
    topical: isTopical
  };

  const { data } = await AxiosInstance.patch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/e-lesson/template/${id}`,
    payload
  );
  return data;
};


export const saveSubLesson = async (
  type: "main" | "review", 
  data: any
) => {
  const endpoint = type === "main" ? "e-lesson/main" : "e-lesson/review";
  
  if (data.id && data.id !== 0 && data.id !== "0") {
    // Update
    const { data: res } = await AxiosInstance.patch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/${endpoint}/${data.id}`,
      data
    );
    return res.data;
  } else {
    // Create
    const { data: res } = await AxiosInstance.post(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/${endpoint}`,
      data
    );
    return res.data;
  }
};


export const deleteSubLesson = async (
  type: "main" | "review", 
  id: string | number
) => {
  const endpoint = type === "main" ? "e-lesson/main" : "e-lesson/review";
  const { data } = await AxiosInstance.delete(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/${endpoint}/${id}`
  );
  return data;
};


export const updateLessonSequence = async (
  templateId: string,
  type: "main" | "review",
  items: { worksheet_id: string | number; sequence: number }[]
) => {
  const { data } = await AxiosInstance.patch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/e-lesson/${type}/sequence/${templateId}`,
    items
  );
  return data;
};




export const createLessonTemplate = async (data: LessonPlan) => {
  // Vue: this.$axios.post('e-lesson/template', ...)
  const response = await AxiosInstance.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/e-lesson/template`, data);
  return response.data.data;
};

export const updateLessonTemplate = async (id: number | string, data: CreateLessonPlanType) => {
  // Vue: this.$AxiosInstance.patch('e-lesson/template/' + id, ...)
  const response = await AxiosInstance.patch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/e-lesson/template/${id}`, data);
  return response.data.data;
};
 
export const verifyPasscode = async (payload: { main_lesson_id: number; passcode: string }) => {
  const response = await AxiosInstance.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/e-lesson/template/passcode`, payload);
  const json = response.data;
 
  if (!json.status) {
    throw new Error(json.message || "Wrong Passcode");
  }
 
  return json;
};
 
export const fetchTemplatesList = async (): Promise<TemplateItem[]> => {
  const response = await AxiosInstance.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/e-lesson/template?limit=999`);
  return response.data.data;
};

