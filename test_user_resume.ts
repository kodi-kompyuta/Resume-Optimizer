import { parseDOCX } from './lib/parsers/docx'
import { parseResumeStructure } from './lib/parsers/structure-parser'
import * as fs from 'fs'

async function testUserResume() {
  const filePath = 'D:\\Personal Work Docs\\David Kaniaru Kamau 4525.docx'
  const buffer = fs.readFileSync(filePath)

  console.log('[Test] Parsing DOCX...')
  const resumeText = await parseDOCX(buffer)

  console.log('\n[Test] EXTRACTED TEXT:')
  console.log('='.repeat(80))
  console.log(resumeText)
  console.log('='.repeat(80))

  console.log('\n[Test] Parsing structure...')
  const structured = parseResumeStructure(resumeText)

  console.log('\n[Test] PARSED SECTIONS:')
  console.log(`Total sections: ${structured.sections.length}`)
  structured.sections.forEach(section => {
    console.log(`\n${section.heading} (${section.type}):`)
    console.log(`  Content blocks: ${section.content.length}`)

    // Show all content blocks for all sections
    section.content.forEach((block, i) => {
      console.log(`  ${i + 1}. Type: ${block.type}`)
      if (block.type === 'text') {
        const text = block.content as string
        console.log(`     Content: ${text.substring(0, 100)}${text.length > 100 ? '...' : ''}`)
      } else if (block.type === 'skill_group') {
        const skills = block.content as any
        console.log(`     Category: ${skills.category || '(none)'}`)
        console.log(`     Skills: ${skills.skills.slice(0, 5).join(', ')}${skills.skills.length > 5 ? '...' : ''}`)
      }
    })

    if (section.type === 'experience') {
      const jobs = section.content.filter(b => b.type === 'experience_item')
      console.log(`\n  Found ${jobs.length} job(s):`)
      jobs.forEach((job, i) => {
        const exp = job.content as any
        console.log(`  ${i + 1}. ${exp.jobTitle || '(no title)'} at ${exp.company || '(no company)'}`)
        console.log(`     Dates: ${exp.startDate} - ${exp.endDate}`)
        console.log(`     Achievements: ${exp.achievements?.length || 0}`)
      })
    } else if (section.type === 'education') {
      const eduItems = section.content.filter(b => b.type === 'education_item')
      console.log(`\n  Found ${eduItems.length} education item(s):`)
      eduItems.forEach((edu, i) => {
        const eduData = edu.content as any
        console.log(`  ${i + 1}. ${eduData.degree || '(no degree)'} at ${eduData.institution || '(no institution)'}`)
        console.log(`     Date: ${eduData.graduationDate || 'N/A'}`)
        console.log(`     GPA: ${eduData.gpa || 'N/A'}`)
      })
    }
  })
}

testUserResume().catch(console.error)
