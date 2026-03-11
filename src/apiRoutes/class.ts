import { ClassType, LiveClassType } from "@/types/class";
import AxiosInstance from "@/utils/axiosInstance";

export const fetchClasses = async (): Promise<ClassType[]> => {
  const res = await AxiosInstance.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/classes`);
  const raw = res.data.data;
  return raw;
};

export const updateClassTag = async ({ id, tag }: { id: number; tag: string }) => {
  const res = await AxiosInstance.patch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/classes/${id}`, {
    tags: tag
  });
  return res.data;
};


export const fetchLiveClasses = async (): Promise<LiveClassType[]> => {
  const res = await AxiosInstance.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/elearning`);
  return res.data.data || [];
};