import { parsePDF } from './lib/parsers/pdf'
import { parseResumeStructure } from './lib/parsers/structure-parser'
import * as fs from 'fs'

async function testPDFParsing() {
  // Try to find a PDF resume in the project
  const possiblePaths = [
    'D:\\Personal Work Docs\\David Kaniaru Kamau 4525_rev.pdf',
    'D:\\Personal Work Docs\\David Kaniaru Kamau 1224.pdf',
    'D:\\Personal Work Docs\\David Kaniaru Kamau 5925.pdf',
  ]

  let pdfPath = ''
  for (const path of possiblePaths) {
    if (fs.existsSync(path)) {
      pdfPath = path
      break
    }
  }

  if (!pdfPath) {
    console.log('No PDF file found. Please provide path to a PDF resume.')
    console.log('Tested paths:')
    possiblePaths.forEach(p => console.log(`  - ${p}`))
    return
  }

  console.log(`[Test] Reading PDF from: ${pdfPath}`)
  const buffer = fs.readFileSync(pdfPath)

  console.log('[Test] Parsing PDF...')
  const resumeText = await parsePDF(buffer)

  console.log('\n[Test] EXTRACTED TEXT:')
  console.log('='.repeat(80))
  console.log(resumeText)
  console.log('='.repeat(80))

  console.log('\n[Test] TEXT LENGTH:', resumeText.length, 'characters')
  console.log('[Test] LINE COUNT:', resumeText.split('\n').length, 'lines')

  console.log('\n[Test] Parsing structure...')
  const structured = parseResumeStructure(resumeText)

  console.log('\n[Test] PARSED SECTIONS:')
  console.log(`Total sections: ${structured.sections.length}`)

  structured.sections.forEach(section => {
    console.log(`\n${section.heading} (${section.type}):`)
    console.log(`  Content blocks: ${section.content.length}`)

    if (section.type === 'experience') {
      const jobs = section.content.filter(b => b.type === 'experience_item')
      console.log(`  Found ${jobs.length} job(s):`)
      jobs.forEach((job, i) => {
        const exp = job.content as any
        console.log(`    ${i + 1}. ${exp.jobTitle || '(no title)'} at ${exp.company || '(no company)'}`)
        console.log(`       Dates: ${exp.startDate} - ${exp.endDate}`)
      })
    } else if (section.type === 'education') {
      const eduItems = section.content.filter(b => b.type === 'education_item')
      console.log(`  Found ${eduItems.length} education item(s):`)
      eduItems.forEach((edu, i) => {
        const eduData = edu.content as any
        console.log(`    ${i + 1}. ${eduData.degree || '(no degree)'} at ${eduData.institution || '(no institution)'}`)
        console.log(`       Date: ${eduData.graduationDate || 'N/A'}`)
      })
    }
  })
}

testPDFParsing().catch(console.error)
