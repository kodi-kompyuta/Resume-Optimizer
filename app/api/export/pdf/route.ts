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

    if (!resume.extracted_text) {
      return NextResponse.json(
        { error: 'Resume text not available' },
        { status: 400 }
      )
    }

    // Generate the PDF file
    const filename = resume.original_filename.replace(/\.[^/.]+$/, '.pdf')
    const buffer = await generatePdf(resume.extracted_text, filename)

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
