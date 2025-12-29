import { parsePDF } from './lib/parsers/pdf'
import { parseResumeStructure } from './lib/parsers/structure-parser'
import * as fs from 'fs'

async function testCertificationsParsing() {
  const pdfPath = 'D:\\Personal Work Docs\\Docs\\David Kamau Resume.pdf'

  console.log('Testing Certifications Parsing...\n')

  try {
    // Parse PDF
    console.log('Step 1: Parsing PDF...')
    const buffer = fs.readFileSync(pdfPath)
    const resumeText = await parsePDF(buffer)
    console.log('✅ PDF parsed\n')

    // Show raw certifications section
    console.log('Raw Certifications Section from PDF:')
    console.log('='.repeat(80))
    const certIndex = resumeText.indexOf('CERTIFICATIONS')
    if (certIndex >= 0) {
      const certText = resumeText.substring(certIndex, certIndex + 1500)
      console.log(certText)
    } else {
      console.log('❌ No CERTIFICATIONS section found in text')
      // Try to find what sections exist
      console.log('\nSearching for certification-related text...')
      const keywords = ['certification', 'certified', 'certificate', 'ITIL', 'AWS', 'CCNA', 'CCNP']
      keywords.forEach(keyword => {
        if (resumeText.toLowerCase().includes(keyword.toLowerCase())) {
          const idx = resumeText.toLowerCase().indexOf(keyword.toLowerCase())
          console.log(`\nFound "${keyword}" at position ${idx}:`)
          console.log(resumeText.substring(Math.max(0, idx - 100), idx + 200))
        }
      })
    }
    console.log('='.repeat(80))
    console.log('')

    // Parse structure
    console.log('Step 2: Parsing structure...')
    const structuredData = parseResumeStructure(resumeText)
    console.log('✅ Structure parsed\n')

    // Find certifications section
    const certSection = structuredData.sections.find(s =>
      s.type === 'certifications' || s.heading?.toLowerCase().includes('certification')
    )

    if (!certSection) {
      console.log('❌ No certifications section found in parsed structure!')
      console.log('\nAll sections found:')
      structuredData.sections.forEach((section, i) => {
        console.log(`${i + 1}. ${section.heading} (type: ${section.type}) - ${section.content?.length || 0} items`)
      })
      return
    }

    console.log(`Found certifications section: "${certSection.heading}"`)
    console.log(`Content items: ${certSection.content.length}\n`)

    if (certSection.content.length === 0) {
      console.log('⚠️  Certifications section is EMPTY - no items parsed!\n')
    } else {
      console.log('='.repeat(80))
      certSection.content.forEach((item, index) => {
        console.log(`\nCertification ${index + 1}:`)
        console.log(`  Type: ${item.type}`)
        console.log(`  Content:`, JSON.stringify(item.content, null, 2).substring(0, 300))
      })
      console.log('\n' + '='.repeat(80))
    }

    // Final verdict
    console.log('\nCertifications Parsing Verdict:')
    if (certSection.content.length > 0) {
      console.log(`✅ Found ${certSection.content.length} certification items`)
      console.log('✅ Certifications will be saved to database')
    } else {
      console.log('❌ No certification items parsed from the section')
      console.log('❌ Certifications section will be empty in optimization')
      console.log('⚠️  Parser needs fixes for certifications section')
    }

  } catch (error) {
    console.error('❌ Error during certifications parsing test:')
    console.error(error)
  }
}

testCertificationsParsing().catch(console.error)
