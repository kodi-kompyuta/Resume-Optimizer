import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { StructuredResume, ChangeLog } from '@/types'

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

    // Get request body
    const body = await request.json()
    const {
      resumeId,
      optimizedResume,
      optimizedJson,
      acceptedChanges,
      createNewVersion
    } = body as {
      resumeId: string
      optimizedResume: StructuredResume
      optimizedJson?: any
      acceptedChanges: ChangeLog[]
      createNewVersion: boolean
    }

    if (!resumeId || !optimizedResume) {
      return NextResponse.json(
        { error: 'Resume ID and optimized resume are required' },
        { status: 400 }
      )
    }

    // Fetch original resume
    const { data: originalResume, error: resumeError } = await supabase
      .from('resumes')
      .select('*')
      .eq('id', resumeId)
      .eq('user_id', user.id)
      .single()

    if (resumeError || !originalResume) {
      return NextResponse.json(
        { error: 'Resume not found' },
        { status: 404 }
      )
    }

    // Convert optimized structured data back to plain text for storage
    const optimizedText = convertStructuredToText(optimizedResume)
    const wordCount = optimizedText.split(/\s+/).filter(w => w.length > 0).length

    let savedResumeId: string

    if (createNewVersion) {
      // Create new resume version
      const insertData: any = {
        user_id: user.id,
        original_filename: originalResume.original_filename,
        resume_text: optimizedText,
        structured_data: optimizedResume,
        word_count: wordCount,
        status: 'completed',
        parent_resume_id: resumeId,
        version_name: `Optimized - ${new Date().toLocaleDateString()}`,
      }

      // Add optimized_json_data for professional template
      if (optimizedJson) {
        insertData.optimized_json_data = optimizedJson
      }

      const { data: newResume, error: createError } = await supabase
        .from('resumes')
        .insert(insertData)
        .select()
        .single()

      if (createError) {
        console.error('Error creating new version:', createError)
        return NextResponse.json(
          { error: 'Failed to create optimized version' },
          { status: 500 }
        )
      }

      savedResumeId = newResume.id
    } else {
      // Update existing resume
      const updateData: any = {
        resume_text: optimizedText,
        structured_data: optimizedResume,
        word_count: wordCount,
        updated_at: new Date().toISOString(),
      }

      // Add optimized_json_data for professional template
      if (optimizedJson) {
        updateData.optimized_json_data = optimizedJson
      }

      const { error: updateError } = await supabase
        .from('resumes')
        .update(updateData)
        .eq('id', resumeId)

      if (updateError) {
        console.error('Error updating resume:', updateError)
        return NextResponse.json(
          { error: 'Failed to update resume' },
          { status: 500 }
        )
      }

      savedResumeId = resumeId
    }

    // Store optimization history (non-critical)
    const { error: historyError } = await supabase
      .from('optimization_history')
      .insert({
        user_id: user.id,
        original_resume_id: resumeId,
        optimized_resume_id: savedResumeId,
        changes_applied: acceptedChanges,
        changes_count: acceptedChanges.length,
        created_at: new Date().toISOString(),
      })

    if (historyError) {
      // Non-critical, just log error
      console.error('Error saving optimization history:', historyError)
    }

    return NextResponse.json({
      success: true,
      resumeId: savedResumeId,
      message: createNewVersion
        ? 'Optimized version created successfully'
        : 'Resume updated successfully',
      changesApplied: acceptedChanges.length,
    })

  } catch (error) {
    console.error('Apply optimization error:', error)
    return NextResponse.json(
      { error: 'Failed to apply optimization. Please try again.' },
      { status: 500 }
    )
  }
}

/**
 * Convert structured resume back to plain text
 */
function convertStructuredToText(structured: StructuredResume): string {
  const lines: string[] = []

  for (const section of structured.sections) {
    // Add section heading
    lines.push('')
    lines.push(section.heading.toUpperCase())
    lines.push('')

    // Add section content
    for (const block of section.content) {
      switch (block.type) {
        case 'contact_info':
          const contact = block.content as any
          if (contact.name) lines.push(contact.name)
          if (contact.email) lines.push(contact.email)
          if (contact.phone) lines.push(contact.phone)
          if (contact.location) lines.push(contact.location)
          if (contact.linkedin) lines.push(contact.linkedin)
          if (contact.github) lines.push(contact.github)
          break

        case 'text':
          lines.push(block.content as string)
          break

        case 'experience_item':
          const exp = block.content as any
          // CRITICAL: Always preserve job title, company, location, dates, and description
          if (exp.jobTitle) lines.push(exp.jobTitle)
          if (exp.company) lines.push(exp.company)

          // Build date line if we have location or dates
          if (exp.location || exp.startDate || exp.endDate) {
            const dateParts: string[] = []
            if (exp.location) dateParts.push(exp.location)
            if (exp.startDate || exp.endDate) {
              const dateRange = [exp.startDate, exp.endDate].filter(Boolean).join(' - ')
              if (dateRange) dateParts.push(dateRange)
            }
            if (dateParts.length > 0) {
              lines.push(dateParts.join(' | '))
            }
          }

          // CRITICAL: Add position summary/description if present
          if (exp.description) {
            lines.push(exp.description)
            lines.push('') // Empty line after description
          }

          // Add achievements (bullet points) - may be empty array
          if (exp.achievements && Array.isArray(exp.achievements)) {
            exp.achievements.forEach((bullet: any) => {
              if (bullet.text) {
                lines.push(`- ${bullet.text}`)
              }
            })
          }
          lines.push('')
          break

        case 'education_item':
          const edu = block.content as any
          lines.push(edu.degree)
          if (edu.institution) lines.push(edu.institution)
          if (edu.location || edu.graduationDate) {
            const dateLine = [edu.location, edu.graduationDate]
              .filter(Boolean)
              .join(' | ')
            lines.push(dateLine)
          }
          if (edu.gpa) lines.push(`GPA: ${edu.gpa}`)
          if (edu.achievements) {
            edu.achievements.forEach((bullet: any) => {
              lines.push(`- ${bullet.text}`)
            })
          }
          lines.push('')
          break

        case 'bullet_list':
          const bullets = block.content as any
          bullets.items.forEach((bullet: any) => {
            lines.push(`- ${bullet.text}`)
          })
          break

        case 'skill_group':
          const skills = block.content as any
          if (skills.category) {
            lines.push(`${skills.category}:`)
          }
          lines.push(skills.skills.join(', '))
          break
      }
    }
  }

  return lines.join('\n')
}
