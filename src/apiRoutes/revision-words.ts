import AxiosInstance from "@/utils/axiosInstance";

export const fetchQuestions = async (levelId: number | string, topicId: number | string) => {
  const lvl = levelId || 0;
  const topic = topicId || 0;
  const res = await AxiosInstance.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/revision-problem-sums?primary_level_id=${lvl}&main_topic_id=${topic}`);
  return res.data.data;
};


export const fetchQuestionDetails = async (id: number) => {
  const res = await AxiosInstance.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/revision-problem-sums/${id}`);
  return res.data.data ;
};