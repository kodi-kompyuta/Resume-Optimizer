import { parsePDF } from './lib/parsers/pdf'
import * as fs from 'fs'

async function testCustomSectionRaw() {
  const pdfPath = 'D:\\Personal Work Docs\\Docs\\David Kamau Resume.pdf'

  const buffer = fs.readFileSync(pdfPath)
  const resumeText = await parsePDF(buffer)

  // Parse with a custom parser to see sections BEFORE consolidation
  console.log('PARSING WITH DETAILED LOGGING:')
  console.log('='.repeat(80))

  // Create a parser with debug mode
  const { ResumeStructureParser } = await import('./lib/parsers/structure-parser')

  // Monkey-patch to intercept section creation
  const originalParse = ResumeStructureParser.prototype.parse

  ResumeStructureParser.prototype.parse = function() {
    // Call original
    const result = originalParse.call(this)

    // Log each section's content BEFORE consolidation runs
    console.log('\n📋 SECTIONS BEFORE CONSOLIDATION:')
    result.sections.forEach((section: any, idx: number) => {
      if (section.heading.includes('MANAGER') || section.heading.includes('SPECIALIST')) {
        console.log(`\n  Section ${idx + 1}: "${section.heading}" (${section.type})`)
        console.log(`    Content blocks: ${section.content.length}`)

        section.content.forEach((block: any, bidx: number) => {
          console.log(`      Block ${bidx + 1} (${block.type}):`)
          if (block.type === 'text') {
            console.log(`        "${(block.content as string).substring(0, 150)}..."`)
          } else if (block.type === 'bullet_list') {
            const bullets = block.content as any
            console.log(`        ${bullets.items?.length || 0} bullets`)
          }
        })
      }
    })

    return result
  }

  const parser = new ResumeStructureParser(resumeText)
  parser.parse()
}

testCustomSectionRaw().catch(console.error)
