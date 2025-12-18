import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { generateDocx } from '@/lib/services/docx-export'
import { fillResumeTemplate } from '@/lib/templates/fill-template'
import { parseDOCX } from '@/lib/parsers/docx'
import { ResumeStructureParser } from '@/lib/parsers/structure-parser'
import { StructuredResume } from '@/types'

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

      if (jobMatch?.job_descriptions && !Array.isArray(jobMatch.job_descriptions) && (jobMatch.job_descriptions as any)?.job_title) {
        // Job-specific optimization: use job title
        const jobTitle = (jobMatch.job_descriptions as any).job_title
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

    filename = `${filename}.docx`

    let buffer: Buffer
    const resumeData = resume.structured_data || resume.resume_text

    // TEMPORARILY DISABLED: Professional template is generating malformed DOCX files
    // Validation shows re-parsed DOCX has 0 jobs when original has 6
    // Using legacy generator until template can be fixed
    console.log('[DOCX Export] Using legacy generator (professional template disabled)')
    buffer = await generateDocx(resumeData, filename)

    // if (resume.optimized_json_data) {
    //   console.log('[DOCX Export] Using new professional template with optimized JSON data')
    //   buffer = await fillResumeTemplate(resume.optimized_json_data)
    // }
    // else {
    //   console.log('[DOCX Export] Using legacy generator')
    //   buffer = await generateDocx(resumeData, filename)
    // }

    // CRITICAL: Validate the exported DOCX maintains correct structure
    // This prevents broken exports with duplicate jobs
    if (typeof resumeData === 'object' && resumeData.sections) {
      try {
        console.log('[Export Validation] Starting validation...')
        const originalStructured = resumeData as StructuredResume

        // Re-parse the generated DOCX
        const reparsedText = await parseDOCX(buffer)
        const reparsedStructured = new ResumeStructureParser(reparsedText).parse()

        // Count experience items in original
        const origExpSection = originalStructured.sections.find(s => s.type === 'experience')
        const origJobCount = origExpSection
          ? origExpSection.content.filter(b => b.type === 'experience_item').length
          : 0

        // Count experience items in re-parsed
        const newExpSection = reparsedStructured.sections.find(s => s.type === 'experience')
        const newJobCount = newExpSection
          ? newExpSection.content.filter(b => b.type === 'experience_item').length
          : 0

        console.log(`[Export Validation] Original jobs: ${origJobCount}, Re-parsed jobs: ${newJobCount}`)

        if (origJobCount !== newJobCount) {
          console.error(
            `[Export Validation] ⚠️  WARNING: Job count mismatch! ` +
            `Original: ${origJobCount}, Re-parsed: ${newJobCount}. ` +
            `This may indicate formatting issues in the exported DOCX.`
          )
          // Log the job titles for debugging
          console.error('[Export Validation] Original jobs:',
            origExpSection?.content
              .filter(b => b.type === 'experience_item')
              .map((b: any) => b.content.jobTitle)
          )
          console.error('[Export Validation] Re-parsed jobs:',
            newExpSection?.content
              .filter(b => b.type === 'experience_item')
              .map((b: any) => b.content.jobTitle)
          )
        } else {
          console.log('[Export Validation] ✓ Validation passed - job count matches')
        }

        // Validate section count
        if (originalStructured.sections.length !== reparsedStructured.sections.length) {
          console.warn(
            `[Export Validation] Section count changed: ${originalStructured.sections.length} → ${reparsedStructured.sections.length}`
          )
        }
      } catch (validationError) {
        console.error('[Export Validation] Validation failed:', validationError)
        // Don't block the export, just log the error
      }
    }

    // Return the file as a download
    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.length.toString(),
      },
    })
  } catch (error) {
    console.error('Error in DOCX export:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to export as DOCX' },
      { status: 500 }
      )
  }
}
