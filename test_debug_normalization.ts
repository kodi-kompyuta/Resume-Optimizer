import { normalizeResumeText } from './lib/parsers/text-normalizer'

const testText = `WORK EXPERIENCE
Regional Head of Client Services & Projects - Echotel International July
2025
Responsible for the running and management of the Client Service and Projects Departments.
Head of Client Services & Projects - Echotel International Jan 2024 –
June 2025
Responsible for the running and management of the Client Service and Projects Departments.
IT Support Supervisor - Church World Service (CWS Africa) Jan 2023 – Dec 2024
Responsible for the coordination and oversight.`

console.log('ORIGINAL TEXT:')
console.log('='.repeat(80))
console.log(testText)
console.log('='.repeat(80))

console.log('\n\nRUNNING NORMALIZATION WITH DEBUG...\n')

const normalized = normalizeResumeText(testText, true, true)

console.log('\n\nFINAL RESULT:')
console.log('='.repeat(80))
console.log(normalized)
console.log('='.repeat(80))

console.log('\n\nLINE BY LINE:')
normalized.split('\n').forEach((line, i) => {
  console.log(`${i + 1}: "${line}"`)
})
