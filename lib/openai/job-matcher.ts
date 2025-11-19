import OpenAI from 'openai'
import { MatchAnalysis, RecommendedAddition, Gap } from '@/types'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
})

const JOB_MATCH_PROMPT = `You are an expert career coach and ATS (Applicant Tracking System) specialist. You will analyze how well a resume matches a specific job description.

Analyze the resume against the job description and provide a detailed match analysis in JSON format.

Your analysis should include:
1. **match_score** (0-100): Overall compatibility percentage
2. **overall_fit**: 2-3 sentence summary of how well the candidate fits
3. **technical_match** (0-100): How well technical skills match
4. **experience_match** (0-100): How well experience level matches
5. **education_match** (0-100): How well education matches
6. **skills_match** (0-100): How well listed skills match
7. **key_strengths**: Array of 3-5 resume elements that strongly match the job
8. **critical_gaps**: Array of missing must-have requirements
9. **nice_to_haves**: Array of preferred qualifications the candidate doesn't have
10. **dealbreakers**: Array of absolute requirements that might disqualify (if any)

Also provide:
- **missing_keywords**: Array of important keywords from the job not in the resume
- **recommended_additions**: Array of objects with:
  - section: where to add (skills/experience/education/summary/other)
  - content: what to add
  - reason: why it's important
  - priority: high/medium/low
- **gaps**: Array of objects with:
  - requirement: the missing requirement
  - severity: critical/important/nice-to-have
  - suggestion: how to address it or compensate

Be honest but constructive. Focus on actionable improvements.

Return ONLY valid JSON, no markdown formatting.`

interface JobMatchRequest {
  resumeText: string
  jobDescription: string
  jobTitle: string
}

interface JobMatchResult {
  match_analysis: MatchAnalysis
  missing_keywords: string[]
  recommended_additions: RecommendedAddition[]
  gaps: Gap[]
}

export async function matchResumeToJob({
  resumeText,
  jobDescription,
  jobTitle
}: JobMatchRequest): Promise<JobMatchResult> {
  const prompt = `
JOB TITLE: ${jobTitle}

JOB DESCRIPTION:
${jobDescription}

---

RESUME:
${resumeText}

---

Analyze how well this resume matches the job description. Provide detailed, actionable feedback.
  `.trim()

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: JOB_MATCH_PROMPT },
      { role: 'user', content: prompt }
    ],
    temperature: 0.7,
    max_tokens: 4000,
    response_format: { type: 'json_object' },
  })

  const content = completion.choices[0].message.content
  if (!content) {
    throw new Error('No response from AI')
  }

  const result = JSON.parse(content)

  return {
    match_analysis: result.match_analysis || result,
    missing_keywords: result.missing_keywords || [],
    recommended_additions: result.recommended_additions || [],
    gaps: result.gaps || []
  }
}