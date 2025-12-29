import { parseDOCX } from './lib/parsers/docx'
import * as fs from 'fs'

async function test() {
  const buffer = fs.readFileSync('./test-david-resume.docx')
  const text = await parseDOCX(buffer)
  console.log('=== EXTRACTED TEXT ===')
  console.log(text)
  console.log('\n=== LENGTH ===')
  console.log(text.length, 'characters')
}

test().catch(console.error)
