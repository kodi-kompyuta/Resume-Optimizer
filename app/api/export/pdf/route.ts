import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { generatePdf } from '@/lib/services/pdf-export'

export async function POST(request: Request) {
  try {
    const { resumeId } = await request.json()

    if (!resumeId) {
      return NextResponse.json(
        { error: 'Resume ID is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Fetch the resume
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

    if (!resume.resume_text && !resume.structured_data) {
      return NextResponse.json(
        { error: 'Resume text not available' },
        { status: 400 }
      )
    }

    // Generate filename with version control
    let filename = resume.original_filename.replace(/\.[^/.]+$/, '')

    // Check if this is an optimized version (has parent_resume_id)
    if (resume.parent_resume_id) {
      // Check if optimized for a specific job
      const { data: jobMatch } = await supabase
        .from('job_matches')
        .select('job_description_id, job_descriptions(job_title)')
        .eq('resume_id', resumeId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (jobMatch?.job_descriptions?.job_title) {
        // Job-specific optimization: use job title
        const jobTitle = jobMatch.job_descriptions.job_title
        // Truncate long job titles to 50 chars
        const truncatedTitle = jobTitle.length > 50
          ? jobTitle.substring(0, 47) + '...'
          : jobTitle
        filename = `${filename} - ${truncatedTitle}`
      } else {
        // General optimization: check if multiple versions exist
        const { data: siblings } = await supabase
          .from('resumes')
          .select('id')
          .eq('parent_resume_id', resume.parent_resume_id)
          .eq('user_id', user.id)
          .order('created_at', { ascending: true })

        const versionNumber = siblings?.findIndex(s => s.id === resumeId) ?? 0

        if (versionNumber > 0) {
          filename = `${filename} - Optimized v${versionNumber + 1}`
        } else {
          filename = `${filename} - Optimized`
        }
      }
    }

    filename = `${filename}.pdf`
    // Use structured data if available, otherwise fall back to plain text
    const buffer = await generatePdf(
      resume.structured_data || resume.resume_text,
      filename
    )

    // Return the file as a download
    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.length.toString(),
      },
    })
  } catch (error) {
    console.error('Error in PDF export:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to export as PDF' },
      { status: 500 }
    )
  }
}
