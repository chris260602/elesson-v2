import { LevelType } from "@/types/level";
import AxiosInstance from "@/utils/axiosInstance";
import { MetaType } from "./main";
export type LevelResponseType = {
  data:LevelType[];
  meta:MetaType;

}
export const fetchLevels = async (year?: string): Promise<LevelResponseType> => {
  let url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/level?year=${year}`;

  if (!year) url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/level`;
  
  const res = await AxiosInstance.get<LevelResponseType>(url);
  console.log(res,'ini res')
  return res.data;
};
