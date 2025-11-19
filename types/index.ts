// Resume Types
export interface Resume {
  id: string
  user_id: string
  created_at: string
  updated_at: string
  original_filename: string
  file_url?: string
  resume_text: string
  ats_score?: number
  analysis_data?: AnalysisData
  suggestions?: Suggestion[]
  status: 'processing' | 'completed' | 'failed'
  word_count?: number
  analyzed_at?: string
  version_name?: string
  tags?: string[]
  is_primary?: boolean
  parent_resume_id?: string
}

export interface AnalysisData {
  ats_score: number
  overall_assessment: string
  strengths: string[]
  weaknesses: Weakness[]
  keyword_suggestions: KeywordSuggestion[]
  bullet_point_analysis: BulletPointAnalysis[]
  formatting_issues: string[]
  action_items: ActionItem[]
}

export interface Weakness {
  issue: string
  severity: 'high' | 'medium' | 'low'
  suggestion: string
}

export interface KeywordSuggestion {
  keyword: string
  reason: string
  where_to_add: string
}

export interface BulletPointAnalysis {
  original: string
  improved: string
  reason: string
}

export interface ActionItem {
  action: string
  priority: 'high' | 'medium' | 'low'
  impact: string
}

export interface Suggestion {
  type: string
  description: string
  priority: 'high' | 'medium' | 'low'
}

// Job Description Types
export interface JobDescription {
  id: string
  user_id: string
  created_at: string
  updated_at: string
  job_title: string
  company_name?: string
  job_description: string
  requirements?: string
  keywords?: string[]
  location?: string
  salary_range?: string
  is_active: boolean
}

// Resume-Job Match Types
export interface ResumeJobMatch {
  id: string
  user_id: string
  resume_id: string
  job_description_id: string
  created_at: string
  match_score?: number
  match_analysis?: MatchAnalysis
  missing_keywords?: string[]
  recommended_additions?: RecommendedAddition[]
  strengths?: string[]
  gaps?: Gap[]
}

export interface MatchAnalysis {
  match_score: number
  overall_fit: string
  technical_match: number
  experience_match: number
  education_match: number
  skills_match: number
  key_strengths: string[]
  critical_gaps: string[]
  nice_to_haves: string[]
  dealbreakers?: string[]
}

export interface RecommendedAddition {
  section: 'skills' | 'experience' | 'education' | 'summary' | 'other'
  content: string
  reason: string
  priority: 'high' | 'medium' | 'low'
}

export interface Gap {
  requirement: string
  severity: 'critical' | 'important' | 'nice-to-have'
  suggestion: string
}

// Cover Letter Types
export interface CoverLetter {
  id: string
  user_id: string
  resume_id: string
  job_description_id?: string
  created_at: string
  updated_at: string
  title?: string
  content: string
  tone: 'professional' | 'enthusiastic' | 'formal' | 'creative'
  status: 'draft' | 'final'
  word_count?: number
}

export interface CoverLetterGenerationRequest {
  resume_id: string
  job_description_id?: string
  tone?: 'professional' | 'enthusiastic' | 'formal' | 'creative'
  additional_notes?: string
  focus_areas?: string[]
}