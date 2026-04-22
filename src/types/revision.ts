

export type RevisionProblem = {
  id: number;
  level_id: number;
  level_label: string;
  subject_id: number;
  subject_label: string;
  question_no: number;
  difficulty: number;
  comment: string;
  question_text: string;
  layout_code: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | null;
  question_graphic?: string; // Filename/URL
  video_solution?: string;
  written_solution?: string;
  created_by_label?: string;
  created_by:number;
  is_complete:number; //boolean
  is_favourite:number; //boolean
};