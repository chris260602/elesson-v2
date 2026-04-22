import { TopicType } from "@/types/topic";
import AxiosInstance from "@/utils/axiosInstance";
export type TopicQuery = {
  year?: string;
  level?: string;
};


export const fetchTopics = async (data: TopicQuery): Promise<TopicType[]> => {
  let url;
  if (data.level && data.year) {
    url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/topic?year=${data.year}&level=${data.level}`;
  } else {
    if (data.level) {
      url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/topic?level=${data.level}`;
    } else if (data.year) {
      url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/topic?year=${data.year}`;
    } else {
      url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/topic`;
    }
  }

  const res = await AxiosInstance.get(url);
  return res.data.data || [];
};

export const createTopic = async (newData: Partial<TopicType>) => {
  return await AxiosInstance.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/topic`, newData);
};

export const updateTopic = async (id: string | number, data: Partial<TopicType>) => {
  return await AxiosInstance.put(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/topic/${id}`, data);
};

export const deleteTopic = async (id: string | number) => {
  return await AxiosInstance.delete(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/topic/${id}`);
};
