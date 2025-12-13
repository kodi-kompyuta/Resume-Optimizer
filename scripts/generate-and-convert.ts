/**
 * Complete workflow: JSON → DOCX → PDF
 *
 * This script combines:
 * 1. generate-resume.ts (JSON to DOCX)
 * 2. convert-to-pdf.ts (DOCX to PDF)
 *
 * Equivalent to running both Python scripts:
 *   python generate_resume.py
 *   python -m docx2pdf optimized_resume_output.docx
 *
 * Usage:
 *   npx tsx scripts/generate-and-convert.ts [data.json] [output-name]
 */
import { renderResume } from './generate-resume'
import { convert } from './convert-to-pdf'
import * as path from 'path'
import * as fs from 'fs'

async function generateAndConvert(
  dataFile: string = 'optimized_resume.json',
  outputName: string = 'optimized_resume_output'
): Promise<void> {
  try {
    console.log('🚀 Complete Resume Generation Pipeline')
    console.log('======================================')
    console.log('')

    // Step 1: Generate DOCX from JSON
    console.log('📝 STEP 1: Generate DOCX from JSON')
    console.log('-----------------------------------')

    const templatePath = path.join(__dirname, '../lib/templates/resume_template.docx')
    const docxPath = `${outputName}.docx`

    await renderResume(dataFile, templatePath, docxPath)

    console.log('')

    // Step 2: Convert DOCX to PDF
    console.log('📄 STEP 2: Convert DOCX to PDF')
    console.log('-------------------------------')

    const pdfPath = `${outputName}.pdf`
    await convert(docxPath, pdfPath)

    console.log('')
    console.log('✨ Pipeline Complete!')
    console.log('====================')
    console.log(`📦 DOCX: ${docxPath}`)
    console.log(`📦 PDF:  ${pdfPath}`)
    console.log('')
    console.log('Both files are ready to use! 🎉')
  } catch (error: any) {
    console.error('')
    console.error('❌ Pipeline failed:', error.message)
    throw error
  }
}

// Main execution
if (require.main === module) {
  const args = process.argv.slice(2)
  const dataFile = args[0] || 'scripts/example-resume-data.json'
  const outputName = args[1] || 'optimized_resume_output'

  console.log(`Data file: ${dataFile}`)
  console.log(`Output name: ${outputName}`)
  console.log('')

  generateAndConvert(dataFile, outputName)
    .then(() => {
      process.exit(0)
    })
    .catch((error) => {
      process.exit(1)
    })
}

export { generateAndConvert }
