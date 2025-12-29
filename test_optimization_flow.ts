import { parsePDF } from './lib/parsers/pdf'
import { parseResumeStructure } from './lib/parsers/structure-parser'
import * as fs from 'fs'

async function testOptimizationFlow() {
  const pdfPath = 'D:\\Personal Work Docs\\Docs\\David Kamau Resume.pdf'

  console.log('Testing Optimization Flow...\n')

  try {
    // Step 1: Parse PDF (what happens during upload)
    console.log('Step 1: Parsing PDF...')
    const buffer = fs.readFileSync(pdfPath)
    const resumeText = await parsePDF(buffer)
    console.log('✅ PDF parsed\n')

    // Step 2: Parse structure (what gets saved to DB)
    console.log('Step 2: Parsing structure...')
    const structuredData = parseResumeStructure(resumeText)
    console.log('✅ Structure parsed\n')

    // Step 3: Verify experience section data (what optimizer and editor use)
    console.log('Step 3: Verifying experience data for editor...\n')

    const expSection = structuredData.sections.find(s => s.type === 'experience')
    if (!expSection) {
      console.log('❌ No experience section found!')
      return
    }

    const expItems = expSection.content.filter(c => c.type === 'experience_item')
    console.log(`Found ${expItems.length} experience items\n`)

    // Show each job with the data the editor will receive
    expItems.forEach((item, index) => {
      const exp = item.content
      console.log(`Job ${index + 1}:`)
      console.log(`  Title: "${exp.jobTitle}"`)
      console.log(`  Company: "${exp.company}"`)
      console.log(`  Location: "${exp.location || '(none)'}"`)
      console.log(`  Dates: ${exp.startDate} - ${exp.endDate}`)
      console.log(`  Achievements: ${exp.achievements?.length || 0} bullets`)

      // Check for issues
      const issues = []
      if (!exp.jobTitle || exp.jobTitle.length < 3) issues.push('❌ Missing/invalid job title')
      if (!exp.company || exp.company.length < 3) issues.push('❌ Missing/invalid company')
      if (!exp.startDate) issues.push('⚠️  Missing start date')

      if (issues.length > 0) {
        console.log('  Issues:', issues.join(', '))
      } else {
        console.log('  ✅ All required fields present')
      }
      console.log('')
    })

    // Step 4: Verify structure integrity
    console.log('Step 4: Structure integrity check...')
    const hasAllJobs = expItems.every(item => {
      const exp = item.content
      return exp.jobTitle && exp.jobTitle.length >= 3 &&
             exp.company && exp.company.length >= 3
    })

    if (hasAllJobs) {
      console.log('✅ All jobs have valid titles and companies')
      console.log('✅ Optimization editor will populate correctly')
    } else {
      console.log('❌ Some jobs have missing data')
      console.log('❌ Optimization editor may have issues')
    }

    // Step 5: Show what would be passed to optimizer
    console.log('\nStep 5: Data that would be passed to optimizer:')
    console.log('Structure preservation counts:')
    console.log(`  - Experience items: ${expItems.length}`)
    console.log(`  - Education items: ${structuredData.sections.find(s => s.type === 'education')?.content.filter(c => c.type === 'education_item').length || 0}`)
    console.log('\n✅ Optimization flow test completed successfully!')

  } catch (error) {
    console.error('❌ Error during optimization flow test:')
    console.error(error)
  }
}

testOptimizationFlow().catch(console.error)
