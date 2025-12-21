import { PDFParse } from 'pdf-parse'
import { pathToFileURL } from 'url'
import path from 'path'
import { normalizeResumeText } from './text-normalizer'

// Dynamically set the worker source for pdfjs-dist
let workerInitialized = false

async function initializeWorker() {
  if (!workerInitialized && typeof window === 'undefined') {
    try {
      // Import pdfjs-dist and set worker options for Node.js environment
      const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs')

      // Point to the worker file in node_modules - convert to file:// URL for Windows compatibility
      const workerPath = path.join(
        process.cwd(),
        'node_modules',
        'pdfjs-dist',
        'legacy',
        'build',
        'pdf.worker.min.mjs'
      )

      // Convert Windows path to file:// URL
      pdfjs.GlobalWorkerOptions.workerSrc = pathToFileURL(workerPath).href

      workerInitialized = true
    } catch (error) {
      console.warn('Failed to initialize PDF.js worker:', error)
    }
  }
}

export async function parsePDF(buffer: Buffer): Promise<string> {
  try {
    // Initialize worker configuration
    await initializeWorker()

    const parser = new PDFParse({
      data: buffer,
      verbosity: 0,
      useWorkerFetch: false,
      useSystemFonts: false
    })

    const result = await parser.getText()
    await parser.destroy()

    // CRITICAL: Apply text normalization (same as DOCX parser)
    // This fixes section headers, date formats, multi-column layouts, etc.
    const normalizedText = normalizeResumeText(result.text)

    return normalizedText
  } catch (error) {
    console.error('PDF parsing error:', error)
    throw new Error('Failed to parse PDF file')
  }
}