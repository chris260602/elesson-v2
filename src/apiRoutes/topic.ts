import { TopicType } from "@/types/topic";
import AxiosInstance from "@/utils/axiosInstance";
export type TopicQuery = {
  year?: string;
  level?: string;
};
// export const fetchTopics = async (
//   year?: string,
//   level?: string
// ): Promise<TopicType[]> => {
//   let url;
//   if (!year) {
//     url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/topic`;
//   } else {
//     const levelParam = level === "0" || !level ? "0" : level;
//     url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/topic?year=${year}&level=${levelParam}`;
//   }

//   const res = await AxiosInstance.get(url);
//   return res.data.data || [];
// };

export const fetchTopics = async (data: TopicQuery): Promise<TopicType[]> => {
  let url;
  console.log(data,"dts")
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
