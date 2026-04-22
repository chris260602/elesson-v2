import AxiosInstance from "@/utils/axiosInstance";

export const fetchQuestions = async (levelId: number | string, topicId: number | string) => {
  const lvl = levelId || 0;
  const topic = topicId || 0;
  const res = await AxiosInstance.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/revision-problem-sums?primary_level_id=${lvl}&main_topic_id=${topic}`);
  return res.data.data;
};


export const fetchQuestionDetails = async (id: string | number) => {
  const res = await AxiosInstance.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/revision-problem-sums/${id}`);
  return res.data.data ;
};

export const deleteQuestion = async (id: number) => {
  const res = await AxiosInstance.delete(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/revision-problem-sums/${id}`);
  return res.data;
};

export const fetchRevisionTopics = async (levelId: string | number) => {
  const res = await AxiosInstance.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/revision-problem-sums/filter-eresource-main-topics/${levelId}/5`);
  return res.data.data;
};

export const fetchAutoQuestionNumber = async (levelId: string | number, subjectId: string | number) => {
  const res = await AxiosInstance.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/revision-problem-sums/get-question-no/${levelId}/${subjectId}`);
  return res.data.data?.question_no ?? res.data.data ?? res.data.question_no ?? res.data;
};

export const createRevisionQuestion = async (payload: any) => {
  const res = await AxiosInstance.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/revision-problem-sums`, payload);
  return res.data;
};

export const updateRevisionQuestion = async (id: string | number, payload: any) => {
  const res = await AxiosInstance.patch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/revision-problem-sums/${id}`, payload);
  return res.data;
};

export const fetchPresignedViewUrl = async (path: string) => {
  const res = await AxiosInstance.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/e-lesson/presigned-url`, { path });
  return res.data.url;
};
 
export const swapQuestionNumber = async (id: string | number, payload: { question_no: number | string }) => {
  const res = await AxiosInstance.patch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/revision-problem-sums/${id}/swap-question-no`, payload);
  return res.data;
};
 
export const updateRevisionFile = async (id: string | number, payload: { type: string; value: string | null }) => {
  const res = await AxiosInstance.patch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/revision-problem-sums/${id}/update-file`, payload);
  return res.data;
};