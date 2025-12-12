import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { optimizeResume } from '@/lib/openai/optimizer'
import { parseResumeStructure } from '@/lib/parsers/structure-parser'
import { OptimizationOptions, StructuredResume } from '@/types'

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
    if (resume.structured_data) {
      structuredData = resume.structured_data as StructuredResume
    } else {
      // Parse on the fly if structured data wasn't generated during upload
      structuredData = parseResumeStructure(resume.resume_text)

      // Update database with structured data for future use
      await supabase
        .from('resumes')
        .update({ structured_data: structuredData })
        .eq('id', resumeId)
    }

    // Fetch job description if provided
    let jobDescription: string | undefined
    if (jobDescriptionId) {
      const { data: jobData, error: jobError } = await supabase
        .from('job_descriptions')
        .select('job_description')
        .eq('id', jobDescriptionId)
        .eq('user_id', user.id)
        .single()

      if (!jobError && jobData) {
        jobDescription = jobData.job_description
      }
    }

    // Perform optimization
    const optimizationResult = await optimizeResume(
      structuredData,
      options,
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
