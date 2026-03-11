export type ClassType = {
  id: number;
  class_id: string; // Displayed as 'Name'
  tags: string;     // "SG", "R", "F"
  name?: string;
  password?: string;
};

export type LiveClassType = {
  meeting_id: string; 
  class: string;      
  title: string;
  server: string;
  status: string;     
  created_at: string;
  url: string;
  created_by?: number;
};