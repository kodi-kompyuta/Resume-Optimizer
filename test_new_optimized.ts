/**
 * Test script to analyze the newly optimized resume
 */

import * as fs from 'fs'
import { parseDOCX } from './lib/parsers/docx'
import { ResumeStructureParser } from './lib/parsers/structure-parser'

const NEW_OPTIMIZED_PATH = String.raw`C:\Users\DavidKamau\Downloads\David Kaniaru Kamau_BURN_HOD_IT (2).docx`
const OLD_OPTIMIZED_PATH = String.raw`C:\Users\DavidKamau\Downloads\David Kaniaru Kamau_BURN_HOD_IT (1).docx`

async function analyzeNewOptimized() {
  console.log('Analyzing New Optimized Resume')
  console.log('='.repeat(80))

  try {
    // Parse new optimized resume
    console.log('\n[Step 1] Parsing NEW optimized resume...')
    const newBuffer = fs.readFileSync(NEW_OPTIMIZED_PATH)
    const newPlainText = await parseDOCX(newBuffer)
    const newStructured = new ResumeStructureParser(newPlainText).parse()

    console.log(`✓ Parsed successfully`)
    console.log(`  Sections: ${newStructured.sections.length}`)
    console.log(`  Word count: ${newStructured.metadata.wordCount}`)

    // Check experience section
    const newExpSection = newStructured.sections.find(s => s.type === 'experience')
    if (newExpSection) {
      const newJobCount = newExpSection.content.filter(b => b.type === 'experience_item').length
      console.log(`  Experience items: ${newJobCount}`)

      console.log('\n  Jobs in NEW optimized version:')
      newExpSection.content.forEach((block, idx) => {
        if (block.type === 'experience_item') {
          const exp = block.content as any
          console.log(`    ${idx + 1}. ${exp.jobTitle}`)
          console.log(`       Company: ${exp.company || 'N/A'}`)
          console.log(`       Dates: ${exp.startDate || 'N/A'} - ${exp.endDate || 'N/A'}`)
          console.log(`       Achievements: ${exp.achievements?.length || 0} bullets`)

          // Check for newlines in bullets
          if (exp.achievements) {
            const withNewlines = exp.achievements.filter((a: any) =>
              a.text.includes('\n') || a.text.includes('\r')
            )
            if (withNewlines.length > 0) {
              console.log(`       ⚠️  ${withNewlines.length} bullets contain newlines!`)
            }
          }
        }
      })
    }

    // Compare with old optimized version
    console.log('\n[Step 2] Comparing with OLD optimized resume...')
    const oldBuffer = fs.readFileSync(OLD_OPTIMIZED_PATH)
    const oldPlainText = await parseDOCX(oldBuffer)
    const oldStructured = new ResumeStructureParser(oldPlainText).parse()

    const oldExpSection = oldStructured.sections.find(s => s.type === 'experience')
    const oldJobCount = oldExpSection
      ? oldExpSection.content.filter(b => b.type === 'experience_item').length
      : 0

    const newJobCount = newExpSection
      ? newExpSection.content.filter(b => b.type === 'experience_item').length
      : 0

    console.log(`\n  OLD optimized: ${oldJobCount} jobs (with duplicates/fake jobs)`)
    console.log(`  NEW optimized: ${newJobCount} jobs`)

    if (oldExpSection) {
      console.log('\n  Jobs in OLD optimized version:')
      oldExpSection.content.slice(0, 11).forEach((block, idx) => {
        if (block.type === 'experience_item') {
          const exp = block.content as any
          const jobTitle = exp.jobTitle.substring(0, 60)
          console.log(`    ${idx + 1}. ${jobTitle}${exp.jobTitle.length > 60 ? '...' : ''}`)
        }
      })
    }

    // Validation
    console.log('\n[Step 3] Validation Results')
    console.log('='.repeat(80))

    if (newJobCount >= 5 && newJobCount <= 7) {
      console.log(`✅ SUCCESS: Job count is reasonable (${newJobCount})`)
    } else {
      console.log(`⚠️  WARNING: Job count is ${newJobCount} (expected 5-7)`)
    }

    if (newJobCount < oldJobCount) {
      console.log(`✅ IMPROVEMENT: Reduced from ${oldJobCount} to ${newJobCount} jobs`)
    } else if (newJobCount === oldJobCount) {
      console.log(`⚠️  Same job count as before (${newJobCount})`)
    } else {
      console.log(`❌ ISSUE: Job count increased from ${oldJobCount} to ${newJobCount}`)
    }

    // Check for fake job titles
    let fakeJobs = 0
    if (newExpSection) {
      newExpSection.content.forEach(block => {
        if (block.type === 'experience_item') {
          const exp = block.content as any
          // Fake jobs usually have weird patterns like ending with punctuation
          if (
            exp.jobTitle.endsWith('.') ||
            exp.jobTitle.endsWith(',') ||
            exp.jobTitle.includes('SLAs.') ||
            exp.jobTitle.includes('time by') ||
            exp.jobTitle.includes('improving') ||
            exp.jobTitle.includes('Zambia)')
          ) {
            console.log(`❌ FAKE JOB DETECTED: "${exp.jobTitle}"`)
            fakeJobs++
          }
        }
      })
    }

    if (fakeJobs === 0) {
      console.log('✅ SUCCESS: No fake jobs detected')
    } else {
      console.log(`❌ ISSUE: ${fakeJobs} fake jobs still present`)
    }

    // Check sections
    if (newStructured.sections.length >= 8 && newStructured.sections.length <= 10) {
      console.log(`✅ SUCCESS: Section count is reasonable (${newStructured.sections.length})`)
    } else {
      console.log(`⚠️  Section count: ${newStructured.sections.length}`)
    }

    console.log('\n' + '='.repeat(80))
    console.log('ANALYSIS COMPLETE')
    console.log('='.repeat(80))

    // Save for inspection
    fs.writeFileSync('new_optimized_plaintext.txt', newPlainText)
    fs.writeFileSync('new_optimized_structured.json', JSON.stringify(newStructured, null, 2))
    console.log('\nGenerated files:')
    console.log('  - new_optimized_plaintext.txt')
    console.log('  - new_optimized_structured.json')

  } catch (error) {
    console.error('\n❌ ERROR:', error)
    process.exit(1)
  }
}

analyzeNewOptimized()
