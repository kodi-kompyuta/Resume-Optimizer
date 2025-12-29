import { parseDOCX } from './lib/parsers/docx'
import * as fs from 'fs'

async function readResume() {
  const buffer = fs.readFileSync('C:\\Users\\DavidKamau\\Downloads\\David Kamau Resume (3).docx')
  const text = await parseDOCX(buffer)
  console.log(text)
}

readResume()
