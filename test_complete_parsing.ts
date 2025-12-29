import { parsePDF } from './lib/parsers/pdf'
import { parseResumeStructure } from './lib/parsers/structure-parser'
import * as fs from 'fs'

async function testCompleteParsing() {
  const pdfPath = 'D:\\Personal Work Docs\\Docs\\David Kamau Resume.pdf'

  console.log('COMPREHENSIVE PARSING TEST')
  console.log('='.repeat(80))
  console.log('')

  try {
    // Parse PDF
    const buffer = fs.readFileSync(pdfPath)
    const resumeText = await parsePDF(buffer)

    // Parse structure
    const structuredData = parseResumeStructure(resumeText)

    // EXPERIENCE
    console.log('EXPERIENCE SECTION:')
    console.log('='.repeat(80))
    const expSection = structuredData.sections.find(s => s.type === 'experience')
    const expItems = expSection?.content.filter(c => c.type === 'experience_item') || []

    console.log(`Total jobs found: ${expItems.length}\n`)

    expItems.forEach((item, index) => {
      const exp = item.content
      console.log(`Job ${index + 1}:`)
      console.log(`  Title: "${exp.jobTitle}"`)
      console.log(`  Company: "${exp.company}"`)
      console.log(`  Location: "${exp.location || '(none)'}"`)
      console.log(`  Dates: ${exp.startDate} - ${exp.endDate}`)
      console.log(`  Achievements: ${exp.achievements?.length || 0}`)

      // Validation
      const issues = []
      if (!exp.jobTitle || exp.jobTitle.length < 3) issues.push('Missing title')
      if (!exp.company || exp.company.length < 3) issues.push('Missing company')
      if (!exp.startDate && !exp.endDate) issues.push('Missing dates')

      if (issues.length > 0) {
        console.log(`  ❌ ISSUES: ${issues.join(', ')}`)
      } else {
        console.log(`  ✅ Valid`)
      }
      console.log('')
    })

    // EDUCATION
    console.log('\nEDUCATION SECTION:')
    console.log('='.repeat(80))
    const eduSection = structuredData.sections.find(s => s.type === 'education')
    const eduItems = eduSection?.content.filter(c => c.type === 'education_item') || []

    console.log(`Total education items found: ${eduItems.length}\n`)

    eduItems.forEach((item, index) => {
      const edu = item.content
      console.log(`Education ${index + 1}:`)
      console.log(`  Degree: "${edu.degree || '(missing)'}"`)
      console.log(`  Institution: "${edu.institution || '(missing)'}"`)
      console.log(`  Field: "${edu.fieldOfStudy || '(none)'}"`)
      console.log(`  Date: "${edu.graduationDate || '(missing)'}"`)

      // Validation
      const issues = []
      if (!edu.degree || edu.degree.length < 3) issues.push('Missing degree')
      if (!edu.institution || edu.institution.length < 3) issues.push('Missing institution')

      if (issues.length > 0) {
        console.log(`  ❌ ISSUES: ${issues.join(', ')}`)
      } else {
        console.log(`  ✅ Valid`)
      }
      console.log('')
    })

    // CERTIFICATIONS
    console.log('\nCERTIFICATIONS SECTION:')
    console.log('='.repeat(80))
    const certSection = structuredData.sections.find(s => s.type === 'certifications')
    const certItems = certSection?.content.filter(c => c.type === 'certification_item') || []

    console.log(`Total certifications found: ${certItems.length}\n`)

    if (certItems.length > 0) {
      certItems.forEach((item, index) => {
        const cert = item.content
        console.log(`${index + 1}. ${cert.name}`)
      })
      console.log('\n✅ Certifications parsed correctly')
    } else {
      console.log('❌ No certifications found!')
    }

    // SUMMARY
    console.log('\n' + '='.repeat(80))
    console.log('FINAL SUMMARY:')
    console.log('='.repeat(80))

    const validJobs = expItems.filter(item => {
      const exp = item.content
      return exp.jobTitle?.length >= 3 && exp.company?.length >= 3
    }).length

    const validEdu = eduItems.filter(item => {
      const edu = item.content
      return edu.degree?.length >= 3 && edu.institution?.length >= 3
    }).length

    console.log(`✅ Experience: ${validJobs}/${expItems.length} valid jobs`)
    console.log(`✅ Education: ${validEdu}/${eduItems.length} valid items`)
    console.log(`✅ Certifications: ${certItems.length} items`)

    console.log('')

    if (validJobs < expItems.length || validEdu < eduItems.length || certItems.length === 0) {
      console.log('⚠️  SOME ISSUES FOUND - Details above')
    } else {
      console.log('✅ ALL SECTIONS PARSED CORRECTLY!')
    }

  } catch (error) {
    console.error('❌ Error during parsing:')
    console.error(error)
  }
}

testCompleteParsing().catch(console.error)
