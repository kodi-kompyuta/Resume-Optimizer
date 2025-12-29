import { parsePDF } from './lib/parsers/pdf'
import * as fs from 'fs'

async function testJob5AndCerts() {
  const buffer = fs.readFileSync('D:\\Personal Work Docs\\Docs\\David Kamau Resume.pdf')
  const text = await parsePDF(buffer)

  // Find Job 5 - IT TRAINER
  console.log('SEARCHING FOR JOB 5:')
  console.log('='.repeat(80))

  const lines = text.split('\n')

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === 'IT TRAINER AND CISCO PARTNER RELATIONSHIP ADMINISTRATOR') {
      console.log(`Found at line ${i}:`)
      for (let j = i; j < Math.min(i + 15, lines.length); j++) {
        console.log(`  ${j}: "${lines[j]}"`)
      }
      break
    }
  }

  // Find certifications section
  console.log('\n\nSEARCHING FOR CERTIFICATIONS:')
  console.log('='.repeat(80))

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === 'CERTIFICATIONS') {
      console.log(`Found at line ${i}:`)
      for (let j = i; j < Math.min(i + 25, lines.length); j++) {
        console.log(`  ${j}: "${lines[j]}"`)
      }
      break
    }
  }
}

testJob5AndCerts().catch(console.error)
