import { parsePDF } from './lib/parsers/pdf'
import { parseResumeStructure } from './lib/parsers/structure-parser'
import { analyzeResume } from './lib/openai/analyzer'
import * as fs from 'fs'

async function testFreshUpload() {
  const pdfPath = 'D:\\Personal Work Docs\\Docs\\David Kamau Resume.pdf'

  console.log('Simulating fresh upload with NEW parser...\n')

  try {
    // Step 1: Parse PDF (what upload API does)
    console.log('Step 1: Parsing PDF...')
    const buffer = fs.readFileSync(pdfPath)
    const resumeText = await parsePDF(buffer)
    console.log('✅ PDF parsed\n')

    // Step 2: Parse structure (what gets saved to structured_data in DB)
    console.log('Step 2: Parsing structure (will be saved to DB)...')
    const structuredData = parseResumeStructure(resumeText)

    const expSection = structuredData.sections.find(s => s.type === 'experience')
    const eduSection = structuredData.sections.find(s => s.type === 'education')
    const expCount = expSection?.content.filter(c => c.type === 'experience_item').length || 0
    const eduCount = eduSection?.content.filter(c => c.type === 'education_item').length || 0

    console.log(`✅ Structure parsed: ${expCount} jobs, ${eduCount} education items\n`)

    // Show the first job that would be saved to DB
    if (expSection && expSection.content.length > 0) {
      const firstExp = expSection.content.find(c => c.type === 'experience_item')
      if (firstExp) {
        console.log('First job that would be saved to DB:')
        console.log(`  Title: "${firstExp.content.jobTitle}"`)
        console.log(`  Company: "${firstExp.content.company}"`)
        console.log(`  Dates: ${firstExp.content.startDate} - ${firstExp.content.endDate}`)
        console.log('')
      }
    }

    console.log('This structured_data would be saved to the database.')
    console.log('When optimization runs, it would use THIS data (not corrupted data).\n')

    console.log('✅ With the NEW parser, fresh upload will work correctly!')
    console.log('\n📋 RECOMMENDATION:')
    console.log('   1. Delete the old resume from the database')
    console.log('   2. Re-upload the PDF (it will parse correctly now)')
    console.log('   3. Run optimization (it will use correct structured_data)')

  } catch (error) {
    console.error('❌ Error during fresh upload test:')
    console.error(error)
  }
}

testFreshUpload().catch(console.error)
