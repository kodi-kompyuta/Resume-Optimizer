import OpenAI from 'openai'
import { MatchAnalysis, RecommendedAddition, Gap } from '@/types'
import { JOB_MATCH_SCORING_INSTRUCTIONS, JOB_MATCH_RESPONSE_FORMAT } from '@/lib/config/job-match-scoring'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
})

const JOB_MATCH_SYSTEM_PROMPT = `You are an expert career advisor helping job seekers understand how well their resume matches specific job opportunities.

Your role is to evaluate how well the user's resume matches a specific job description and provide actionable feedback.
This is NOT an ATS compatibility check - focus purely on job fit and qualifications.

${JOB_MATCH_SCORING_INSTRUCTIONS}

**Return Format (JSON only, no markdown):**
${JOB_MATCH_RESPONSE_FORMAT}

IMPORTANT REMINDERS:
- Focus on job-specific match, NOT resume formatting or ATS compatibility
- Consider the specific requirements of THIS job, not general best practices
- Be objective and realistic - neither overly harsh nor overly generous
- Provide actionable feedback specific to THIS job opportunity
- Identify true dealbreakers vs. areas where training could help
- Use "you/your" language - you're speaking directly to the job seeker`

const JOB_MATCH_PROMPT = `Analyze how well this resume matches the job requirements below.

**Your Task:**
1. Carefully read the job description and identify:
   - Required qualifications (must-haves)
   - Preferred qualifications (nice-to-haves)
   - Experience level needed
   - Key skills and technologies
   - Domain/industry requirements

2. Evaluate the user's resume against these requirements:
   - What required qualifications do they have/lack?
   - What preferred qualifications do they have/lack?
   - How does their experience level match?
   - What relevant achievements can they demonstrate?

3. Calculate a JOB MATCH SCORE (0-100) based on:
   - Required Qualifications Match: 40 points
   - Preferred Qualifications Match: 25 points
   - Relevant Experience: 20 points
   - Demonstrated Achievements: 15 points

4. Provide specific, actionable feedback for improving the match.

---

JOB TITLE: {jobTitle}

JOB DESCRIPTION:
{jobDescription}

---

YOUR RESUME:
{resumeText}

---

Provide your complete analysis in the JSON format specified in the system prompt.`

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
  try {
    console.log('[Job Matcher] Starting job match analysis...')
    console.log('[Job Matcher] Job:', jobTitle)

    const userPrompt = JOB_MATCH_PROMPT
      .replace('{jobTitle}', jobTitle)
      .replace('{jobDescription}', jobDescription)
      .replace('{resumeText}', resumeText)

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: JOB_MATCH_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.3, // Lower temperature for more consistent scoring
      max_tokens: 4000,
      response_format: { type: 'json_object' },
    })

    const content = completion.choices[0].message.content
    if (!content) {
      console.error('[Job Matcher] No response content from OpenAI')
      throw new Error('No response from AI')
    }

    console.log('[Job Matcher] Received response from OpenAI, parsing JSON...')
    const result = JSON.parse(content)

    // The response should be at the top level
    const matchScore = result.match_score

    // Validate that match_score exists and is a number
    if (typeof matchScore !== 'number' || matchScore < 0 || matchScore > 100) {
      console.error('[Job Matcher] Invalid match_score in response:', matchScore)
      console.error('[Job Matcher] Full response preview:', content.substring(0, 500))
      throw new Error('Invalid match_score returned from AI')
    }

    console.log('[Job Matcher] Successfully parsed match_score:', matchScore)
    console.log('[Job Matcher] Match level:', result.match_level)
    console.log('[Job Matcher] Interview recommendation:', result.interview_recommendation)

    // Build the match analysis object
    const matchAnalysis: MatchAnalysis = {
      match_score: matchScore,
      score_breakdown: result.score_breakdown || {
        required_qualifications: 0,
        preferred_qualifications: 0,
        relevant_experience: 0,
        demonstrated_achievements: 0
      },
      summary: result.summary || '',
      key_strengths: result.key_strengths || [],
      critical_gaps: result.critical_gaps || [],
      match_level: result.match_level,
      interview_recommendation: result.interview_recommendation,
      interview_focus_areas: result.interview_focus_areas || [],
      experience_level_match: result.experience_level_match
    }

    // Extract missing keywords (flatten the object structure)
    const missingKeywords: string[] = []
    if (result.missing_keywords) {
      Object.values(result.missing_keywords).forEach((keywords: any) => {
        if (Array.isArray(keywords)) {
          missingKeywords.push(...keywords)
        }
      })
    }

    // Also include missing_preferred as missing keywords
    if (result.missing_preferred && Array.isArray(result.missing_preferred)) {
      missingKeywords.push(...result.missing_preferred)
    }

    console.log('[Job Matcher] Extracted missing keywords:', missingKeywords.length)

    return {
      match_analysis: matchAnalysis,
      missing_keywords: missingKeywords,
      recommended_additions: result.recommended_additions || [],
      gaps: result.gaps || []
    }
  } catch (error) {
    console.error('[Job Matcher] Error in matchResumeToJob:', error)
    if (error instanceof Error) {
      console.error('[Job Matcher] Error message:', error.message)
      console.error('[Job Matcher] Error stack:', error.stack)
    }
    throw new Error('Failed to match resume to job')
  }
}