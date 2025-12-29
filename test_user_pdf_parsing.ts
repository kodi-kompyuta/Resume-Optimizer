import { parsePDF } from './lib/parsers/pdf'
import { parseResumeStructure } from './lib/parsers/structure-parser'
import * as fs from 'fs'

async function testUserResume() {
  const pdfPath = 'D:\\Personal Work Docs\\Docs\\David Kamau Resume.pdf'

  console.log('Testing user resume parsing...\n')

  if (!fs.existsSync(pdfPath)) {
    console.log('❌ PDF not found at:', pdfPath)
    return
  }

  console.log('✅ PDF file found')
  console.log('File size:', fs.statSync(pdfPath).size, 'bytes\n')

  try {
    // Step 1: Parse PDF
    console.log('Step 1: Parsing PDF...')
    const buffer = fs.readFileSync(pdfPath)
    const resumeText = await parsePDF(buffer)

    console.log('✅ PDF parsed successfully')
    console.log('Extracted text length:', resumeText.length, 'characters')
    console.log('Word count:', resumeText.trim().split(/\s+/).length)
    console.log('')
    console.log('First 1000 characters:')
    console.log('='.repeat(80))
    console.log(resumeText.substring(0, 1000))
    console.log('='.repeat(80))
    console.log('')

    // Step 2: Structure parsing
    console.log('Step 2: Parsing structure...')
    const structured = parseResumeStructure(resumeText)

    console.log('✅ Structure parsed')
    console.log('Sections found:', structured.sections.length)

    // Count experience and education
    const expSection = structured.sections.find(s => s.type === 'experience')
    const eduSection = structured.sections.find(s => s.type === 'education')
    const expCount = expSection?.content.filter(c => c.type === 'experience_item').length || 0
    const eduCount = eduSection?.content.filter(c => c.type === 'education_item').length || 0

    console.log('Experience items:', expCount)
    console.log('Education items:', eduCount)
    console.log('')

    console.log('SECTIONS:')
    structured.sections.forEach((section, i) => {
      const contentCount = section.content?.length || 0
      console.log(`${i + 1}. ${section.heading} (${section.type}) - ${contentCount} items`)
    })
    console.log('')

    // Show first experience item
    if (expSection && expSection.content.length > 0) {
      const firstExp = expSection.content[0]
      console.log('First Experience Item:')
      console.log(JSON.stringify(firstExp, null, 2).substring(0, 500))
    }

    console.log('\n✅ Parsing completed successfully!')
    console.log('The resume text was extracted and can be analyzed by AI.')

  } catch (error) {
    console.error('❌ Error during processing:')
    console.error(error)
  }
}

testUserResume().catch(console.error)
