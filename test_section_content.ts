import { parsePDF } from './lib/parsers/pdf'
import { ResumeStructureParser } from './lib/parsers/structure-parser'
import * as fs from 'fs'

async function testSectionContent() {
  const pdfPath = 'D:\\Personal Work Docs\\Docs\\David Kamau Resume.pdf'

  const buffer = fs.readFileSync(pdfPath)
  const resumeText = await parsePDF(buffer)

  // Parse without consolidation to see raw sections
  const parser = new ResumeStructureParser(resumeText)

  // Parse sections but log details BEFORE consolidation
  console.log('INSPECTING JOB SECTION CONTENT BEFORE CONSOLIDATION:')
  console.log('='.repeat(80))

  // Manually parse to see intermediate state
  const structured = parser.parse()

  // Find all custom sections that might be jobs
  structured.sections.forEach((section, idx) => {
    const heading = section.heading.trim()

    const isJobLike =
      heading === heading.toUpperCase() &&
      heading.length > 15 &&
      heading.length < 100 &&
      section.type === 'custom' &&
      (heading.includes('MANAGER') || heading.includes('ENGINEER') ||
       heading.includes('SPECIALIST') || heading.includes('LEADER') ||
       heading.includes('TRAINER'))

    if (isJobLike || section.type === 'experience') {
      console.log(`\nSection ${idx + 1}: "${section.heading}" (${section.type})`)
      console.log(`  Content blocks: ${section.content.length}`)

      section.content.forEach((block, bidx) => {
        console.log(`\n  Block ${bidx + 1} (${block.type}):`)

        if (block.type === 'text') {
          const text = block.content as string
          console.log(`    Text (${text.length} chars): "${text.substring(0, 200)}${text.length > 200 ? '...' : ''}"`)
        } else if (block.type === 'bullet_list') {
          const bullets = block.content as any
          console.log(`    Bullets: ${bullets.items?.length || 0}`)
          bullets.items?.slice(0, 2).forEach((b: any, i: number) => {
            console.log(`      ${i + 1}. "${b.text.substring(0, 100)}..."`)
          })
        } else if (block.type === 'experience_item') {
          const exp = block.content as any
          console.log(`    Job: "${exp.jobTitle}"`)
          console.log(`      Company: "${exp.company}"`)
          console.log(`      Location: "${exp.location}"`)
          console.log(`      Dates: ${exp.startDate} - ${exp.endDate}`)
          console.log(`      Achievements: ${exp.achievements?.length || 0}`)
        }
      })
    }
  })
}

testSectionContent().catch(console.error)
