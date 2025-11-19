import { Document, Paragraph, TextRun, HeadingLevel, AlignmentType, Packer } from 'docx'

export async function generateDocx(resumeText: string, filename: string): Promise<Buffer> {
  try {
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
        // Bullet points
        paragraphs.push(
          new Paragraph({
            text: trimmedLine.replace(/^[•\-*]\s*/, ''),
            bullet: {
              level: 0,
            },
            spacing: {
              after: 80,
            },
          })
        )
      } else {
        // Regular paragraphs
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: trimmedLine,
              }),
            ],
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
