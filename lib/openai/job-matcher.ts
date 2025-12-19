import OpenAI from 'openai'
import { MatchAnalysis, RecommendedAddition, Gap, OptimizationContext, SectionType } from '@/types'
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

**CRITICAL: Domain Alignment Check**
Before analyzing the match, determine:
1. The candidate's primary domain/industry from their resume (e.g., Healthcare/Medicine, Information Technology, Engineering, Finance, Marketing, Legal, etc.)
2. The job's domain/industry from the job description
3. Whether these domains are compatible for optimization

**Domain Compatibility Rules:**
- COMPATIBLE: Same domain (IT → IT, Healthcare → Healthcare) or closely related (Software Engineer → DevOps, Marketing → Brand Management)
- INCOMPATIBLE: Completely different domains (Doctor → IT Engineer, Lawyer → Graphic Designer, Accountant → Nurse)

If domains are INCOMPATIBLE, set a flag: domain_mismatch = true and explain why optimization would be inappropriate.

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

5. **PRIORITIZE OPTIMIZATION OPPORTUNITIES:**
   - For each gap, estimate how many points (0-10) closing it could add to the match score
   - Rank gaps by optimization priority (1-10, where 10 = highest priority to address)
   - Identify the top 15 high-value keywords from the job description that would most improve the match
   - Recommend which resume sections should be optimized first and why

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
  optimization_context?: OptimizationContext // NEW: Strategic optimization context
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

    // Check for domain mismatch
    const domainMismatch = result.domain_mismatch === true
    if (domainMismatch) {
      console.warn('[Job Matcher] ⚠️ DOMAIN MISMATCH DETECTED')
      console.warn(`[Job Matcher] Candidate Domain: ${result.candidate_domain}`)
      console.warn(`[Job Matcher] Job Domain: ${result.job_domain}`)
      console.warn(`[Job Matcher] Reason: ${result.domain_mismatch_reason}`)
      console.warn('[Job Matcher] Optimization will be BLOCKED for this match')
    }

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
      experience_level_match: result.experience_level_match,
      // Domain alignment fields
      candidate_domain: result.candidate_domain,
      job_domain: result.job_domain,
      domain_mismatch: domainMismatch,
      domain_mismatch_reason: result.domain_mismatch_reason
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

    // Build optimization context for strategic optimization with error handling
    let optimizationContext: OptimizationContext | undefined

    try {
      console.log('[Job Matcher] Building optimization context...')

      const gaps: Gap[] = (result.gaps || []).map((gap: any) => ({
        requirement: gap.requirement,
        severity: gap.severity,
        suggestion: gap.suggestion,
        current_level: gap.current_level,
        required_level: gap.required_level,
        impact_points: gap.impact_points || estimateImpactPoints(gap.severity),
        optimization_priority: gap.optimization_priority || estimatePriority(gap.severity)
      }))
      console.log('[Job Matcher] Processed gaps:', gaps.length)

      // Sort gaps by optimization priority (highest first)
      const prioritizedGaps = [...gaps].sort((a, b) =>
        (b.optimization_priority || 0) - (a.optimization_priority || 0)
      )
      console.log('[Job Matcher] Prioritized gaps:', prioritizedGaps.length)

      // Extract high-value keywords
      const highValueKeywords = extractHighValueKeywords(result.missing_keywords, result.missing_preferred, missingKeywords)
      console.log('[Job Matcher] Extracted keywords:', highValueKeywords.length)

      // Infer section priorities from gaps and recommendations
      const sectionPriorities = inferSectionPriorities(gaps, result.recommended_additions || [])
      console.log('[Job Matcher] Section priorities:', sectionPriorities.length)

      // Generate strategic guidance
      const strategicGuidance = generateStrategicGuidance(matchScore, gaps)
      console.log('[Job Matcher] Generated guidance:', strategicGuidance.substring(0, 50) + '...')

      optimizationContext = {
        current_score: matchScore,
        target_score: Math.min(100, matchScore + 10), // Target +10 points improvement
        score_breakdown: matchAnalysis.score_breakdown || {},
        prioritized_gaps: prioritizedGaps,
        high_value_keywords: highValueKeywords,
        section_priorities: sectionPriorities,
        strategic_guidance: strategicGuidance
      }

      console.log('[Job Matcher] ✅ Successfully built optimization context:', {
        current_score: matchScore,
        gaps_count: prioritizedGaps.length,
        keywords_count: highValueKeywords.length,
        section_priorities_count: sectionPriorities.length
      })
    } catch (contextError) {
      console.error('[Job Matcher] ⚠️ Error building optimization context:', contextError)
      console.error('[Job Matcher] Will proceed without optimization context')
      // Continue without optimization context - it's optional
      optimizationContext = undefined
    }

    return {
      match_analysis: matchAnalysis,
      missing_keywords: missingKeywords,
      recommended_additions: result.recommended_additions || [],
      gaps: result.gaps || [],
      optimization_context: optimizationContext
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

// Helper functions for optimization context building

function estimateImpactPoints(severity: string): number {
  switch (severity) {
    case 'critical': return 8
    case 'important': return 5
    case 'nice-to-have': return 2
    default: return 3
  }
}

function estimatePriority(severity: string): number {
  switch (severity) {
    case 'critical': return 10
    case 'important': return 7
    case 'nice-to-have': return 3
    default: return 5
  }
}

function extractHighValueKeywords(missingKeywords: any, missingPreferred: any, flatMissing: string[]): string[] {
  const keywords: string[] = []

  // Add from missing_keywords object
  if (typeof missingKeywords === 'object' && missingKeywords !== null) {
    Object.values(missingKeywords).forEach((kws: any) => {
      if (Array.isArray(kws)) {
        keywords.push(...kws)
      }
    })
  }

  // Add from missing_preferred
  if (Array.isArray(missingPreferred)) {
    keywords.push(...missingPreferred)
  }

  // Add from flat missing keywords
  if (Array.isArray(flatMissing)) {
    keywords.push(...flatMissing)
  }

  // Dedupe and return top 15
  return [...new Set(keywords)].slice(0, 15)
}

function inferSectionPriorities(gaps: Gap[], additions: RecommendedAddition[]): any[] {
  const sectionScores: Record<string, { score: number, count: number, reasons: string[] }> = {}

  // Score based on recommended additions
  additions.forEach(add => {
    const section = add.section
    if (!sectionScores[section]) {
      sectionScores[section] = { score: 0, count: 0, reasons: [] }
    }
    sectionScores[section].score += (add.impact_points || 3)
    sectionScores[section].count++
    if (add.reason && !sectionScores[section].reasons.includes(add.reason)) {
      sectionScores[section].reasons.push(add.reason)
    }
  })

  // Convert to priority list
  return Object.entries(sectionScores)
    .sort((a, b) => b[1].score - a[1].score)
    .map(([section, data]) => ({
      section_type: section as SectionType,
      priority: Math.min(10, Math.ceil(data.score)),
      reason: `${data.count} high-impact recommendation${data.count > 1 ? 's' : ''} (${data.score} total impact points)`
    }))
    .slice(0, 5) // Top 5 sections
}

function generateStrategicGuidance(score: number, gaps: Gap[]): string {
  const criticalGaps = gaps.filter(g => g.severity === 'critical').length
  const importantGaps = gaps.filter(g => g.severity === 'important').length

  if (score >= 90) {
    return 'Excellent foundation. Focus on highlighting existing strengths and adding missing preferred keywords to push toward outstanding match.'
  } else if (score >= 75) {
    return `Good match with room for improvement. Comprehensively rewrite bullets to demonstrate required qualifications and integrate critical keywords. Address ${criticalGaps} critical gap${criticalGaps !== 1 ? 's' : ''}.`
  } else if (score >= 60) {
    return `Moderate match requiring significant enhancement. Rewrite experience bullets to emphasize relevant achievements and integrate all missing keywords. Address ${criticalGaps} critical and ${importantGaps} important gaps.`
  } else {
    return `Significant gaps detected. Major rewrite needed - reframe all experience to align with job requirements, address ${criticalGaps} critical gaps, and integrate all missing qualifications and keywords.`
  }
}