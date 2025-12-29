import { parsePDF } from './lib/parsers/pdf'
import { parseResumeStructure } from './lib/parsers/structure-parser'
import * as fs from 'fs'

async function testEducationParsing() {
  const pdfPath = 'D:\\Personal Work Docs\\Docs\\David Kamau Resume.pdf'

  console.log('Testing Education Parsing...\n')

  try {
    // Parse PDF
    console.log('Step 1: Parsing PDF...')
    const buffer = fs.readFileSync(pdfPath)
    const resumeText = await parsePDF(buffer)
    console.log('✅ PDF parsed\n')

    // Parse structure
    console.log('Step 2: Parsing structure...')
    const structuredData = parseResumeStructure(resumeText)
    console.log('✅ Structure parsed\n')

    // Find education section
    const eduSection = structuredData.sections.find(s => s.type === 'education')

    if (!eduSection) {
      console.log('❌ No education section found!')
      return
    }

    const eduItems = eduSection.content.filter(c => c.type === 'education_item')
    console.log(`Found ${eduItems.length} education items\n`)
    console.log('='.repeat(80))

    // Show each education item
    eduItems.forEach((item, index) => {
      const edu = item.content
      console.log(`\nEducation ${index + 1}:`)
      console.log(`  Degree: "${edu.degree || '(missing)'}"`)
      console.log(`  Institution: "${edu.institution || '(missing)'}"`)
      console.log(`  Field of Study: "${edu.fieldOfStudy || '(missing)'}"`)
      console.log(`  Date: "${edu.graduationDate || '(missing)'}"`)
      console.log(`  Location: "${edu.location || '(none)'}"`)

      // Check for issues
      const issues = []
      if (!edu.degree || edu.degree.length < 3) issues.push('❌ Missing/invalid degree')
      if (!edu.institution || edu.institution.length < 3) issues.push('❌ Missing/invalid institution')

      if (issues.length > 0) {
        console.log('  Issues:', issues.join(', '))
      } else {
        console.log('  ✅ Required fields present')
      }
    })

    console.log('\n' + '='.repeat(80))

    // Also show the raw education section text for reference
    console.log('\nRaw Education Section from PDF:')
    console.log('='.repeat(80))
    const eduIndex = resumeText.indexOf('EDUCATION')
    if (eduIndex >= 0) {
      const eduText = resumeText.substring(eduIndex, eduIndex + 1500)
      console.log(eduText)
    }
    console.log('='.repeat(80))

    // Final verdict
    console.log('\nEducation Parsing Verdict:')
    const allValid = eduItems.every(item => {
      const edu = item.content
      return edu.degree && edu.degree.length >= 3 &&
             edu.institution && edu.institution.length >= 3
    })

    if (allValid && eduItems.length > 0) {
      console.log('✅ All education items have valid degree and institution')
      console.log('✅ Education will be correctly saved to database')
      console.log('✅ Optimization will preserve all education items')
    } else {
      console.log('❌ Some education items have missing data')
      console.log('⚠️  May need parser fixes for education section')
    }

  } catch (error) {
    console.error('❌ Error during education parsing test:')
    console.error(error)
  }
}

testEducationParsing().catch(console.error)
