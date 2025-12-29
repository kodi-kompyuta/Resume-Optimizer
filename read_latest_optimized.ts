import { parseDOCX } from './lib/parsers/docx'
import * as fs from 'fs'

async function readLatest() {
  console.log('========== LATEST OPTIMIZED RESUME ==========')
  const buffer = fs.readFileSync('C:\\Users\\DavidKamau\\Downloads\\David Kamau Resume (10).docx')
  const text = await parseDOCX(buffer)
  console.log(text)
  console.log('\n\n========== END ==========')
}

readLatest()
