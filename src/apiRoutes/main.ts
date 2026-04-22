import { TermType } from "@/types/main";
import AxiosInstance from "@/utils/axiosInstance";

export type MetaType = { current_page: number; last_page: number; total: number };

export type FetchTermsResponseType = {
    data:TermType[]
}
export const fetchTerms = async ():Promise<TermType[]> => {
  const response = await AxiosInstance<FetchTermsResponseType>(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/schedule`);
  return response.data.data || [];
};