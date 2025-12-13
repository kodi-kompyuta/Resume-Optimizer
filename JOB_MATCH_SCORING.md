# Job Match Scoring System

## Overview

The Job Match Scoring System is completely independent from the ATS (Applicant Tracking System) scoring engine. While ATS scoring evaluates how well a resume is formatted for automated systems, Job Match scoring evaluates how well a **candidate** matches a **specific job's requirements**.

## Key Differences

### ATS Score (Resume Analysis)
- **Purpose**: Evaluate resume formatting and ATS compatibility
- **Focus**:
  - Document structure and formatting
  - Keyword density and placement
  - ATS system readability
  - General best practices
- **Score Range**: 0-100
- **Evaluation**: General compatibility with ATS systems
- **Location**: Generated during resume upload/analysis

### Job Match Score (Job Matching)
- **Purpose**: Evaluate candidate fit for a specific job
- **Focus**:
  - Required qualifications match
  - Preferred qualifications match
  - Relevant experience alignment
  - Demonstrated achievements
  - Experience level appropriateness
- **Score Range**: 0-100
- **Evaluation**: Job-specific candidate fit
- **Location**: Generated when matching resume to a job

## Job Match Scoring Breakdown

The Job Match Score is calculated based on four key criteria:

### 1. Required Qualifications (40 points max)
- Education requirements
- Years of experience
- Must-have technical skills
- Must-have domain knowledge
- Required certifications/licenses

### 2. Preferred Qualifications (25 points max)
- Nice-to-have skills
- Preferred technologies/tools
- Preferred industry experience
- Additional certifications
- Bonus qualifications

### 3. Relevant Experience (20 points max)
- Similar role experience
- Same industry/domain
- Company size/type match
- Project complexity match
- Leadership level match

### 4. Demonstrated Achievements (15 points max)
- Quantifiable results in similar roles
- Relevant problem-solving examples
- Impact and scope of past work
- Awards/recognition in relevant areas
- Portfolio/projects alignment

## Score Interpretation

| Score Range | Match Level | Meaning | Interview Recommendation |
|------------|-------------|---------|-------------------------|
| 90-100 | Outstanding | Exceeds all requirements | Strongly Recommend |
| 80-89 | Excellent | Meets all requirements + extras | Recommend |
| 70-79 | Good | Meets most requirements | Recommend |
| 60-69 | Fair | Meets basic requirements | Consider |
| 50-59 | Marginal | Significant gaps | Not Recommended |
| Below 50 | Poor | Missing most requirements | Not Recommended |

## Additional Match Analysis Features

### Interview Recommendation
- `strongly_recommend`: Top candidate, prioritize for interview
- `recommend`: Good candidate, schedule interview
- `consider`: Borderline candidate, review carefully
- `not_recommended`: Does not meet requirements

### Experience Level Match
Compares the candidate's experience level with the job's required level:
- **Job Level**: entry | mid | senior | lead | executive
- **Candidate Level**: entry | mid | senior | lead | executive
- **Match Status**: perfect | close | mismatch

### Interview Focus Areas
Specific questions and topics to explore during the interview to validate the candidate's fit for the role.

### Gaps Analysis
Detailed breakdown of:
- What the candidate is missing
- Severity of each gap (critical | important | nice-to-have)
- Current vs. required skill levels
- Suggestions for addressing gaps

## Use Cases

### For Job Seekers
1. Upload resume to get general ATS score (formatting quality)
2. Match resume against specific jobs to get job-specific fit scores
3. Optimize resume based on specific job requirements
4. Track improvement across multiple optimization iterations

### For Recruiters (Future)
1. Evaluate candidate fit for specific positions
2. Compare multiple candidates for the same role
3. Identify interview focus areas
4. Make data-driven hiring decisions

## Technical Implementation

### Configuration
- `lib/config/job-match-scoring.ts` - Scoring criteria and instructions

### Core Logic
- `lib/openai/job-matcher.ts` - AI-powered job matching engine

### Types
- `types/index.ts` - TypeScript interfaces for match analysis

### API
- `app/api/match/route.ts` - Job matching endpoint

### UI Components
- `app/(dashboard)/jobs/[id]/match/` - Job match selector
- `app/(dashboard)/match/[id]/` - Match results display

## Future Enhancements

1. **Weighted Scoring**: Allow customization of score component weights
2. **Skill Gap Training**: Suggest courses/resources to fill gaps
3. **Batch Matching**: Match one resume against multiple jobs
4. **Reverse Matching**: Find best jobs for a resume
5. **Team Collaboration**: Share match results with hiring teams
6. **Historical Analytics**: Track matching patterns over time
