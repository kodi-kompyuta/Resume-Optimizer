const testText = `WORK EXPERIENCE
Regional Head of Client Services & Projects - Echotel International July
2025
Head of Client Services & Projects - Echotel International Jan 2024 –
June 2025`

console.log('ORIGINAL:')
console.log(testText)
console.log('\n' + '='.repeat(80) + '\n')

// Simulate the steps
import * as fs from 'fs'
import * as path from 'path'

// Read the normalizer file and eval its functions manually for testing
const normalizerPath = path.join(__dirname, 'lib', 'parsers', 'text-normalizer.ts')
const normalizerContent = fs.readFileSync(normalizerPath, 'utf-8')

// Step 1: Merge broken date ranges
let step1 = testText.split('\n')
let result: string[] = []
let i = 0

while (i < step1.length) {
  let line = step1[i].trim()
  const nextLine = i + 1 < step1.length ? step1[i + 1].trim() : ''

  // Case 1: Line ends with month, next line is year
  if (line && /(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s*$/i.test(line) &&
      nextLine && /^\d{4}\s*$/.test(nextLine)) {
    console.log(`CASE 1 MATCH: "${line}" + "${nextLine}"`)
    result.push(line + ' ' + nextLine)
    i += 2
    continue
  }

  // Case 2: Line ends with "Month Year –", next line starts with "Month Year"
  if (line && /(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{4}\s*[-–—]\s*$/i.test(line) &&
      nextLine && /^(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{4}|Present|Current|Now)\b/i.test(nextLine)) {
    console.log(`CASE 2 MATCH: "${line}" + "${nextLine}"`)
    const dateMatch = nextLine.match(/^((?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{4}|Present|Current|Now))\s*(.*)/i)
    if (dateMatch) {
      result.push(line + dateMatch[1])
      if (dateMatch[2]) {
        result.push(dateMatch[2])
      }
    } else {
      result.push(line + nextLine)
    }
    i += 2
    continue
  }

  result.push(line)
  i++
}

const afterMerge = result.join('\n')
console.log('AFTER MERGE:')
console.log(afterMerge)
console.log('\n' + '='.repeat(80) + '\n')

// Step 2: Split inline dates
const lines2 = afterMerge.split('\n')
const result2: string[] = []

for (const line of lines2) {
  const match = line.match(/^(.+?[-–—].+?)\s+((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{4}(?:\s*[-–—]\s*(?:Present|Current|Now|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{4})?)?)$/i)

  if (match) {
    console.log(`SPLIT MATCH: "${line}"`)
    console.log(`  Title/Company: "${match[1]}"`)
    console.log(`  Dates: "${match[2]}"`)
    result2.push(match[1].trim())
    result2.push(match[2].trim())
  } else {
    result2.push(line)
  }
}

const afterSplit = result2.join('\n')
console.log('AFTER SPLIT:')
console.log(afterSplit)
