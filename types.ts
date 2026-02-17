
export type DevelopmentalArea = 'socialization' | 'language' | 'self_help' | 'cognition' | 'motor' | 'infant_stimulation';

export enum ScoreValue {
  ACHIEVED = 1,
  EMERGING = 0.5,
  NOT_ACHIEVED = 0
}

export interface PortageQuestion {
  id: string;
  area: DevelopmentalArea;
  ageRange: string;
  description: string;
}

export interface AssessmentItem {
  score: ScoreValue;
  respondentName: string;
  answeredAt?: string; // ISO string date
  notes?: string;
}

export interface Assessment {
  id: string;
  date: string;
  professionalName: string;
  professionalRole: string;
  responses: Record<string, AssessmentItem>;
  status: 'draft' | 'completed';
  summaryNotes?: string;
}

export interface Child {
  id: string;
  name: string;
  birthDate: string;
  gender: 'M' | 'F' | 'Other';
  guardianName: string;
  clinicalHistory: string;
  condition: string; // e.g., "Down Syndrome", "TEA", "None"
  assessments: Assessment[];
}

export interface AreaScore {
  area: DevelopmentalArea;
  label: string;
  score: number;
  total: number;
  percentage: number;
}
