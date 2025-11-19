import PDFDocument from 'pdfkit'
import { Readable } from 'stream'

export async function generatePdf(resumeText: string, filename: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: {
          top: 50,
          bottom: 50,
          left: 50,
          right: 50,
        },
      })

      const chunks: Buffer[] = []

      doc.on('data', (chunk) => chunks.push(chunk))
      doc.on('end', () => resolve(Buffer.concat(chunks)))
      doc.on('error', reject)

      // Parse and format the resume text
      const lines = resumeText.split('\n')

      for (const line of lines) {
        const trimmedLine = line.trim()

        if (!trimmedLine) {
          doc.moveDown(0.5)
          continue
        }

        // Detect headings (all caps lines)
        const isHeading =
          trimmedLine === trimmedLine.toUpperCase() &&
          trimmedLine.length > 2 &&
          trimmedLine.length < 50 &&
          /^[A-Z\s]+$/.test(trimmedLine)

        if (isHeading) {
          doc
            .fontSize(14)
            .font('Helvetica-Bold')
            .text(trimmedLine, {
              continued: false,
            })
          doc.moveDown(0.3)
        } else if (trimmedLine.startsWith('•') || trimmedLine.startsWith('-') || trimmedLine.startsWith('*')) {
          // Bullet points
          doc
            .fontSize(11)
            .font('Helvetica')
            .text(trimmedLine, {
              indent: 20,
              continued: false,
            })
          doc.moveDown(0.2)
        } else {
          // Regular text
          doc
            .fontSize(11)
            .font('Helvetica')
            .text(trimmedLine, {
              align: 'left',
              continued: false,
            })
          doc.moveDown(0.3)
        }

        // Check if we need a new page
        if (doc.y > 700) {
          doc.addPage()
        }
      }

      doc.end()
    } catch (error) {
      reject(error)
    }
  })
}
