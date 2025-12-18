import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { optimizeResume } from '@/lib/openai/optimizer'
import { parseResumeStructure } from '@/lib/parsers/structure-parser'
import { OptimizationOptions, StructuredResume, OptimizationContext, Gap, RecommendedAddition, MatchAnalysis, SectionType } from '@/types'

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('[Optimize API] Authentication failed:', {
        hasAuthError: !!authError,
        authError: authError?.message,
        hasUser: !!user,
        userId: user?.id
      })
      return NextResponse.json(
        { error: 'Unauthorized. Please log in again.' },
        { status: 401 }
      )
    }

    console.log('[Optimize API] User authenticated:', user.id)

    // Get request body
    const body = await request.json()
    const { resumeId, jobDescriptionId, options } = body as {
      resumeId: string
      jobDescriptionId?: string
      options: OptimizationOptions
    }

    if (!resumeId) {
      return NextResponse.json(
        { error: 'Resume ID is required' },
        { status: 400 }
      )
    }

    if (!options) {
      return NextResponse.json(
        { error: 'Optimization options are required' },
        { status: 400 }
      )
    }

    // Fetch resume
    const { data: resume, error: resumeError } = await supabase
      .from('resumes')
      .select('*')
      .eq('id', resumeId)
      .eq('user_id', user.id)
      .single()

    if (resumeError || !resume) {
      return NextResponse.json(
        { error: 'Resume not found' },
        { status: 404 }
      )
    }

    // Get structured data or parse it if not available
    let structuredData: StructuredResume

    console.log('[Optimize API] Resume info:', {
      id: resumeId,
      filename: resume.original_filename,
      has_parent: !!resume.parent_resume_id,
      parent_id: resume.parent_resume_id,
      has_structured_data: !!resume.structured_data
    })

    if (resume.structured_data) {
      structuredData = resume.structured_data as StructuredResume

      // Log job count from structured data
      const jobCount = structuredData.sections
        .find(s => s.type === 'experience')?.content
        .filter(b => b.type === 'experience_item').length || 0
      const eduCount = structuredData.sections
        .find(s => s.type === 'education')?.content
        .filter(b => b.type === 'education_item').length || 0

      console.log('[Optimize API] Using cached structured_data:', {
        jobs: jobCount,
        education: eduCount
      })

      // WARNING: If this is an optimized version with lost jobs, we're compounding the problem
      if (resume.parent_resume_id && jobCount < 2) {
        console.warn('[Optimize API] ⚠️ WARNING: Optimizing an already-optimized resume with only', jobCount, 'job(s)')
        console.warn('[Optimize API] Consider re-parsing from original resume text instead')
      }
    } else {
      // Parse on the fly if structured data wasn't generated during upload
      console.log('[Optimize API] No structured_data found, parsing from resume_text...')
      structuredData = parseResumeStructure(resume.resume_text)

      const jobCount = structuredData.sections
        .find(s => s.type === 'experience')?.content
        .filter(b => b.type === 'experience_item').length || 0
      console.log('[Optimize API] Parsed', jobCount, 'jobs from resume_text')

      // Update database with structured data for future use
      await supabase
        .from('resumes')
        .update({ structured_data: structuredData })
        .eq('id', resumeId)
    }

    // Fetch job description and match analysis if provided
    let jobDescription: string | undefined
    let optimizationContext: OptimizationContext | undefined

    if (jobDescriptionId) {
      console.log('[Optimize API] Fetching job description...')
      const { data: jobData, error: jobError } = await supabase
        .from('job_descriptions')
        .select('job_description')
        .eq('id', jobDescriptionId)
        .eq('user_id', user.id)
        .single()

      if (!jobError && jobData) {
        jobDescription = jobData.job_description
        console.log('[Optimize API] Job description fetched')

        // Fetch match analysis if it exists
        console.log('[Optimize API] Fetching match analysis...')
        const { data: matchData, error: matchError } = await supabase
          .from('resume_job_matches')
          .select('match_score, match_analysis, gaps, recommended_additions, missing_keywords')
          .eq('resume_id', resumeId)
          .eq('job_description_id', jobDescriptionId)
          .maybeSingle()

        if (!matchError && matchData) {
          console.log('[Optimize API] Found existing match analysis, score:', matchData.match_score)

          // Build optimization context from match data
          const matchAnalysis = matchData.match_analysis as MatchAnalysis
          const gaps = (matchData.gaps || []) as Gap[]
          const recommendedAdditions = (matchData.recommended_additions || []) as RecommendedAddition[]

          // Prioritize gaps by optimization_priority (if available) or estimate
          const prioritizedGaps = gaps
            .map(gap => ({
              ...gap,
              optimization_priority: gap.optimization_priority || estimatePriority(gap.severity),
              impact_points: gap.impact_points || estimateImpact(gap.severity)
            }))
            .sort((a, b) => (b.optimization_priority || 0) - (a.optimization_priority || 0))

          // Extract high-value keywords
          const highValueKeywords = extractKeywords(matchData.missing_keywords)

          // Infer section priorities from gaps and recommendations
          const sectionPriorities = inferSectionPriorities(gaps, recommendedAdditions)

          optimizationContext = {
            current_score: matchData.match_score || 0,
            target_score: Math.min(100, (matchData.match_score || 0) + 10),
            score_breakdown: matchAnalysis.score_breakdown || {},
            prioritized_gaps: prioritizedGaps,
            high_value_keywords: highValueKeywords,
            section_priorities: sectionPriorities,
            strategic_guidance: generateGuidance(matchData.match_score || 0, gaps)
          }

          console.log('[Optimize API] Built optimization context:', {
            current_score: matchData.match_score,
            gaps_count: prioritizedGaps.length,
            keywords_count: highValueKeywords.length
          })
        } else {
          console.log('[Optimize API] No match analysis found, will perform match-blind optimization')
        }
      }
    }

    // Perform optimization with context
    const enhancedOptions: OptimizationOptions = {
      ...options,
      optimizationContext,
      enable_comprehensive_rewrite: !!optimizationContext && (optimizationContext.current_score < 90)
    }

    const optimizationResult = await optimizeResume(
      structuredData,
      enhancedOptions,
      jobDescription
    )

    // Track usage
    await supabase
      .from('usage_tracking')
      .insert({
        user_id: user.id,
        action: 'resume_optimization',
        credits_used: 2, // Optimization costs more than basic analysis
        metadata: {
          resume_id: resumeId,
          job_description_id: jobDescriptionId,
          changes_count: optimizationResult.changes.length,
        }
      })

    // Return optimization result
    return NextResponse.json({
      success: true,
      result: optimizationResult,
      message: `Successfully optimized resume with ${optimizationResult.changes.length} improvements`
    })

  } catch (error) {
    console.error('Optimization error:', error)
    return NextResponse.json(
      { error: 'Optimization failed. Please try again.' },
      { status: 500 }
    )
  }
}

