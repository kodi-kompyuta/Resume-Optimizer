import { parsePDF } from './lib/parsers/pdf'
import { parseResumeStructure } from './lib/parsers/structure-parser'
import * as fs from 'fs'

async function testFullPDF() {
  const pdfPath = 'D:\\Personal Work Docs\\David Kaniaru Kamau 4525_rev.pdf'

  if (!fs.existsSync(pdfPath)) {
    console.log('PDF not found at:', pdfPath)
    return
  }

  console.log('Testing PDF parsing with actual resume...\n')

  const buffer = fs.readFileSync(pdfPath)
  const normalizedText = await parsePDF(buffer)

  console.log('NORMALIZED TEXT (first 2000 chars):')
  console.log('='.repeat(80))
  console.log(normalizedText.substring(0, 2000))
  console.log('='.repeat(80))

  // Parse into structured format
  const structured = parseResumeStructure(normalizedText)

  // Find work experience and education sections
  const workExpSection = structured.sections.find(s =>
    s.type === 'experience' ||
    s.heading?.toLowerCase().includes('experience') ||
    s.heading?.toLowerCase().includes('work')
  )

  const educationSection = structured.sections.find(s =>
    s.type === 'education' ||
    s.heading?.toLowerCase().includes('education')
  )

  // Debug: Show raw content blocks
  console.log('\nDEBUG - Work Experience Section Content:')
  console.log('Total content blocks:', workExpSection?.content?.length || 0)
  if (workExpSection?.content && workExpSection.content.length > 0) {
    console.log('First content block:', JSON.stringify(workExpSection.content[0], null, 2).substring(0, 300))
  }

  // Extract experience items from content blocks
  const experienceItems = (workExpSection?.content || [])
    .filter((block: any) => block.type === 'experience_item')
    .map((block: any) => block.content)  // Fixed: use block.content instead of block.data

  // Extract education items from content blocks
  const educationItems = (educationSection?.content || [])
    .filter((block: any) => block.type === 'education_item')
    .map((block: any) => block.content)  // Fixed: use block.content instead of block.data

  console.log('\n\nPARSING RESULTS:')
  console.log('='.repeat(80))
  console.log(`Sections found: ${structured.sections.length}`)
  console.log(`Experience entries: ${experienceItems.length}`)
  console.log(`Education entries: ${educationItems.length}`)
  console.log('='.repeat(80))

  console.log('\n\nEXPERIENCE ENTRIES:')
  console.log('='.repeat(80))
  experienceItems.forEach((exp: any, i: number) => {
    // First, show what properties this item has
    if (i === 0) {
      console.log(`\nAvailable properties:`, Object.keys(exp))
    }

    console.log(`\n[${i + 1}] ${exp.jobTitle || exp.title || exp.role || JSON.stringify(exp).substring(0, 50)}`)
    console.log(`    Keys:`, Object.keys(exp))
    console.log(`    Company: ${exp.company || exp.organization || '(no company)'}`)
    console.log(`    Dates: ${exp.startDate || exp.dates || exp.dateRange || '?'} ${exp.endDate ? '- ' + exp.endDate : ''}`)
    console.log(`    Location: ${exp.location || '(no location)'}`)
    const bulletCount = exp.achievements?.length || exp.bullets?.length || exp.description?.length || 0
    console.log(`    Achievements/Description: ${bulletCount} items`)
    const bullets = exp.achievements || exp.bullets || exp.description || []
    if (bullets.length > 0 && typeof bullets[0] === 'string') {
      bullets.slice(0, 2).forEach((ach: string, j: number) => {
        console.log(`      ${j + 1}. ${ach.substring(0, 80)}${ach.length > 80 ? '...' : ''}`)
      })
    }
  })

  console.log('\n\nEDUCATION ENTRIES:')
  console.log('='.repeat(80))
  educationItems.forEach((edu: any, i: number) => {
    console.log(`\n[${i + 1}] ${edu.degree || edu.title || '(no degree)'}`)
    console.log(`    Institution: ${edu.institution || '(no institution)'}`)
    console.log(`    Date: ${edu.graduationDate || edu.dates || '(no date)'}`)
  })

  console.log('\n\nALL SECTIONS:')
  console.log('='.repeat(80))
  structured.sections.forEach((section, i) => {
    const contentCount = section.content?.length || 0
    console.log(`${i + 1}. ${section.heading} (type: ${section.type}, ${contentCount} content blocks)`)

    // Show content block types for debugging
    if (section.content && section.content.length > 0) {
      const blockTypes = section.content.map((b: any) => b.type).join(', ')
      console.log(`    Content blocks: ${blockTypes}`)

      // Show sample data keys if it's an experience or education block
      const sampleBlock = section.content[0] as any
      if (sampleBlock.type === 'experience_item' || sampleBlock.type === 'education_item') {
        console.log(`    Sample data keys:`, Object.keys(sampleBlock.data || {}))
      }
    }
  })

  // Check if we got the expected results
  console.log('\n\nVALIDATION:')
  console.log('='.repeat(80))
  console.log(`✅ Expected 6 jobs, got ${experienceItems.length}: ${experienceItems.length === 6 ? 'PASS' : 'FAIL'}`)
  console.log(`✅ Expected 2 education, got ${educationItems.length}: ${educationItems.length === 2 ? 'PASS' : 'FAIL'}`)
  console.log(`✅ All jobs have dates: ${experienceItems.every((e: any) => e.startDate || e.endDate || e.dates) ? 'PASS' : 'FAIL'}`)
}

testFullPDF().catch(console.error)
