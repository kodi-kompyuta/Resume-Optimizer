import mammoth from 'mammoth'
import { normalizeResumeText } from './text-normalizer'

export async function parseDOCX(buffer: Buffer): Promise<string> {
  try {
    // Use convertToHtml to preserve structure, then extract text
    const result = await mammoth.convertToHtml(
      { buffer },
      {
        styleMap: [
          "p[style-name='Heading 1'] => h1:fresh",
          "p[style-name='Heading 2'] => h2:fresh",
          "p[style-name='Heading 3'] => h3:fresh",
        ],
      }
    )

    // Extract text from HTML while preserving line breaks
    let text = result.value
      .replace(/<h[123]>/g, '\n\n') // Headings get double line break before
      .replace(/<\/h[123]>/g, '\n') // Single break after
      .replace(/<p>/g, '')
      .replace(/<\/p>/g, '\n')
      .replace(/<li>/g, '• ')
      .replace(/<\/li>/g, '\n')
      .replace(/<[^>]+>/g, '') // Remove remaining HTML tags
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&#39;/g, "'")

    // CRITICAL: Apply shared text normalization
    // This ensures DOCX and PDF parsers produce consistent output
    text = normalizeResumeText(text)

    return text
  } catch (error) {
    console.error('DOCX parsing error:', error)
    throw new Error('Failed to parse DOCX file')
  }
}