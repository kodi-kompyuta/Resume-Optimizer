import { parseDOCX } from './lib/parsers/docx'
import { ResumeStructureParser } from './lib/parsers/structure-parser'
import * as fs from 'fs'

async function main() {
  const buffer = fs.readFileSync('C:\\Users\\DavidKamau\\Downloads\\David Kaniaru Kamau 4525.docx')
  const text = await parseDOCX(buffer)
  const parser = new ResumeStructureParser(text)
  const structured = parser.parse()

  const certSection = structured.sections.find(s => s.type === 'certifications')

  console.log('\n=== CERTIFICATIONS SECTION ===\n')
  if (certSection) {
    console.log('Section Found:', certSection.heading)
    console.log('Content blocks:', certSection.content.length)
    console.log('\nContent:')
    console.log(JSON.stringify(certSection, null, 2))
  } else {
    console.log('❌ No certifications section found!')
    console.log('\nAll sections found:')
    structured.sections.forEach(s => {
      console.log(`  - ${s.type}: ${s.heading}`)
    })
  }

  // Also check for "AND TRAINING" section
  const trainingSection = structured.sections.find(s => s.heading === 'AND TRAINING')
  if (trainingSection) {
    console.log('\n=== FOUND "AND TRAINING" SECTION ===')
    console.log('Type:', trainingSection.type)
    console.log('Content:')
    console.log(JSON.stringify(trainingSection, null, 2))
  }
}

main().catch(console.error)
