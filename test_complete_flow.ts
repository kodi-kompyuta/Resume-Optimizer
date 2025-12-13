/**
 * Complete end-to-end test of resume optimization flow
 * Tests: DOCX → Text → Structured → Optimized → Output
 */

import fs from 'fs'
import path from 'path'
import { parseDOCX } from './lib/parsers/docx'
import { ResumeStructureParser } from './lib/parsers/structure-parser'

async function testCompleteFlow() {
  console.log('='.repeat(80))
  console.log('RESUME OPTIMIZATION FLOW TEST')
  console.log('='.repeat(80))

  // Step 1: Parse DOCX to text
  console.log('\n[STEP 1] Parsing DOCX file...')
  const docxPath = 'C:\\Users\\DavidKamau\\Downloads\\David Kaniaru Kamau 2412.docx'
  const buffer = fs.readFileSync(docxPath)
  const plainText = await parseDOCX(buffer)

  console.log(`✓ Extracted ${plainText.length} characters`)

  // Save plain text
  fs.writeFileSync('test_output_1_plaintext.txt', plainText)
  console.log('✓ Saved to: test_output_1_plaintext.txt')

  // Show first 2000 chars
  console.log('\n--- PLAIN TEXT (First 2000 chars) ---')
  console.log(plainText.substring(0, 2000))
  console.log('...\n')

  // Step 2: Parse text to structured format
  console.log('\n[STEP 2] Converting to structured format...')
  const parser = new ResumeStructureParser(plainText)
  const structured = parser.parse()

  console.log(`✓ Found ${structured.sections.length} sections`)
  console.log(`✓ Total word count: ${structured.metadata.wordCount}`)

  // Save structured data
  fs.writeFileSync('test_output_2_structured.json', JSON.stringify(structured, null, 2))
  console.log('✓ Saved to: test_output_2_structured.json')

  // Analyze structure
  console.log('\n--- STRUCTURED SECTIONS ---')
  structured.sections.forEach((section, idx) => {
    console.log(`\n${idx + 1}. ${section.heading} (${section.type})`)
    console.log(`   - ${section.content.length} content blocks`)

    section.content.forEach((block, blockIdx) => {
      console.log(`   - Block ${blockIdx + 1}: ${block.type}`)

      if (block.type === 'experience_item') {
        const exp = block.content as any
        console.log(`      • Job Title: "${exp.jobTitle || 'MISSING'}"`)
        console.log(`      • Company: "${exp.company || 'MISSING'}"`)
        console.log(`      • Dates: ${exp.startDate} - ${exp.endDate}`)
        console.log(`      • Description: ${exp.description ? exp.description.substring(0, 50) + '...' : 'MISSING'}`)
        console.log(`      • Achievements: ${exp.achievements?.length || 0} bullets`)
      }

      if (block.type === 'education_item') {
        const edu = block.content as any
        console.log(`      • Degree: "${edu.degree || 'MISSING'}"`)
        console.log(`      • Institution: "${edu.institution || 'MISSING'}"`)
        console.log(`      • Graduation: ${edu.graduationDate || 'MISSING'}`)
      }
    })
  })

  // Step 3: Check for missing critical data
  console.log('\n\n[STEP 3] Validation Check...')
  console.log('-'.repeat(80))

  const experienceSections = structured.sections.filter(s =>
    s.type === 'experience' || s.heading.toUpperCase().includes('EXPERIENCE')
  )

  console.log(`\n✓ Experience sections found: ${experienceSections.length}`)

  let totalExperienceItems = 0
  let itemsWithAllFields = 0
  let itemsWithDescription = 0
  let itemsWithBullets = 0

  experienceSections.forEach(section => {
    section.content.forEach(block => {
      if (block.type === 'experience_item') {
        totalExperienceItems++
        const exp = block.content as any

        const hasAllFields = exp.jobTitle && exp.company && exp.startDate && exp.endDate
        const hasDescription = exp.description && exp.description.length > 0
        const hasBullets = exp.achievements && exp.achievements.length > 0

        if (hasAllFields) itemsWithAllFields++
        if (hasDescription) itemsWithDescription++
        if (hasBullets) itemsWithBullets++
      }
    })
  })

  console.log(`\n📊 STATISTICS:`)
  console.log(`   Total experience items: ${totalExperienceItems}`)
  console.log(`   Items with all fields (title/company/dates): ${itemsWithAllFields}`)
  console.log(`   Items with descriptions: ${itemsWithDescription}`)
  console.log(`   Items with bullet points: ${itemsWithBullets}`)

  // Check education
  const educationSections = structured.sections.filter(s =>
    s.type === 'education' || s.heading.toUpperCase().includes('EDUCATION')
  )

  console.log(`\n✓ Education sections found: ${educationSections.length}`)

  let totalEducationItems = 0
  educationSections.forEach(section => {
    totalEducationItems += section.content.filter(b => b.type === 'education_item').length
  })
  console.log(`   Total education items: ${totalEducationItems}`)

  // Step 4: Check contact info
  const contactSections = structured.sections.filter(s =>
    s.type === 'contact' || s.heading.toUpperCase().includes('CONTACT')
  )

  console.log(`\n✓ Contact sections found: ${contactSections.length}`)
  if (contactSections.length > 0) {
    const contactBlock = contactSections[0].content[0]
    if (contactBlock && contactBlock.type === 'contact_info') {
      const contact = contactBlock.content as any
      console.log(`   Name: ${contact.name || 'MISSING'}`)
      console.log(`   Email: ${contact.email || 'MISSING'}`)
      console.log(`   Phone: ${contact.phone || 'MISSING'}`)
    }
  }

  // Step 5: Critical issues check
  console.log('\n\n[STEP 4] Critical Issues Check...')
  console.log('-'.repeat(80))

  const issues: string[] = []

  if (experienceSections.length === 0) {
    issues.push('❌ NO EXPERIENCE SECTION FOUND')
  }

  if (totalExperienceItems < 3) {
    issues.push(`⚠️  Only ${totalExperienceItems} experience items found (expected 5+)`)
  }

  if (itemsWithAllFields < totalExperienceItems) {
    issues.push(`❌ ${totalExperienceItems - itemsWithAllFields} experience items missing critical fields`)
  }

  if (educationSections.length === 0) {
    issues.push('❌ NO EDUCATION SECTION FOUND')
  }

  if (contactSections.length === 0) {
    issues.push('⚠️  NO CONTACT SECTION FOUND')
  }

  if (issues.length === 0) {
    console.log('✅ ALL CHECKS PASSED - Structure looks good!')
  } else {
    console.log('❌ ISSUES FOUND:')
    issues.forEach(issue => console.log(`   ${issue}`))
  }

  // Step 6: Test section detection with original text
  console.log('\n\n[STEP 5] Analyzing Original Text Structure...')
  console.log('-'.repeat(80))

  // Count actual occurrences in original text
  const headersToCheck = [
    'CONTACT INFORMATION',
    'PERSONAL PROFILE',
    'KEY SKILLS',
    'WORK EXPERIENCE',
    'ACHIEVEMENTS',
    'EDUCATION',
    'PROFESSIONAL CERTIFICATIONS',
    'ADDITIONAL INFORMATION',
    'REFEREES'
  ]

  console.log('\nSection headers in original text:')
  headersToCheck.forEach(header => {
    const found = plainText.toUpperCase().includes(header)
    const count = (plainText.toUpperCase().match(new RegExp(header, 'g')) || []).length
    console.log(`   ${found ? '✓' : '✗'} ${header} (found ${count} times)`)
  })

  console.log('\n' + '='.repeat(80))
  console.log('TEST COMPLETE')
  console.log('='.repeat(80))
  console.log('\nGenerated files:')
  console.log('  - test_output_1_plaintext.txt')
  console.log('  - test_output_2_structured.json')
  console.log('\nReview these files to understand how your resume is being parsed.')
}

// Run test
testCompleteFlow().catch(error => {
  console.error('\n❌ TEST FAILED:', error)
  console.error(error.stack)
  process.exit(1)
})
