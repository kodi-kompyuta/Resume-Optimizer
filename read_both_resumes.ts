import { parseDOCX } from './lib/parsers/docx'
import * as fs from 'fs'

async function compareBoth() {
  console.log('========== OPTIMIZED RESUME (DOCX) ==========')
  const optimizedBuffer = fs.readFileSync('C:\\Users\\DavidKamau\\Downloads\\David Kamau Resume (8).docx')
  const optimizedText = await parseDOCX(optimizedBuffer)
  console.log(optimizedText)
  console.log('\n\n')

  console.log('========== ORIGINAL RESUME (PDF) ==========')
  // The original was already shown as PDF, so let me just parse the optimized for now
}

compareBoth()
