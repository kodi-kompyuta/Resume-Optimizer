import { parsePDF } from './lib/parsers/pdf'
import * as fs from 'fs'

async function testAllJobs() {
  const pdfPath = 'D:\\Personal Work Docs\\Docs\\David Kamau Resume.pdf'

  console.log('EXTRACTING COMPLETE WORK EXPERIENCE SECTION:')
  console.log('='.repeat(80))

  const buffer = fs.readFileSync(pdfPath)
  const resumeText = await parsePDF(buffer)

  // Find work experience section
  const expIndex = resumeText.indexOf('WORK EXPERIENCE')
  if (expIndex >= 0) {
    // Get everything from WORK EXPERIENCE to the end (or next major section)
    const educationIndex = resumeText.indexOf('EDUCATION', expIndex)
    const endIndex = educationIndex > 0 ? educationIndex : resumeText.length

    const expText = resumeText.substring(expIndex, endIndex)

    console.log(expText)
    console.log('='.repeat(80))

    // Count ALL CAPS job titles (potential jobs)
    console.log('\nPOTENTIAL JOB TITLES (ALL CAPS lines):')
    console.log('='.repeat(80))

    const lines = expText.split('\n')
    let jobCount = 0

    lines.forEach((line, i) => {
      const trimmed = line.trim()
      // All caps, reasonable length, not "WORK EXPERIENCE" or "ACHIEVEMENTS"
      if (trimmed.length > 5 &&
          trimmed === trimmed.toUpperCase() &&
          /[A-Z]/.test(trimmed) &&
          trimmed !== 'WORK EXPERIENCE' &&
          trimmed !== 'ACHIEVEMENTS' &&
          !trimmed.match(/^\d/) &&
          !trimmed.startsWith('•')) {

        jobCount++
        console.log(`\nJob ${jobCount}: "${trimmed}"`)

        // Show next few lines (likely dates and company)
        for (let j = 1; j <= 3 && (i + j) < lines.length; j++) {
          const nextLine = lines[i + j].trim()
          if (nextLine) {
            console.log(`  Line ${j}: ${nextLine}`)
          }
        }
      }
    })

    console.log('\n' + '='.repeat(80))
    console.log(`TOTAL JOB TITLES FOUND: ${jobCount}`)
  } else {
    console.log('❌ WORK EXPERIENCE section not found!')
  }
}

testAllJobs().catch(console.error)
