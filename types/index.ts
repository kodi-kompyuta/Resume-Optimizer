// Resume Types
export interface Resume {
  id: string
  user_id: string
  created_at: string
  updated_at: string
  original_filename: string
  file_url?: string
  resume_text: string
  structured_data?: StructuredResume // Structured format for optimization
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
  score_breakdown?: {
    required_qualifications?: number
    preferred_qualifications?: number
    relevant_experience?: number
    demonstrated_achievements?: number
    // Legacy fields for backwards compatibility
    technical_match?: number
    experience_match?: number
    education_match?: number
    skills_match?: number
  }
  summary?: string
  overall_fit?: string // Legacy field
  key_strengths: string[]
  critical_gaps: string[]
  nice_to_haves?: string[]
  dealbreakers?: string[]
  match_level?: string
  interview_recommendation?: string
  interview_focus_areas?: string[]
  experience_level_match?: {
    job_level: string
    your_level?: string // Candidate-focused language
    candidate_level?: string // Legacy field for backwards compatibility
    match: string
    notes: string
  }
}

export interface RecommendedAddition {
  section: 'skills' | 'experience' | 'education' | 'summary' | 'projects' | 'other'
  content: string
  reason: string
  priority: 'high' | 'medium' | 'low'
  impact?: string
}

export interface Gap {
  requirement: string
  severity: 'critical' | 'important' | 'nice-to-have'
  suggestion: string
  current_level?: string
  required_level?: string
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

// Structured Resume Types for Structure-Preserving Optimization
export interface StructuredResume {
  id?: string
  metadata: ResumeMetadata
  sections: ResumeSection[]
  rawText?: string // Original plain text for fallback
}

export interface ResumeMetadata {
  originalFilename?: string
  fileType?: 'pdf' | 'docx' | 'txt'
  parsedAt: string
  wordCount: number
  detectedTemplate?: string
  formatting?: FormattingStyle
}

export interface FormattingStyle {
  fontFamily?: string
  fontSize?: number
  lineSpacing?: number
  margins?: {
    top: number
    bottom: number
    left: number
    right: number
  }
  headingStyle?: {
    fontSize?: number
    bold?: boolean
    underline?: boolean
    uppercase?: boolean
  }
}

export interface ResumeSection {
  id: string // Unique identifier for this section
  type: SectionType
  heading: string
  headingLevel?: number // 1, 2, 3 for h1, h2, h3
  order: number // Order in the resume
  content: ContentBlock[]
  metadata?: SectionMetadata
}

export type SectionType =
  | 'contact'
  | 'summary'
  | 'objective'
  | 'experience'
  | 'education'
  | 'skills'
  | 'certifications'
  | 'projects'
  | 'awards'
  | 'publications'
  | 'languages'
  | 'volunteer'
  | 'interests'
  | 'custom'

export interface SectionMetadata {
  originalHeading?: string // In case we normalize headings
  formatting?: {
    bold?: boolean
    italic?: boolean
    underline?: boolean
    fontSize?: number
    alignment?: 'left' | 'center' | 'right'
    capitalization?: 'normal' | 'uppercase' | 'lowercase' | 'title'
  }
}

export interface ContentBlock {
  id: string
  type: ContentType
  content: string | BulletList | ExperienceItem | EducationItem | ContactInfo | SkillGroup
  metadata?: ContentMetadata
}

export type ContentType =
  | 'text'
  | 'bullet_list'
  | 'experience_item'
  | 'education_item'
  | 'contact_info'
  | 'skill_group'

export interface ContentMetadata {
  indentLevel?: number
  formatting?: {
    bold?: boolean
    italic?: boolean
    fontSize?: number
  }
  originalText?: string // For tracking changes
}

export interface BulletList {
  items: BulletItem[]
  bulletStyle?: 'disc' | 'circle' | 'square' | 'dash' | 'arrow'
}

export interface BulletItem {
  id: string
  text: string
  subItems?: BulletItem[]
  metadata?: {
    indentLevel: number
    originalText?: string
  }
}

export interface ExperienceItem {
  id: string
  jobTitle: string
  company: string
  location?: string
  startDate: string
  endDate: string | 'Present'
  description?: string
  achievements: BulletItem[]
  metadata?: {
    dateFormat?: string
  }
}

export interface EducationItem {
  id: string
  degree: string
  institution: string
  location?: string
  graduationDate?: string
  gpa?: string
  honors?: string
  relevantCoursework?: string[]
  achievements?: BulletItem[]
}

export interface ContactInfo {
  name?: string
  email?: string
  phone?: string
  location?: string
  linkedin?: string
  github?: string
  portfolio?: string
  website?: string
  other?: Record<string, string>
}

export interface SkillGroup {
  category?: string
  skills: string[]
  displayStyle?: 'list' | 'inline' | 'table'
}

// Optimization Types with Change Tracking
export interface OptimizationRequest {
  resumeId: string
  jobDescriptionId?: string // Optional: optimize for specific job
  options: OptimizationOptions
}

export interface OptimizationOptions {
  improveBulletPoints: boolean
  addKeywords: boolean
  fixGrammar: boolean
  enhanceSections: boolean
  targetRole?: string
  targetIndustry?: string
  preserveLength?: boolean // Try to keep similar length
  aggressiveness?: 'conservative' | 'moderate' | 'aggressive' // How much to change
}

export interface OptimizationResult {
  originalResume: StructuredResume
  optimizedResume: StructuredResume
  changes: ChangeLog[]
  summary: OptimizationSummary
  preview: DiffPreview
}

export interface ChangeLog {
  id: string
  sectionId: string
  sectionName: string
  contentBlockId: string
  changeType: ChangeType
  originalValue: string
  newValue: string
  reason: string
  confidence: number // 0-1, how confident the AI is in this change
  impact: 'high' | 'medium' | 'low'
  category: ChangeCategory
  accepted?: boolean // User's decision (for preview system)
}

export type ChangeType =
  | 'replace' // Replaced text
  | 'add' // Added new content
  | 'remove' // Removed content
  | 'reorder' // Changed order
  | 'enhance' // Improved existing content
  | 'grammar' // Grammar fix
  | 'keyword' // Added keyword

export type ChangeCategory =
  | 'bullet_point'
  | 'keyword'
  | 'grammar'
  | 'clarity'
  | 'section_content'
  | 'formatting'

export interface OptimizationSummary {
  totalChanges: number
  changesByCategory: Record<ChangeCategory, number>
  keywordsAdded: string[]
  atsScoreChange?: {
    before: number
    after: number
    improvement: number
  }
  estimatedImpact: string
}

export interface DiffPreview {
  sections: SectionDiff[]
  highlightedChanges: HighlightedChange[]
}

export interface SectionDiff {
  sectionId: string
  sectionName: string
  hasChanges: boolean
  changeCount: number
  changes: ChangeLog[]
}

export interface HighlightedChange {
  changeId: string
  displayText: string
  changeType: ChangeType
  beforeText: string
  afterText: string
  reason: string
  accepted: boolean
}

// ATS-Optimized Resume Template Types
// This is a simplified, flat structure optimized for ATS parsing and Word export
export interface ATSResumeTemplate {
  header: ATSHeader
  summary: string
  core_skills: string[]
  technical_skills: Record<string, string[]> // e.g., { "Cloud": ["AWS", "Azure"], "Security": [...] }
  professional_experience: ATSExperience[]
  education: ATSEducation[]
  certifications: string[]
  projects?: ATSProject[] // Optional section
  referees?: string
}

export interface ATSHeader {
  full_name: string
  location: string
  email: string
  phone: string
  linkedin?: string
  github?: string
  portfolio?: string
  website?: string
}

export interface ATSExperience {
  job_title: string
  company: string
  location: string
  date_range: string // e.g., "Jan 2020 - Present"
  responsibilities: string[]
}

export interface ATSEducation {
  degree: string
  institution: string
  location: string
  date_range: string
  gpa?: string
  honors?: string
  achievements?: string[]
}

export interface ATSProject {
  title: string
  description: string
  technologies?: string[]
  date_range?: string
}