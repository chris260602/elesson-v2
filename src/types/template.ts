import { LevelType } from "./level";
import { TopicType } from "./topic";
import { WorksheetDetail, WorksheetItem } from "./worksheet";

export type MaterialType = {
  id:number;
  instruction:string;
  link_title:string;
  name:string;
  percentage:number;
  select:number; //boolean
  sequence:number;
  timestamp:string;
  type:string;
  uid:string;
}

export type LessonType = {
  active_revision: number;
  active_revision_label: "Yes" | "No" | string;
  id: number;
  level: number;
  level_primary: LevelType;
  published: boolean;
  published_at: string | null;
  term: string;
  title: string;
  title_label: string;
  topical: number;
  topical_label: "Yes" | "No" | string;
  year: string;
}

export interface LessonPlan {
  id: number;
  title: string;
  year: string;
  level: number;
  term: string;
  topical: number; //boolean
  topical_label: string;
  active_revision: number; //boolean
  active_revision_label: string;
  published: boolean;
  published_at: string | null;
  main_lesson: SubLesson[];
  homework: SubLesson[];
  not_homework: SubLesson[];
  review_lesson: ReviewLesson[];
  level_primary: LevelType;
}

export type SubLesson = {
  id: number;
  template_id: number;
  title: string;
  main_instruction: string;
  level_id: number;
  topic_id: number;
  topical: number;
  passcode: string | null;
  enable_passcode: number;
  tags: string;
  term: string;
  worksheet_id: number;
  level: LevelType;
  topic: TopicType;
  worksheet: WorksheetDetail;
  materials: MaterialType[];
  conclusion: string;
  homework: number;
  sequence: number;

}

export type ReviewLesson = {
  id: number;
  instruction:string;
  level:LevelType;
  level_id:number;
  materials:MaterialType[];
  sequence:number;
  tags:string;
  template_id:number;
  title:string;
  topic:TopicType;
  topic_id:number;
  worksheet:WorksheetItem;
  worksheet_id:number;

}

export type TemplateItem = {
  id: number;
  year: string;
  term: string;
  level_primary: LevelType; 
  level: number; 
  title: string;
  title_label:string;
  published: boolean;
  published_at: string | null;
  topical_label: "Yes" | "No";
  active_revision_label: "Yes" | "No";
  created_at: string;
  active_revision:number; //boolean
  topical:number; //boolean

}
