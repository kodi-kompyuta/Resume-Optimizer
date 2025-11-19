import { NextRequest, NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'

import { parsePDF } from '@/lib/parsers/pdf'

import { parseDOCX } from '@/lib/parsers/docx'

import { parseText } from '@/lib/parsers/text'

import { analyzeResume } from '@/lib/openai/analyzer'

 

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

 

    // Get the uploaded file

    const formData = await request.formData()

    const file = formData.get('file') as File

 

    if (!file) {

      return NextResponse.json(

        { error: 'No file uploaded' },

        { status: 400 }

      )

    }

 

    // Validate file type

    const allowedTypes = [

      'application/pdf',

      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',

      'application/msword',

      'text/plain'

    ]

 

    if (!allowedTypes.includes(file.type)) {

      return NextResponse.json(

        { error: 'Invalid file type. Please upload PDF, DOCX, or TXT file.' },

        { status: 400 }

      )

    }

 

    // Validate file size (max 5MB)

    const maxSize = 5 * 1024 * 1024

    if (file.size > maxSize) {

      return NextResponse.json(

        { error: 'File size exceeds 5MB limit' },

        { status: 400 }

      )

    }

 

    // Convert file to buffer

    const arrayBuffer = await file.arrayBuffer()

    const buffer = Buffer.from(arrayBuffer)

 

    // Parse resume text based on file type

    let resumeText: string

 

    try {

      if (file.type === 'application/pdf') {

        resumeText = await parsePDF(buffer)

      } else if (

        file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||

        file.type === 'application/msword'

      ) {

        resumeText = await parseDOCX(buffer)

      } else {

        resumeText = await parseText(buffer)

      }

    } catch (parseError) {

      console.error('File parsing error:', parseError)

      return NextResponse.json(

        { error: 'Failed to parse file. Please ensure the file is not corrupted.' },

        { status: 400 }

      )

    }

 

    // Validate that we extracted text

    if (!resumeText || resumeText.trim().length === 0) {

      return NextResponse.json(

        { error: 'Could not extract text from file. Please check the file content.' },

        { status: 400 }

      )

    }

 

    // Calculate word count

    const wordCount = resumeText.trim().split(/\s+/).length

 

    // Create resume record in database

    const { data: resume, error: dbError } = await supabase

      .from('resumes')

      .insert({

        user_id: user.id,

        original_filename: file.name,

        resume_text: resumeText,

        word_count: wordCount,

        status: 'processing'

      })

      .select()

      .single()

 

    if (dbError) {

      console.error('Database error:', dbError)

      return NextResponse.json(

        { error: 'Failed to save resume' },

        { status: 500 }

      )

    }

 

    // Start AI analysis in background (don't wait for it)

    analyzeResumeInBackground(resume.id, resumeText, user.id).catch(err => {
      console.error('Background analysis promise rejection:', err)
    })

 

    // Return resume ID immediately

    return NextResponse.json({

      resumeId: resume.id,

      status: 'processing',

      message: 'Resume uploaded successfully. Analysis in progress...'

    })

 

  } catch (error) {

    console.error('Upload error:', error)

    return NextResponse.json(

      { error: 'Upload failed. Please try again.' },

      { status: 500 }

    )

  }

}

 

// Background analysis function

async function analyzeResumeInBackground(resumeId: string, resumeText: string, userId: string) {

  try {

    const supabase = await createClient()

 

    // Perform AI analysis

    const analysisData = await analyzeResume(resumeText)

 

    // Update resume with analysis results

    await supabase

      .from('resumes')

      .update({

        ats_score: analysisData.ats_score,

        analysis_data: analysisData,

        status: 'completed',

        analyzed_at: new Date().toISOString()

      })

      .eq('id', resumeId)

 

    // Track usage

    await supabase

      .from('usage_tracking')

      .insert({

        user_id: userId,

        action: 'resume_analysis',

        credits_used: 1,

        metadata: {

          resume_id: resumeId,

          ats_score: analysisData.ats_score

        }

      })

 

    console.log(`Resume ${resumeId} analyzed successfully`)

  } catch (error) {

    console.error(`Background analysis failed for resume ${resumeId}:`, error)

 

    // Mark resume as failed

    const supabase = await createClient()

    await supabase

      .from('resumes')

      .update({

        status: 'failed'

      })

      .eq('id', resumeId)

  }

}

 