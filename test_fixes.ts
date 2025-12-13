/**
 * Test the fixes for resume optimization issues
 */

import * as fs from 'fs'
import { parseDOCX } from './lib/parsers/docx'
import { ResumeStructureParser } from './lib/parsers/structure-parser'
import { generateDocx } from './lib/services/docx-export'

const ORIGINAL_PATH = String.raw`C:\Users\DavidKamau\Downloads\David Kaniaru Kamau_BURN_HOD_IT.docx`

async function testFixes() {
  console.log('Testing Resume Optimization Fixes')
  console.log('='.repeat(80))

  try {
    // Step 1: Parse original resume
    console.log('\n[Step 1] Parsing original resume...')
    const buffer = fs.readFileSync(ORIGINAL_PATH)
    const plainText = await parseDOCX(buffer)
    const structured = new ResumeStructureParser(plainText).parse()

    console.log(`✓ Parsed successfully`)
    console.log(`  Sections: ${structured.sections.length}`)

    // Check experience section
    const expSection = structured.sections.find(s => s.type === 'experience')
    if (expSection) {
      const jobCount = expSection.content.filter(b => b.type === 'experience_item').length
      console.log(`  Experience items: ${jobCount}`)

      console.log('\n  Jobs:')
      expSection.content.forEach((block, idx) => {
        if (block.type === 'experience_item') {
          const exp = block.content as any
          console.log(`    ${idx + 1}. ${exp.jobTitle} at ${exp.company || 'N/A'}`)
          console.log(`       Dates: ${exp.startDate || 'N/A'} - ${exp.endDate || 'N/A'}`)
          console.log(`       Achievements: ${exp.achievements?.length || 0}`)

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

    // Step 2: Export to DOCX
    console.log('\n[Step 2] Exporting to DOCX...')
    const exportedBuffer = await generateDocx(structured, 'test-export.docx')
    console.log(`✓ Exported successfully (${exportedBuffer.length} bytes)`)

    // Save for inspection
    fs.writeFileSync('test-export.docx', exportedBuffer)
    console.log('  Saved to: test-export.docx')

    // Step 3: Re-parse exported DOCX
    console.log('\n[Step 3] Re-parsing exported DOCX...')
    const reparsedText = await parseDOCX(exportedBuffer)
    const reparsedStructured = new ResumeStructureParser(reparsedText).parse()

    console.log(`✓ Re-parsed successfully`)
    console.log(`  Sections: ${reparsedStructured.sections.length}`)

    // Check experience section again
    const reparsedExpSection = reparsedStructured.sections.find(s => s.type === 'experience')
    if (reparsedExpSection) {
      const reparsedJobCount = reparsedExpSection.content.filter(b => b.type === 'experience_item').length
      console.log(`  Experience items: ${reparsedJobCount}`)

      console.log('\n  Re-parsed jobs:')
      reparsedExpSection.content.forEach((block, idx) => {
        if (block.type === 'experience_item') {
          const exp = block.content as any
          console.log(`    ${idx + 1}. ${exp.jobTitle} at ${exp.company || 'N/A'}`)
        }
      })
    }

    // Step 4: Validate
    console.log('\n[Step 4] Validation Results')
    console.log('='.repeat(80))

    const origJobCount = expSection
      ? expSection.content.filter(b => b.type === 'experience_item').length
      : 0

    const newJobCount = reparsedExpSection
      ? reparsedExpSection.content.filter(b => b.type === 'experience_item').length
      : 0

    console.log(`Original jobs: ${origJobCount}`)
    console.log(`Re-parsed jobs: ${newJobCount}`)

    if (origJobCount === newJobCount) {
      console.log('✅ SUCCESS: Job count matches!')
    } else {
      console.log(`❌ FAILED: Job count mismatch (${origJobCount} → ${newJobCount})`)
    }

    if (structured.sections.length === reparsedStructured.sections.length) {
      console.log('✅ SUCCESS: Section count matches!')
    } else {
      console.log(`⚠️  Section count changed (${structured.sections.length} → ${reparsedStructured.sections.length})`)
    }

    console.log('\n' + '='.repeat(80))
    console.log('TEST COMPLETE')
    console.log('='.repeat(80))

  } catch (error) {
    console.error('\n❌ ERROR:', error)
    process.exit(1)
  }
}

testFixes()
