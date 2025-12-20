import { Document, Paragraph, TextRun, HeadingLevel, AlignmentType, Packer } from 'docx'
import { StructuredResume } from '@/types'

/**
 * Sanitize bullet text to ensure it's on a single line
 * This prevents broken bullets from being misidentified as job titles
 */
function sanitizeBulletText(text: string): string {
  return text
    .replace(/\n+/g, ' ')  // Remove all newlines
    .replace(/\r+/g, ' ')  // Remove carriage returns
    .replace(/\s+/g, ' ')  // Collapse multiple spaces into one
    .trim()
}

/**
 * Sanitize any text content to remove problematic characters
 */
function sanitizeText(text: string): string {
  return text
    .replace(/\n+/g, ' ')  // Remove newlines
    .replace(/\r+/g, ' ')  // Remove carriage returns
    .replace(/\s+/g, ' ')  // Collapse spaces
    .trim()
}

/**
 * Pre-process text to merge broken bullet points
 * This fixes bullets that were split across multiple lines
 */
function preprocessText(text: string): string {
  const lines = text.split('\n')
  const processed: string[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) {
      // Preserve blank lines (but not more than 2 in a row)
      if (processed.length > 0 && processed[processed.length - 1] !== '') {
        processed.push('')
      }
      continue
    }

    // If line starts with bullet marker, it's a new bullet
    if (/^[•\-*]/.test(line)) {
      processed.push(line)
    }
    // If previous line was a bullet and this line doesn't start with bullet,
    // it's probably a continuation - merge it
    else if (
      processed.length > 0 &&
      /^[•\-*]/.test(processed[processed.length - 1])
    ) {
      processed[processed.length - 1] += ' ' + line
    }
    // Otherwise, it's a regular line
    else {
      processed.push(line)
    }
  }

  return processed.join('\n')
}

export async function generateDocx(
  resumeData: string | StructuredResume,
  filename: string
): Promise<Buffer> {
  try {
    // If structured data, convert to formatted text first
    let resumeText = typeof resumeData === 'string'
      ? resumeData
      : convertStructuredToFormattedText(resumeData)

    // CRITICAL: Pre-process text to merge broken bullets before creating paragraphs
    resumeText = preprocessText(resumeText)

    // Parse the resume text into sections
    const lines = resumeText.split('\n').filter(line => line.trim())

    const paragraphs: Paragraph[] = []

    for (const line of lines) {
      const trimmedLine = line.trim()

      if (!trimmedLine) continue

      // Detect headings (lines that are all caps, or followed by a separator)
      const isHeading =
        trimmedLine === trimmedLine.toUpperCase() &&
        trimmedLine.length > 2 &&
        trimmedLine.length < 50 &&
        /^[A-Z\s]+$/.test(trimmedLine)

      if (isHeading) {
        paragraphs.push(
          new Paragraph({
            text: trimmedLine,
            heading: HeadingLevel.HEADING_2,
            spacing: {
              before: 240,
              after: 120,
            },
          })
        )
      } else if (trimmedLine.startsWith('•') || trimmedLine.startsWith('-') || trimmedLine.startsWith('*')) {
        // Bullet points - justified alignment
        paragraphs.push(
          new Paragraph({
            text: trimmedLine.replace(/^[•\-*]\s*/, ''),
            bullet: {
              level: 0,
            },
            alignment: AlignmentType.BOTH, // Justified text
            spacing: {
              after: 80,
            },
          })
        )
      } else {
        // Regular paragraphs - justified alignment
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: trimmedLine,
              }),
            ],
            alignment: AlignmentType.BOTH, // Justified text
            spacing: {
              after: 120,
            },
          })
        )
      }
    }

    // Create the document
    const doc = new Document({
      sections: [
        {
          properties: {
            page: {
              margin: {
                top: 720,    // 0.5 inch
                right: 720,
                bottom: 720,
                left: 720,
              },
            },
          },
          children: paragraphs,
        },
      ],
    })

    // Generate buffer
    const buffer = await Packer.toBuffer(doc)
    return buffer
  } catch (error) {
    console.error('Error generating DOCX:', error)
    throw new Error('Failed to generate DOCX file')
  }
}

