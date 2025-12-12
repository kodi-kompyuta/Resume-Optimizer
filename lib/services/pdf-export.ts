import { jsPDF } from 'jspdf'
import { StructuredResume } from '@/types'

export async function generatePdf(
  resumeData: string | StructuredResume,
  filename: string
): Promise<Buffer> {
  // If structured data, convert to formatted text first
  const resumeText = typeof resumeData === 'string'
    ? resumeData
    : convertStructuredToFormattedText(resumeData)

  return generatePdfFromText(resumeText, filename)
}

function convertStructuredToFormattedText(structured: StructuredResume): string {
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
                lines.push(`• ${bullet.text}`)
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
              lines.push(`• ${bullet.text}`)
            })
          }
          lines.push('')
          break

        case 'bullet_list':
          const bullets = block.content as any
          bullets.items.forEach((bullet: any) => {
            lines.push(`• ${bullet.text}`)
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

async function generatePdfFromText(resumeText: string, filename: string): Promise<Buffer> {
  try {
    // Create new PDF document (A4 size)
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    })

    // Set margins
    const marginLeft = 20
    const marginRight = 20
    const marginTop = 20
    const pageWidth = 210 // A4 width in mm
    const pageHeight = 297 // A4 height in mm
    const contentWidth = pageWidth - marginLeft - marginRight

    let currentY = marginTop

    // Parse and format the resume text
    const lines = resumeText.split('\n')

    for (const line of lines) {
      const trimmedLine = line.trim()

      // Check if we need a new page
      if (currentY > pageHeight - 30) {
        doc.addPage()
        currentY = marginTop
      }

      if (!trimmedLine) {
        currentY += 3 // Empty line spacing
        continue
      }

      // Detect headings (all caps lines)
      const isHeading =
        trimmedLine === trimmedLine.toUpperCase() &&
        trimmedLine.length > 2 &&
        trimmedLine.length < 50 &&
        /^[A-Z\s]+$/.test(trimmedLine)

      if (isHeading) {
        // Section heading
        doc.setFontSize(14)
        doc.setFont('helvetica', 'bold')
        doc.text(trimmedLine, marginLeft, currentY, {
          maxWidth: contentWidth,
        })
        currentY += 7
      } else if (trimmedLine.startsWith('•') || trimmedLine.startsWith('-') || trimmedLine.startsWith('*')) {
        // Bullet points
        doc.setFontSize(10)
        doc.setFont('helvetica', 'normal')
        const bulletText = trimmedLine.substring(1).trim()
        doc.text(`• ${bulletText}`, marginLeft + 5, currentY, {
          maxWidth: contentWidth - 5,
        })
        const textHeight = doc.getTextDimensions(`• ${bulletText}`, {
          maxWidth: contentWidth - 5,
        }).h
        currentY += textHeight + 2
      } else {
        // Regular text
        doc.setFontSize(10)
        doc.setFont('helvetica', 'normal')
        doc.text(trimmedLine, marginLeft, currentY, {
          maxWidth: contentWidth,
        })
        const textHeight = doc.getTextDimensions(trimmedLine, {
          maxWidth: contentWidth,
        }).h
        currentY += textHeight + 2
      }
    }

    // Convert to Buffer
    const pdfOutput = doc.output('arraybuffer')
    return Buffer.from(pdfOutput)
  } catch (error) {
    throw new Error(`Failed to generate PDF: ${error}`)
  }
}
