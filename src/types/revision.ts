

export type RevisionProblem = {
  id: string; // generated
  level_id: string;
  level_label?: string;
  subject_id: string;
  subject_label?: string;
  question_no: string;
  difficulty: number;
  comment: string;
  question_text: string;
  layout_code: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | null;
  question_graphic?: string; // Filename/URL
  video_solution?: string;
  written_solution?: string;
  answer?: string;
  created_by_label?: string;
};