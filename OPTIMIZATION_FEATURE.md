# Resume Optimization Feature

## Overview

The Resume Optimization feature uses AI to improve your resume content while preserving its structure and formatting. It provides a side-by-side preview of all changes before applying them.

## How It Works

### 1. Structure-Preserving Parser

When a resume is uploaded, it's parsed into a structured format that captures:

- **Sections**: Headings, types (experience, education, skills, etc.), and order
- **Content Blocks**: Different types of content (text, bullets, experience items, etc.)
- **Formatting Metadata**: Capitalization, indentation, bullet styles
- **Contact Information**: Name, email, phone, LinkedIn, GitHub, etc.
- **Experience Items**: Job title, company, location, dates, achievements
- **Education Items**: Degree, institution, GPA, coursework
- **Skills**: Categorized or listed skills

This structured format is stored alongside the plain text in the `structured_data` field.

### 2. AI Optimization Service

The optimizer (`lib/openai/optimizer.ts`) processes each section and:

- **Improves Bullet Points**: Rewrites bullets with action verbs and metrics
- **Adds Keywords**: Incorporates relevant industry keywords
- **Fixes Grammar**: Corrects grammatical errors and improves clarity
- **Enhances Sections**: Improves summary, objective, and other text content
- **Tracks All Changes**: Records every modification with reason and confidence

### 3. Change Tracking System

Every change is logged with:

- Original and new values
- Change type (enhance, grammar, keyword, etc.)
- Reason for the change
- Confidence level (0-1)
- Impact level (high, medium, low)
- Category (bullet_point, keyword, grammar, clarity, section_content)

### 4. Preview & Diff Interface

The UI (`app/(dashboard)/optimize/[id]/page.tsx`) provides:

- Side-by-side comparison of all changes
- Color-coded diffs (red for original, green for improved)
- Ability to accept/reject individual changes
- Summary of total changes and impact
- Grouping of changes by section

## User Flow

1. **Upload Resume**: User uploads a resume (PDF, DOCX, or TXT)
2. **Automatic Parsing**: System parses structure in background
3. **View Analysis**: User views ATS analysis on analyze page
4. **Click "Optimize Resume"**: Button on analyze page leads to optimization
5. **Configure Options**:
   - Improve bullet points
   - Add missing keywords
   - Fix grammar and clarity
   - Enhance section content
   - Preserve length (optional)
   - Aggressiveness level (conservative/moderate/aggressive)
6. **Review Changes**: See all proposed changes with explanations
7. **Accept/Reject**: Toggle individual changes on or off
8. **Apply Changes**: Choose to:
   - Create new version (keeps original)
   - Update original (replaces it)

## Technical Architecture

### File Structure

```
lib/
├── parsers/
│   └── structure-parser.ts       # Converts plain text to structured format
├── openai/
│   ├── analyzer.ts               # Original ATS analysis
│   └── optimizer.ts              # New optimization with change tracking
├── services/
│   ├── pdf-export.ts            # PDF export service
│   └── docx-export.ts           # DOCX export service

app/
├── api/
│   ├── upload/route.ts          # Updated to generate structured data
│   └── optimize/
│       ├── route.ts             # Optimization API endpoint
│       └── apply/route.ts       # Apply changes endpoint
└── (dashboard)/
    ├── analyze/[id]/page.tsx    # Updated with "Optimize Resume" button
    └── optimize/[id]/page.tsx   # New optimization preview UI

types/
└── index.ts                      # Extended with structured resume types
```

### Data Models

#### StructuredResume

```typescript
interface StructuredResume {
  metadata: ResumeMetadata
  sections: ResumeSection[]
  rawText?: string
}
```

#### ResumeSection

```typescript
interface ResumeSection {
  id: string
  type: SectionType // contact, experience, education, skills, etc.
  heading: string
  order: number
  content: ContentBlock[]
  metadata?: SectionMetadata
}
```

#### ContentBlock

