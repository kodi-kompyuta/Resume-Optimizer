import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { generateDocx } from '@/lib/services/docx-export'

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

    // Generate the DOCX file
    const filename = resume.original_filename.replace(/\.[^/.]+$/, '.docx')
    const buffer = await generateDocx(resume.extracted_text, filename)

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
