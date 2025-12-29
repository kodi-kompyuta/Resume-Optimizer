import { parsePDF } from './lib/parsers/pdf'
import * as fs from 'fs'

async function testNormalization() {
  const pdfPath = 'D:\\Personal Work Docs\\Docs\\David Kamau Resume.pdf'
  const buffer = fs.readFileSync(pdfPath)
  const normalizedText = await parsePDF(buffer)

  // Find the WORK EXPERIENCE section
  const workExpIndex = normalizedText.indexOf('WORK EXPERIENCE')
  if (workExpIndex >= 0) {
    const section = normalizedText.substring(workExpIndex, workExpIndex + 1000)
    console.log('WORK EXPERIENCE SECTION (normalized):')
    console.log('='.repeat(80))
    console.log(section)
    console.log('='.repeat(80))

    // Show line by line
    console.log('\nLINE BY LINE:')
    section.split('\n').slice(0, 15).forEach((line, i) => {
      console.log(`${i}: "${line}"`)
    })
  }
}

testNormalization().catch(console.error)
