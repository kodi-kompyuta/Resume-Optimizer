import { parseDOCX } from './lib/parsers/docx'
import { ResumeStructureParser } from './lib/parsers/structure-parser'
import * as fs from 'fs'

async function main() {
  const buffer = fs.readFileSync('C:\\Users\\DavidKamau\\Downloads\\David Kaniaru Kamau 4525.docx')
  const text = await parseDOCX(buffer)

  console.log('=== PARSED TEXT ===')
  console.log(text)
  console.log('\n\n=== STRUCTURED DATA ===')

  const parser = new ResumeStructureParser(text)
  const structured = parser.parse()

  console.log(JSON.stringify(structured, null, 2))
}

main().catch(console.error)
