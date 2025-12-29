import { parsePDF } from './lib/parsers/pdf'
import { parseResumeStructure } from './lib/parsers/structure-parser'
import * as fs from 'fs'

async function testCertifications() {
  const buffer = fs.readFileSync('D:\\Personal Work Docs\\Docs\\David Kamau Resume.pdf')
  const resumeText = await parsePDF(buffer)
  const structured = parseResumeStructure(resumeText)

  const certSection = structured.sections.find(s => s.type === 'certifications')

  console.log('CERTIFICATIONS SECTION CHECK:')
  console.log('='.repeat(80))

  if (!certSection) {
    console.log('❌ No certifications section found!')
    return
  }

  console.log(`✅ Certifications section found: "${certSection.heading}"`)
  console.log(`   Content blocks: ${certSection.content.length}`)

  const certItems = certSection.content.filter(b => b.type === 'certification_item')
  console.log(`   Certification items: ${certItems.length}`)

  console.log('\nCERTIFICATIONS EXTRACTED:')
  console.log('='.repeat(80))

  certItems.forEach((cert, idx) => {
    const c = cert.content as any
    console.log(`${idx + 1}. "${c.name}"`)
  })

  if (certItems.length === 0) {
    console.log('\n❌ NO CERTIFICATIONS EXTRACTED!')
    console.log('\nContent blocks in section:')
    certSection.content.forEach((block, idx) => {
      console.log(`  Block ${idx + 1} (${block.type}):`)
      if (block.type === 'text') {
        console.log(`    "${block.content}"`)
      } else if (block.type === 'bullet_list') {
        const bullets = block.content as any
        console.log(`    ${bullets.items?.length || 0} bullets`)
        bullets.items?.forEach((b: any) => {
          console.log(`      - "${b.text}"`)
        })
      }
    })
  } else {
    console.log(`\n✅ Successfully extracted ${certItems.length} certifications`)
  }
}

testCertifications().catch(console.error)
