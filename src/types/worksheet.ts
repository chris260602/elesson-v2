export type WorksheetFile = {
  id: string | number;
  name: string;
  // 'pdf' = Main Worksheet | 'latest_worksheets' = Teacher Copy/Others
  type: 'pdf' | 'video' | 'videos' | 'graphics' | 'latest_worksheets' | 'image' | 'office'; 
  url?: string;
  uploaded_at: string;
  description?: string;
  elesson_worksheet_id: number;
  title: string;
  percentage: number;
  unlock: number; // or boolean if it represents 0/1
  qrcode: string | null;
  qrcode_name: string;
  timestamp: string;
  created_at: string;
  created_by: number;
  updated_at: string;
  updated_by: number;
  deleted_at: string | null;
  deleted_by: number | null;
  

};

export type WorksheetTemplateFile = WorksheetFile & {
sequence:number;
  instruction:string;
  link_title:string;
}

export type WorksheetDetail = {
  id: string | number;
  level:number;
  levelName: string;
  year: string;
  pdf?: WorksheetFile;
  videos: WorksheetFile[];
  graphics: WorksheetFile[];
  latest_worksheets: WorksheetFile[];
  topicName:string;
  created_by:string;
  qrcode_name:string;
  title:string;
  topic:string;
  updated_by:string;
};

export type WorksheetItem = {
  id: string;
  title: string;
  year: string;
  levelName?: string; 
  level: number;
  topicName?: string;
  topic: number;
  created_by: string;
  archived:number;
  qrcode:string;
};

export type WorksheetTemplateMediaItem = {
  id:number;
  created_by:string;
  graphics:WorksheetTemplateFile[];
  latest_worksheets:WorksheetTemplateFile[];
  materials:WorksheetTemplateFile[];
  pdf:WorksheetTemplateFile[];
  title:string;
  updated_by:string;
  videos:WorksheetTemplateFile[];
}

export type WorksheetApiLevel = { id: number; name: string; code: string; };

