/**
 * Test script to analyze resume parsing and optimization
 * This will help identify where duplication and formatting issues occur
 */

import * as fs from 'fs'
import * as path from 'path'
import { parseDOCX } from './lib/parsers/docx'
import { ResumeStructureParser } from './lib/parsers/structure-parser'
import { StructuredResume, ExperienceItem, ContentBlock } from './types'

const ORIGINAL_PATH = String.raw`C:\Users\DavidKamau\Downloads\David Kaniaru Kamau_BURN_HOD_IT.docx`
const OPTIMIZED_PATH = String.raw`C:\Users\DavidKamau\Downloads\David Kaniaru Kamau_BURN_HOD_IT (1).docx`

async function analyzeResume(filePath: string, label: string) {
  console.log('\n' + '='.repeat(80))
  console.log(`ANALYZING: ${label}`)
  console.log('='.repeat(80))

  try {
    // Step 1: Parse DOCX to plain text
    console.log('\n[Step 1] Parsing DOCX to plain text...')
    const buffer = fs.readFileSync(filePath)

    const plainText = await parseDOCX(buffer)

    // Save plain text for inspection
    const plainTextPath = `${label.toLowerCase().replace(/\s+/g, '_')}_plaintext.txt`
    fs.writeFileSync(plainTextPath, plainText)
    console.log(`✓ Plain text saved to: ${plainTextPath}`)
    console.log(`  Length: ${plainText.length} characters`)
    console.log(`  Lines: ${plainText.split('\n').length}`)

    // Step 2: Parse structure
    console.log('\n[Step 2] Parsing structure...')
    const parser = new ResumeStructureParser(plainText)
    const structured = parser.parse()

    // Save structured data for inspection
    const structuredPath = `${label.toLowerCase().replace(/\s+/g, '_')}_structured.json`
    fs.writeFileSync(structuredPath, JSON.stringify(structured, null, 2))
    console.log(`✓ Structured data saved to: ${structuredPath}`)
    console.log(`  Sections: ${structured.sections.length}`)
    console.log(`  Word count: ${structured.metadata.wordCount}`)

    // Step 3: Analyze sections
    console.log('\n[Step 3] Analyzing sections...')
    structured.sections.forEach((section, idx) => {
      console.log(`\n  Section ${idx + 1}: ${section.heading} (${section.type})`)
      console.log(`  Content blocks: ${section.content.length}`)

      // Count content block types
      const blockTypes = section.content.reduce((acc, block) => {
        acc[block.type] = (acc[block.type] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      console.log(`  Block types:`, blockTypes)

      // If experience section, show details
      if (section.type === 'experience') {
        console.log(`\n  *** EXPERIENCE ITEMS DETAIL ***`)
        section.content.forEach((block, blockIdx) => {
          if (block.type === 'experience_item') {
            const exp = block.content as ExperienceItem
            console.log(`\n    [${blockIdx + 1}] Job: ${exp.jobTitle}`)
            console.log(`        Company: ${exp.company}`)
            console.log(`        Dates: ${exp.startDate} - ${exp.endDate}`)
            console.log(`        Location: ${exp.location || 'N/A'}`)
            console.log(`        Description: ${exp.description ? exp.description.substring(0, 100) + '...' : 'N/A'}`)
            console.log(`        Achievements: ${exp.achievements?.length || 0} bullets`)

            if (exp.achievements && exp.achievements.length > 0) {
              exp.achievements.slice(0, 3).forEach((ach, achIdx) => {
                console.log(`          • ${ach.text.substring(0, 80)}...`)
              })
              if (exp.achievements.length > 3) {
                console.log(`          ... and ${exp.achievements.length - 3} more`)
              }
            }
          }
        })
      }
    })

    // Step 4: Check for duplicates
    console.log('\n[Step 4] Checking for duplicate job roles...')
    const experienceSection = structured.sections.find(s => s.type === 'experience')
    if (experienceSection) {
      const jobTitles = new Map<string, number>()
      const companies = new Map<string, number>()

      experienceSection.content.forEach(block => {
        if (block.type === 'experience_item') {
          const exp = block.content as ExperienceItem

          // Track job titles
          const titleKey = exp.jobTitle.toLowerCase().trim()
          jobTitles.set(titleKey, (jobTitles.get(titleKey) || 0) + 1)

          // Track companies
          const companyKey = exp.company.toLowerCase().trim()
          companies.set(companyKey, (companies.get(companyKey) || 0) + 1)
        }
      })

      // Report duplicates
      const duplicateTitles = Array.from(jobTitles.entries()).filter(([_, count]) => count > 1)
      const duplicateCompanies = Array.from(companies.entries()).filter(([_, count]) => count > 1)

      if (duplicateTitles.length > 0) {
        console.log(`\n  ⚠️  DUPLICATE JOB TITLES FOUND:`)
        duplicateTitles.forEach(([title, count]) => {
          console.log(`    - "${title}" appears ${count} times`)
        })
      } else {
        console.log(`  ✓ No duplicate job titles`)
      }

      if (duplicateCompanies.length > 0) {
        console.log(`\n  ⚠️  DUPLICATE COMPANIES FOUND:`)
        duplicateCompanies.forEach(([company, count]) => {
          console.log(`    - "${company}" appears ${count} times`)
        })
      } else {
        console.log(`  ✓ No duplicate companies`)
      }
    }

    return structured

  } catch (error) {
    console.error(`\n❌ ERROR analyzing ${label}:`, error)
    throw error
  }
}

async function compareResumes(original: StructuredResume, optimized: StructuredResume) {
  console.log('\n' + '='.repeat(80))
  console.log('COMPARISON: Original vs Optimized')
  console.log('='.repeat(80))

  // Compare section counts
  console.log('\n[Sections]')
  console.log(`  Original: ${original.sections.length} sections`)
  console.log(`  Optimized: ${optimized.sections.length} sections`)
  console.log(`  Difference: ${optimized.sections.length - original.sections.length}`)

  // Compare word counts
  console.log('\n[Word Counts]')
  console.log(`  Original: ${original.metadata.wordCount} words`)
  console.log(`  Optimized: ${optimized.metadata.wordCount} words`)
  console.log(`  Difference: ${optimized.metadata.wordCount - original.metadata.wordCount}`)

  // Compare experience items
  const origExp = original.sections.find(s => s.type === 'experience')
  const optExp = optimized.sections.find(s => s.type === 'experience')

  if (origExp && optExp) {
    const origCount = origExp.content.filter(b => b.type === 'experience_item').length
    const optCount = optExp.content.filter(b => b.type === 'experience_item').length

    console.log('\n[Experience Items]')
    console.log(`  Original: ${origCount} jobs`)
    console.log(`  Optimized: ${optCount} jobs`)
    console.log(`  Difference: ${optCount - origCount}`)

    if (optCount !== origCount) {
      console.log(`\n  ⚠️  WARNING: Job count changed! This may indicate duplication or loss.`)
    }

    // Show which jobs are in each
    console.log('\n  Original jobs:')
    origExp.content.forEach((block, idx) => {
      if (block.type === 'experience_item') {
        const exp = block.content as ExperienceItem
        console.log(`    ${idx + 1}. ${exp.jobTitle} at ${exp.company}`)
      }
    })

    console.log('\n  Optimized jobs:')
    optExp.content.forEach((block, idx) => {
      if (block.type === 'experience_item') {
        const exp = block.content as ExperienceItem
        console.log(`    ${idx + 1}. ${exp.jobTitle} at ${exp.company}`)
      }
    })
  }

  // Compare formatting
  console.log('\n[Formatting Analysis]')
  console.log('  Checking for formatting differences...')

  original.sections.forEach((origSection, idx) => {
    const optSection = optimized.sections[idx]
    if (optSection) {
      if (origSection.heading !== optSection.heading) {
        console.log(`  ⚠️  Section ${idx + 1} heading changed:`)
        console.log(`      Original: "${origSection.heading}"`)
        console.log(`      Optimized: "${optSection.heading}"`)
      }
    }
  })
}

async function main() {
  console.log('Resume Analysis Tool')
  console.log('This will help identify parsing and optimization issues\n')

  try {
    // Analyze original resume
    const original = await analyzeResume(ORIGINAL_PATH, 'Original Resume')

    // Analyze optimized resume
    const optimized = await analyzeResume(OPTIMIZED_PATH, 'Optimized Resume')

    // Compare them
    await compareResumes(original, optimized)

    console.log('\n' + '='.repeat(80))
    console.log('ANALYSIS COMPLETE')
    console.log('='.repeat(80))
    console.log('\nGenerated files:')
    console.log('  - original_resume_plaintext.txt')
    console.log('  - original_resume_structured.json')
    console.log('  - optimized_resume_plaintext.txt')
    console.log('  - optimized_resume_structured.json')
    console.log('\nReview these files to see exactly what the parser extracted.')

  } catch (error) {
    console.error('\n❌ FATAL ERROR:', error)
    process.exit(1)
  }
}

main()
