export interface ResumeVersion {
  id: string;
  name: string;
  fileName: string;
  parsedText: string;
  uploadedAt: string;
  fileSize: number;
}

export interface JobDetails {
  title: string;
  company: string;
  description: string;
  url: string;
}

export interface ProjectIdea {
  title: string;
  description: string;
  technologies: string[];
}

export interface CategorizedSkills {
  [category: string]: {
    present: string[];
    missing: string[];
  };
}

export interface AnalysisResult {
  overallScore: number;
  skillsScore: number;
  experienceScore: number;
  educationScore: number;
  keywordScore: number;
  presentKeywords: string[];
  missingKeywords: string[];
  categorizedSkills: CategorizedSkills;
  suggestions: string[];
  projectIdeas: ProjectIdea[];
  analyzedAt: string;
  resumeId: string;
  jobUrl: string;
}