// Helper functions for optimization context building

function estimatePriority(severity: string): number {
  switch (severity) {
    case 'critical': return 10
    case 'important': return 7
    case 'nice-to-have': return 3
    default: return 5
  }
}

function estimateImpact(severity: string): number {
  switch (severity) {
    case 'critical': return 8
    case 'important': return 5
    case 'nice-to-have': return 2
    default: return 3
  }
}

function extractKeywords(missingKeywords: any): string[] {
  const keywords: string[] = []
  if (Array.isArray(missingKeywords)) {
    keywords.push(...missingKeywords)
  } else if (typeof missingKeywords === 'object' && missingKeywords !== null) {
    // Flatten categorized keywords
    Object.values(missingKeywords).forEach((kws: any) => {
      if (Array.isArray(kws)) keywords.push(...kws)
    })
  }
  return [...new Set(keywords)].slice(0, 15)
}

function inferSectionPriorities(gaps: Gap[], additions: RecommendedAddition[]): any[] {
  const sectionScores: Record<string, { score: number, count: number }> = {}

  additions.forEach(add => {
    const section = add.section
    if (!sectionScores[section]) {
      sectionScores[section] = { score: 0, count: 0 }
    }
    sectionScores[section].score += (add.impact_points || 3)
    sectionScores[section].count++
  })

  return Object.entries(sectionScores)
    .sort((a, b) => b[1].score - a[1].score)
    .map(([section, data]) => ({
      section_type: section as SectionType,
      priority: Math.min(10, Math.ceil(data.score)),
      reason: `${data.count} high-impact recommendation${data.count > 1 ? 's' : ''} with ${data.score} total impact points`
    }))
}

function generateGuidance(score: number, gaps: Gap[]): string {
  const criticalGaps = gaps.filter(g => g.severity === 'critical').length

  if (score >= 85) {
    return `Good foundation - focus on integrating missing keywords and emphasizing existing strengths to push toward excellent match.`
  } else if (score >= 70) {
    return `Moderate match - comprehensively rewrite bullets to demonstrate required qualifications and integrate critical keywords. Address ${criticalGaps} critical gaps.`
  } else {
    return `Significant gaps - major rewrite needed. Reframe all experience to align with job requirements, address ${criticalGaps} critical gaps, and integrate all missing keywords.`
  }
}
