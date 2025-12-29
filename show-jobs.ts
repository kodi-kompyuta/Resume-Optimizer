import { parseDOCX } from './lib/parsers/docx'
import { ResumeStructureParser } from './lib/parsers/structure-parser'
import * as fs from 'fs'

async function main() {
  const buffer = fs.readFileSync('C:\\Users\\DavidKamau\\Downloads\\David Kaniaru Kamau 4525.docx')
  const text = await parseDOCX(buffer)
  const parser = new ResumeStructureParser(text)
  const structured = parser.parse()

  const expSection = structured.sections.find(s => s.type === 'experience')
  if (expSection) {
    console.log('\n=== ALL 6 JOBS EXTRACTED ===\n')
    expSection.content.forEach((block: any, i: number) => {
      if (block.type === 'experience_item') {
        const exp = block.content
        console.log(`Job ${i + 1}:`)
        console.log(`  Title: ${exp.jobTitle}`)
        console.log(`  Company: ${exp.company}`)
        console.log(`  Dates: ${exp.startDate} - ${exp.endDate}`)
        console.log(`  Location: ${exp.location || 'N/A'}`)
        console.log(`  Achievements: ${exp.achievements?.length || 0} bullets\n`)
      }
    })
  }
}

main().catch(console.error)
