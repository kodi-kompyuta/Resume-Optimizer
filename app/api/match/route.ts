import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { matchResumeToJob } from '@/lib/openai/job-matcher'

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { resume_id, job_description_id } = body

    if (!resume_id || !job_description_id) {
      return NextResponse.json(
        { error: 'Resume ID and Job Description ID are required' },
        { status: 400 }
      )
    }

    // Fetch resume
    const { data: resume, error: resumeError } = await supabase
      .from('resumes')
      .select('*')
      .eq('id', resume_id)
      .eq('user_id', user.id)
      .single()

    if (resumeError || !resume) {
      return NextResponse.json(
        { error: 'Resume not found' },
        { status: 404 }
      )
    }

    // Fetch job description
    const { data: job, error: jobError } = await supabase
      .from('job_descriptions')
      .select('*')
      .eq('id', job_description_id)
      .eq('user_id', user.id)
      .single()

    if (jobError || !job) {
      return NextResponse.json(
        { error: 'Job description not found' },
        { status: 404 }
      )
    }

    // Check if match already exists
    const { data: existingMatch } = await supabase
      .from('resume_job_matches')
      .select('id')
      .eq('resume_id', resume_id)
      .eq('job_description_id', job_description_id)
      .single()

    if (existingMatch) {
      // Return existing match
      return NextResponse.json({
        matchId: existingMatch.id,
        message: 'Match already exists'
      })
    }

    // Perform AI matching analysis
    const matchResult = await matchResumeToJob({
      resumeText: resume.resume_text,
      jobDescription: job.job_description,
      jobTitle: job.job_title
    })

    // Create match record
    const { data: match, error: matchError } = await supabase
      .from('resume_job_matches')
      .insert({
        user_id: user.id,
        resume_id: resume_id,
        job_description_id: job_description_id,
        match_score: matchResult.match_analysis.match_score,
        match_analysis: matchResult.match_analysis,
        missing_keywords: matchResult.missing_keywords,
        recommended_additions: matchResult.recommended_additions,
        strengths: matchResult.match_analysis.key_strengths,
        gaps: matchResult.gaps
      })
      .select()
      .single()

    if (matchError) {
      console.error('Match creation error:', matchError)
      return NextResponse.json(
        { error: 'Failed to save match results' },
        { status: 500 }
      )
    }

    // Track usage
    await supabase
      .from('usage_tracking')
      .insert({
        user_id: user.id,
        action: 'job_match_analysis',
        credits_used: 1,
        metadata: {
          resume_id,
          job_description_id,
          match_score: matchResult.match_analysis.match_score
        }
      })

    return NextResponse.json({
      matchId: match.id,
      matchScore: matchResult.match_analysis.match_score,
      message: 'Match analysis completed successfully'
    })

  } catch (error) {
    console.error('Job match error:', error)
    return NextResponse.json(
      { error: 'Match analysis failed. Please try again.' },
      { status: 500 }
    )
  }
}