// Lab Interpreter DTOs
export type Severity = 'low' | 'normal' | 'high';

export interface Measurement {
  code: string;
  name?: string;
  value: number;
  unit: string;
  measuredAt?: string; // ISO string
}

export interface RequestContext {
  sex?: string; // "male" | "female" (string for now)
  ageYears?: number;
}

export interface LabInterpretRequest {
  userId: string;
  context?: RequestContext;
  measurements: Measurement[];
}

export interface MeasurementInterpretation {
  code: string;
  name?: string;
  value: number;
  unit: string;
  severity: Severity;
  summary: string;
}

export interface LabInterpretResponse {
  userId: string;
  results: MeasurementInterpretation[];
}

// Nutrition Analyzer DTOs
export interface Macros {
  kcal: number;
  protein_g: number;
  fat_g: number;
  carbs_g: number;
}

export interface MealItem {
  name: string;
  grams: number;
  macros?: Macros;
}

export interface Meal {
  items: MealItem[];
}

export interface NutritionAnalyzeRequest {
  meals: Meal[];
}

export interface NutritionAnalyzeResponse {
  kcal: number;
  protein_g: number;
  fat_g: number;
  carbs_g: number;
}

// Recommendations
export interface Recommendation {
  id: string;
  userId: string;
  category: string;
  title: string;
}

export type RecommendationResponse = Recommendation[];

// Service Info
export interface ServiceInfo {
  name: string;
  version: string;
}
