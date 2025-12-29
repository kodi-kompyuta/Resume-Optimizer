import { parsePDF } from './lib/parsers/pdf'
import * as fs from 'fs'

async function testRawExperience() {
  const pdfPath = 'D:\\Personal Work Docs\\Docs\\David Kamau Resume.pdf'

  console.log('RAW WORK EXPERIENCE TEXT FROM PDF:')
  console.log('='.repeat(80))

  const buffer = fs.readFileSync(pdfPath)
  const resumeText = await parsePDF(buffer)

  // Find work experience section
  const expIndex = resumeText.indexOf('WORK EXPERIENCE')
  if (expIndex >= 0) {
    // Get everything from WORK EXPERIENCE to ACHIEVEMENTS
    const achievementsIndex = resumeText.indexOf('ACHIEVEMENTS', expIndex)
    const endIndex = achievementsIndex > 0 ? achievementsIndex : expIndex + 3000

    const expText = resumeText.substring(expIndex, endIndex)

    console.log(expText)
    console.log('='.repeat(80))

    // Show line by line
    console.log('\nLINE BY LINE (first 60 lines):')
    console.log('='.repeat(80))
    const lines = expText.split('\n')
    lines.slice(0, 60).forEach((line, i) => {
      const bullet = line.trim().startsWith('•') ? '🔵' : '  '
      const caps = line.trim() === line.trim().toUpperCase() && line.trim().length > 5 ? '🔴' : '  '
      console.log(`${i.toString().padStart(3)}: ${bullet}${caps} "${line}"`)
    })
  } else {
    console.log('❌ WORK EXPERIENCE section not found!')
  }
}

testRawExperience().catch(console.error)