function convertStructuredToFormattedText(structured: StructuredResume): string {
  const lines: string[] = []

  // Get format preferences (default to single-line for safety/compatibility)
  const experienceFormat = structured.metadata.formatting?.experienceFormat || 'single-line'
  const educationFormat = structured.metadata.formatting?.educationFormat || 'single-line'

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

          // Export based on format preference
          if (experienceFormat === 'single-line') {
            // SINGLE-LINE FORMAT: "Job Title - Company | Location | Dates"
            // Better for ATS, more compact, parser-friendly
            const headerParts: string[] = []

            // Part 1: Job Title - Company
            if (exp.jobTitle && exp.company) {
              headerParts.push(`${exp.jobTitle} - ${exp.company}`)
            } else if (exp.jobTitle) {
              headerParts.push(exp.jobTitle)
            } else if (exp.company) {
              headerParts.push(exp.company)
            }

            // Part 2: Location (if present)
            if (exp.location) {
              headerParts.push(exp.location)
            }

            // Part 3: Date range
            if (exp.startDate || exp.endDate) {
              const dateRange = [exp.startDate, exp.endDate].filter(Boolean).join(' - ')
              if (dateRange) {
                headerParts.push(dateRange)
              }
            }

            // Combine all parts with | separator
            if (headerParts.length > 0) {
              lines.push(headerParts.join(' | '))
            }
          } else {
            // MULTI-LINE FORMAT: Traditional resume style
            // Job title on one line, company on next, location/dates on third
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
          }

          // CRITICAL: Add position summary/description if present
          if (exp.description) {
            // Sanitize description to ensure single line
            const sanitizedDesc = sanitizeText(exp.description)
            lines.push(sanitizedDesc)
            lines.push('') // Empty line after description
          }

          // Add achievements (bullet points) - may be empty array
          if (exp.achievements && Array.isArray(exp.achievements)) {
            exp.achievements.forEach((bullet: any) => {
              if (bullet.text) {
                // CRITICAL: Sanitize bullet text to ensure single line
                const sanitized = sanitizeBulletText(bullet.text)
                lines.push(`• ${sanitized}`)
              }
            })
          }
          lines.push('')
          break

        case 'education_item':
          const edu = block.content as any

          // Export based on format preference
          if (educationFormat === 'single-line') {
            // SINGLE-LINE FORMAT: "Degree - Institution | Location | Date"
            const eduHeaderParts: string[] = []

            // Part 1: Degree - Institution
            if (edu.degree && edu.institution) {
              eduHeaderParts.push(`${edu.degree} - ${edu.institution}`)
            } else if (edu.degree) {
              eduHeaderParts.push(edu.degree)
            } else if (edu.institution) {
              eduHeaderParts.push(edu.institution)
            }

            // Part 2: Location (if present)
            if (edu.location) {
              eduHeaderParts.push(edu.location)
            }

            // Part 3: Graduation date
            if (edu.graduationDate) {
              eduHeaderParts.push(edu.graduationDate)
            }

            // Combine all parts with | separator
            if (eduHeaderParts.length > 0) {
              lines.push(eduHeaderParts.join(' | '))
            }
          } else {
            // MULTI-LINE FORMAT: Traditional resume style
            if (edu.degree) lines.push(edu.degree)
            if (edu.institution) lines.push(edu.institution)
            if (edu.location || edu.graduationDate) {
              const dateLine = [edu.location, edu.graduationDate]
                .filter(Boolean)
                .join(' | ')
              lines.push(dateLine)
            }
          }

          if (edu.gpa) lines.push(`GPA: ${edu.gpa}`)
          if (edu.achievements) {
            edu.achievements.forEach((bullet: any) => {
              // CRITICAL: Sanitize bullet text to ensure single line
              const sanitized = sanitizeBulletText(bullet.text)
              lines.push(`• ${sanitized}`)
            })
          }
          lines.push('')
          break

        case 'bullet_list':
          const bullets = block.content as any
          bullets.items.forEach((bullet: any) => {
            // CRITICAL: Sanitize bullet text to ensure single line
            const sanitized = sanitizeBulletText(bullet.text)
            lines.push(`• ${sanitized}`)
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
