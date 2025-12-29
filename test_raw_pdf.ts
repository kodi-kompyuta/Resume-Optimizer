import { PDFParse } from 'pdf-parse'
import * as fs from 'fs'
import { pathToFileURL } from 'url'
import path from 'path'

async function testRawPDF() {
  const pdfPath = 'D:\\Personal Work Docs\\David Kaniaru Kamau 4525_rev.pdf'

  if (!fs.existsSync(pdfPath)) {
    console.log('PDF not found!')
    return
  }

  const buffer = fs.readFileSync(pdfPath)

  // Initialize worker
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs')
  const workerPath = path.join(
    process.cwd(),
    'node_modules',
    'pdfjs-dist',
    'legacy',
    'build',
    'pdf.worker.min.mjs'
  )
  pdfjs.GlobalWorkerOptions.workerSrc = pathToFileURL(workerPath).href

  const parser = new PDFParse({
    data: buffer,
    verbosity: 0,
    useWorkerFetch: false,
    useSystemFonts: false
  })

  const result = await parser.getText()
  await parser.destroy()

  console.log('RAW PDF TEXT (first 3000 chars):')
  console.log('='.repeat(80))
  console.log(result.text.substring(0, 3000))
  console.log('='.repeat(80))

  // Show the WORK EXPERIENCE section specifically
  const workExpIndex = result.text.indexOf('WORK EXPERIENCE')
  if (workExpIndex >= 0) {
    console.log('\nWORK EXPERIENCE SECTION (raw):')
    console.log('='.repeat(80))
    console.log(result.text.substring(workExpIndex, workExpIndex + 2000))
    console.log('='.repeat(80))
  }
}

testRawPDF().catch(console.error)
