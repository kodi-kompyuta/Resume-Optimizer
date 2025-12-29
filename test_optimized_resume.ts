import { parseDOCX } from './lib/parsers/docx'
import { parseResumeStructure } from './lib/parsers/structure-parser'
import * as fs from 'fs'

async function testOptimizedResume() {
  const docxPath = 'C:\\Users\\DavidKamau\\Downloads\\David Kamau Resume (1).docx'

  console.log('Reading optimized resume...\n')

  try {
    const buffer = fs.readFileSync(docxPath)
    const resumeText = await parseDOCX(buffer)

    console.log('='.repeat(80))
    console.log('OPTIMIZED RESUME CONTENT:')
    console.log('='.repeat(80))
    console.log(resumeText)
    console.log('='.repeat(80))
    console.log('')

    // Parse structure to see how it would be re-read
    console.log('Parsing structure of optimized resume...')
    const structured = parseResumeStructure(resumeText)

    const expSection = structured.sections.find(s => s.type === 'experience')
    const expItems = expSection?.content.filter(c => c.type === 'experience_item') || []

    console.log(`\nFound ${expItems.length} experience items in optimized resume:\n`)

    expItems.forEach((item, index) => {
      const exp = item.content
      console.log(`Job ${index + 1}:`)
      console.log(`  Title: "${exp.jobTitle}"`)
      console.log(`  Company: "${exp.company}"`)
      console.log(`  Location: "${exp.location || '(none)'}"`)
      console.log(`  Dates: ${exp.startDate} - ${exp.endDate}`)
      console.log(`  Achievements: ${exp.achievements?.length || 0} bullets`)

      if (exp.achievements && exp.achievements.length > 0) {
        console.log(`  First bullet: "${exp.achievements[0].text.substring(0, 80)}..."`)
      }
      console.log('')
    })

  } catch (error) {
    console.error('Error reading optimized resume:')
    console.error(error)
  }
}

testOptimizedResume().catch(console.error)
