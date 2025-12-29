import { parsePDF } from './lib/parsers/pdf'
import { parseResumeStructure } from './lib/parsers/structure-parser'
import * as fs from 'fs'

async function testAllSixJobs() {
  const pdfPath = 'D:\\Personal Work Docs\\Docs\\David Kamau Resume.pdf'

  const buffer = fs.readFileSync(pdfPath)
  const resumeText = await parsePDF(buffer)
  const structured = parseResumeStructure(resumeText)

  const expSection = structured.sections.find(s => s.type === 'experience')

  if (!expSection) {
    console.log('❌ No experience section found!')
    return
  }

  const jobs = expSection.content.filter(b => b.type === 'experience_item')

  console.log('ALL 6 JOBS - COMPLETE DATA CHECK:')
  console.log('='.repeat(80))

  jobs.forEach((job, idx) => {
    const exp = job.content as any
    console.log(`\n${idx + 1}. ${exp.jobTitle}`)
    console.log(`   Company: "${exp.company}" ${exp.company ? '✅' : '❌'}`)
    console.log(`   Location: "${exp.location}" ${exp.location ? '✅' : '❌'}`)
    console.log(`   Dates: ${exp.startDate} - ${exp.endDate} ${exp.startDate && exp.endDate ? '✅' : '❌'}`)
    console.log(`   Achievements: ${exp.achievements?.length || 0} ${exp.achievements?.length > 0 ? '✅' : '❌'}`)
  })

  console.log('\n' + '='.repeat(80))

  const allComplete = jobs.every((job: any) => {
    const exp = job.content
    return exp.company && exp.startDate && exp.endDate
  })

  if (allComplete && jobs.length === 6) {
    console.log('✅ ALL 6 JOBS HAVE COMPLETE DATA!')
    console.log('✅ Ready for optimization and export!')
  } else {
    console.log(`❌ Some jobs missing data (${jobs.length}/6 jobs found)`)
  }
}

testAllSixJobs().catch(console.error)