```typescript
interface ContentBlock {
  id: string
  type: ContentType // text, bullet_list, experience_item, etc.
  content: string | BulletList | ExperienceItem | ...
  metadata?: ContentMetadata
}
```

#### ChangeLog

```typescript
interface ChangeLog {
  id: string
  sectionId: string
  sectionName: string
  contentBlockId: string
  changeType: ChangeType
  originalValue: string
  newValue: string
  reason: string
  confidence: number
  impact: 'high' | 'medium' | 'low'
  category: ChangeCategory
  accepted?: boolean
}
```

### API Endpoints

#### POST /api/optimize

Optimizes a resume and returns preview of changes.

**Request:**
```json
{
  "resumeId": "uuid",
  "jobDescriptionId": "uuid", // optional
  "options": {
    "improveBulletPoints": true,
    "addKeywords": true,
    "fixGrammar": true,
    "enhanceSections": true,
    "preserveLength": false,
    "aggressiveness": "moderate"
  }
}
```

**Response:**
```json
{
  "success": true,
  "result": {
    "originalResume": { ... },
    "optimizedResume": { ... },
    "changes": [ ... ],
    "summary": { ... },
    "preview": { ... }
  }
}
```

#### POST /api/optimize/apply

Applies accepted changes to resume.

**Request:**
```json
{
  "resumeId": "uuid",
  "optimizedResume": { ... },
  "acceptedChanges": [ ... ],
  "createNewVersion": true
}
```

**Response:**
```json
{
  "success": true,
  "resumeId": "uuid",
  "message": "Optimized version created successfully",
  "changesApplied": 15
}
```

## Database Changes Required

To fully support this feature, add these fields to your database:

### resumes table

```sql
ALTER TABLE resumes
ADD COLUMN structured_data JSONB;
```

### optimization_history table (optional, for tracking)

```sql
CREATE TABLE optimization_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  original_resume_id UUID REFERENCES resumes(id),
  optimized_resume_id UUID REFERENCES resumes(id),
  changes_applied JSONB,
  changes_count INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Optimization Strategies

### Conservative Mode

- Minimal changes to existing content
- Focus on grammar and clarity
- Low temperature (0.3) for AI
- Preserves most of original wording

### Moderate Mode (Default)

- Balanced approach
- Improves impact while maintaining voice
- Medium temperature (0.7)
- Good balance of improvement and preservation

### Aggressive Mode

- Significant rewrites for maximum impact
- Focus on metrics and action verbs
- Higher temperature (0.7)
- More substantial content changes

## Future Enhancements

1. **Job-Targeted Optimization**: Optimize specifically for a job description
2. **ATS Score Prediction**: Show estimated ATS score change before applying
3. **Bulk Operations**: Accept/reject all changes in a category
4. **Undo/Redo**: Allow reverting applied changes
5. **A/B Testing**: Generate multiple optimization variants
6. **Export Improvements**: Use structured format for better PDF/DOCX exports
7. **Smart Suggestions**: ML-based prediction of which changes user will accept
8. **Version Management**: Full version control with diffs between versions

## Usage Tips

1. **Start with Moderate**: Try moderate aggressiveness first
2. **Review Carefully**: Always review high-impact changes
3. **Keep Original**: Create new version first, then decide if you want to update original
4. **Iterate**: You can optimize multiple times with different settings
5. **Target Jobs**: Provide job description for better keyword matching
6. **Grammar First**: If unsure, start with just grammar and clarity fixes

## Credits & Cost

- Resume analysis: 1 credit
- Resume optimization: 2 credits
- Uses OpenAI GPT-4o model
- Optimization typically takes 30-60 seconds depending on resume length

## Support

For issues or questions about the optimization feature, please check:

1. Ensure resume has completed initial analysis
2. Check that structured_data was generated during upload
3. Verify OpenAI API key is configured
4. Review browser console for any errors
5. Check server logs for API failures
