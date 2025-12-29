import { parsePDF } from './lib/parsers/pdf'
import { parseResumeStructure } from './lib/parsers/structure-parser'
import * as fs from 'fs'

async function testSectionDetection() {
  const pdfPath = 'D:\\Personal Work Docs\\Docs\\David Kamau Resume.pdf'

  const buffer = fs.readFileSync(pdfPath)
  const resumeText = await parsePDF(buffer)

  const structured = parseResumeStructure(resumeText)

  console.log('ALL SECTIONS DETECTED:')
  console.log('='.repeat(80))

  structured.sections.forEach((section, i) => {
    const contentCount = section.content?.length || 0
    const contentTypes = section.content?.map(c => c.type).join(', ') || 'none'

    console.log(`\n${i + 1}. ${section.heading} (${section.type})`)
    console.log(`   Order: ${section.order}`)
    console.log(`   Content blocks: ${contentCount}`)
    console.log(`   Types: ${contentTypes}`)

    if (section.type === 'experience') {
      section.content?.forEach((item, idx) => {
        if (item.type === 'experience_item') {
          const exp = item.content
          console.log(`   - Job ${idx + 1}: ${exp.jobTitle} at ${exp.company}`)
        }
      })
    }
  })

  console.log('\n' + '='.repeat(80))
  console.log('EXPECTED: 6 jobs in WORK EXPERIENCE section')
  console.log('Check if there are multiple experience sections or jobs in other sections')
}

testSectionDetection().catch(console.error)
