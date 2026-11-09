export const RUBRIC_WEIGHTS = {
  technicalCorrectness: 0.35,
  conceptualUnderstanding: 0.25,
  completeness: 0.20,
  relevance: 0.10,
  communicationClarity: 0.10,
} as const;

export const RUBRIC_LABELS: Record<keyof typeof RUBRIC_WEIGHTS, string> = {
  technicalCorrectness: 'Technical correctness',
  conceptualUnderstanding: 'Conceptual understanding',
  completeness: 'Completeness',
  relevance: 'Relevance',
  communicationClarity: 'Communication clarity',
};

export const TECHNICAL_DOMAINS = [
  'Python',
  'Java',
  'JavaScript',
  'SQL',
  'DBMS',
  'Operating Systems',
  'Computer Networks',
  'Data Structures & Algorithms',
  'OOP',
  'System Design',
  'Machine Learning',
] as const;

export const HR_DOMAINS = [
  'Self Introduction',
  'Behavioural',
  'Situational',
  'Strengths & Weaknesses',
  'Career Goals',
] as const;

export const CODING_LANGUAGES = [
  { value: 'python', label: 'Python' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'java', label: 'Java' },
] as const;

export const CODING_TOPICS = [
  'Arrays & Hashing',
  'Strings',
  'Two Pointers',
  'Stack & Queue',
  'Recursion',
  'Trees',
  'Sorting & Searching',
  'Basic DP',
] as const;

export const LANGUAGES = [
  { value: 'en', label: 'English', native: 'English', enabled: true },
  { value: 'ta', label: 'Tamil', native: 'தமிழ்', enabled: true },
  { value: 'hi', label: 'Hindi', native: 'हिन्दी', enabled: true },
] as const;

export const DURATIONS = [
  { min: 5, approxQuestions: '3-4' },
  { min: 10, approxQuestions: '6-8' },
  { min: 15, approxQuestions: '10-12' },
] as const;

export const SESSION_STORAGE_KEY = (id: string) => `iq:session:${id}`;
