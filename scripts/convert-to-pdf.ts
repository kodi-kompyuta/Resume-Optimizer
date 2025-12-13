/**
 * TypeScript equivalent of Python's docx2pdf
 *
 * Option A: LibreOffice (cross-platform, recommended)
 * Option B: Direct PDF generation using existing pdf-export
 *
 * Usage:
 *   npx tsx scripts/convert-to-pdf.ts input.docx [output.pdf]
 *   npx tsx scripts/convert-to-pdf.ts optimized_resume_output.docx
 */
import { exec } from 'child_process'
import { promisify } from 'util'
import * as fs from 'fs'
import * as path from 'path'

const execAsync = promisify(exec)

interface ConversionOptions {
  method?: 'libreoffice' | 'auto'
  outputPath?: string
}

/**
 * Convert DOCX to PDF using LibreOffice (cross-platform)
 * Equivalent to: libreoffice --headless --convert-to pdf file.docx
 */
async function convertWithLibreOffice(
  inputPath: string,
  outputPath?: string
): Promise<string> {
  try {
    console.log('🔄 Converting with LibreOffice (headless)...')

    const inputDir = path.dirname(path.resolve(inputPath))
    const inputFile = path.basename(inputPath)
    const outputFile = outputPath || inputFile.replace(/\.docx$/i, '.pdf')

    // LibreOffice command (works on Windows, macOS, Linux)
    const command = `libreoffice --headless --convert-to pdf "${inputPath}" --outdir "${inputDir}"`

    console.log(`   Command: ${command}`)

    const { stdout, stderr } = await execAsync(command)

    if (stderr && !stderr.includes('Warning')) {
      console.warn('   Warning:', stderr)
    }

    // LibreOffice outputs to same directory with .pdf extension
    const defaultOutput = path.join(inputDir, path.basename(inputPath, '.docx') + '.pdf')

    // Move to desired output path if different
    if (outputPath && defaultOutput !== path.resolve(outputPath)) {
      fs.renameSync(defaultOutput, outputPath)
      return outputPath
    }

    return defaultOutput
  } catch (error: any) {
    if (error.message.includes('command not found') || error.message.includes('not recognized')) {
      throw new Error(
        'LibreOffice not found. Please install LibreOffice:\n' +
        '  Windows: https://www.libreoffice.org/download/download/\n' +
        '  macOS: brew install --cask libreoffice\n' +
        '  Linux: sudo apt-get install libreoffice'
      )
    }
    throw error
  }
}

/**
 * Main conversion function (equivalent to Python's convert())
 */
async function convert(
  inputPath: string,
  outputPath?: string,
  options: ConversionOptions = {}
): Promise<string> {
  // Validate input file exists
  if (!fs.existsSync(inputPath)) {
    throw new Error(`Input file not found: ${inputPath}`)
  }

  // Validate input is a .docx file
  if (!inputPath.toLowerCase().endsWith('.docx')) {
    throw new Error('Input file must be a .docx file')
  }

  console.log('📄 Converting DOCX to PDF')
  console.log(`   Input:  ${inputPath}`)

  const method = options.method || 'libreoffice'

  let resultPath: string

  if (method === 'libreoffice' || method === 'auto') {
    resultPath = await convertWithLibreOffice(inputPath, outputPath)
  } else {
    throw new Error(`Unknown conversion method: ${method}`)
  }

  console.log(`✅ PDF saved to ${resultPath}`)
  return resultPath
}

/**
 * Check if LibreOffice is installed
 */
async function checkLibreOffice(): Promise<boolean> {
  try {
    await execAsync('libreoffice --version')
    return true
  } catch {
    return false
  }
}

// Main execution (equivalent to Python's if __name__ == "__main__")
if (require.main === module) {
  const args = process.argv.slice(2)

  if (args.length === 0) {
    console.error('Usage: npx tsx scripts/convert-to-pdf.ts <input.docx> [output.pdf]')
    console.error('')
    console.error('Examples:')
    console.error('  npx tsx scripts/convert-to-pdf.ts resume.docx')
    console.error('  npx tsx scripts/convert-to-pdf.ts resume.docx output.pdf')
    process.exit(1)
  }

  const inputPath = args[0]
  const outputPath = args[1]

  console.log('🚀 DOCX to PDF Converter')
  console.log('========================')
  console.log('')

  // Check if LibreOffice is installed
  checkLibreOffice().then(async (hasLibreOffice) => {
    if (!hasLibreOffice) {
      console.error('❌ LibreOffice not found!')
      console.error('')
      console.error('Please install LibreOffice:')
      console.error('  Windows: https://www.libreoffice.org/download/download/')
      console.error('  macOS:   brew install --cask libreoffice')
      console.error('  Linux:   sudo apt-get install libreoffice')
      console.error('')
      process.exit(1)
    }

    convert(inputPath, outputPath)
      .then((result) => {
        console.log('')
        console.log('✨ Done!')
        process.exit(0)
      })
      .catch((error) => {
        console.error('')
        console.error('❌ Conversion failed:', error.message)
        process.exit(1)
      })
  })
}

export { convert, convertWithLibreOffice, checkLibreOffice }
