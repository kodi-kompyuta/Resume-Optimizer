import { parseDOCX } from './lib/parsers/docx'
import { parseResumeStructure } from './lib/parsers/structure-parser'
import * as fs from 'fs'

async function testGeneratedDOCX() {
  const docxPath = 'C:\\Users\\DavidKamau\\Downloads\\David Kamau Resume (2).docx'

  console.log('READING GENERATED DOCX FILE:')
  console.log('='.repeat(80))

  const buffer = fs.readFileSync(docxPath)
  const resumeText = await parseDOCX(buffer)

  console.log('EXTRACTED TEXT:')
  console.log('='.repeat(80))
  console.log(resumeText)
  console.log('='.repeat(80))

  // Parse structure
  const structured = parseResumeStructure(resumeText)

  console.log('\nPARSED STRUCTURE:')
  console.log('='.repeat(80))

  // Show all sections
  structured.sections.forEach((section, i) => {
    console.log(`\n${i + 1}. ${section.heading} (${section.type})`)
    console.log(`   Content blocks: ${section.content?.length || 0}`)

    if (section.type === 'experience') {
      console.log(`   EXPERIENCE ITEMS:`)
      section.content?.forEach((item, idx) => {
        if (item.type === 'experience_item') {
          const exp = item.content
          console.log(`   ${idx + 1}. Job Title: "${exp.jobTitle}"`)
          console.log(`      Company: "${exp.company}"`)
          console.log(`      Location: "${exp.location}"`)
          console.log(`      Dates: ${exp.startDate} - ${exp.endDate}`)
          console.log(`      Achievements: ${exp.achievements?.length || 0}`)
        }
      })
    }

    if (section.type === 'education') {
      console.log(`   EDUCATION ITEMS:`)
      section.content?.forEach((item, idx) => {
        if (item.type === 'education_item') {
          const edu = item.content
          console.log(`   ${idx + 1}. Degree: "${edu.degree}"`)
          console.log(`      Institution: "${edu.institution}"`)
          console.log(`      Field of Study: "${edu.fieldOfStudy}"`)
          console.log(`      Graduation Date: "${edu.graduationDate}"`)
        }
      })
    }

    if (section.type === 'certifications') {
      console.log(`   CERTIFICATIONS:`)
      section.content?.forEach((item, idx) => {
        if (item.type === 'certification_item') {
          const cert = item.content
          console.log(`   ${idx + 1}. "${cert.name}"`)
        }
      })
    }
  })

  console.log('\n' + '='.repeat(80))
  console.log('VALIDATION:')
  const expSection = structured.sections.find(s => s.type === 'experience')
  const jobCount = expSection?.content?.filter(c => c.type === 'experience_item').length || 0
  console.log(`✅ Jobs extracted: ${jobCount} (expected: 6)`)

  const eduSection = structured.sections.find(s => s.type === 'education')
  const eduCount = eduSection?.content?.filter(c => c.type === 'education_item').length || 0
  console.log(`✅ Education entries: ${eduCount}`)

  const certSection = structured.sections.find(s => s.type === 'certifications')
  const certCount = certSection?.content?.filter(c => c.type === 'certification_item').length || 0
  console.log(`✅ Certifications: ${certCount} (expected: 12)`)
}

testGeneratedDOCX().catch(console.error)
