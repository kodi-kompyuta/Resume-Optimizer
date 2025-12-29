import { parsePDF } from './lib/parsers/pdf'
import { parseResumeStructure } from './lib/parsers/structure-parser'
import { generateDocx } from './lib/services/docx-export'
import { parseDOCX } from './lib/parsers/docx'
import * as fs from 'fs'

async function testCompleteFlow() {
  console.log('COMPREHENSIVE END-TO-END TEST')
  console.log('='.repeat(80))

  // Step 1: Parse original PDF
  console.log('\n1. PARSING ORIGINAL PDF...')
  const pdfBuffer = fs.readFileSync('D:\Personal Work Docs\Docs\David Kamau Resume.pdf')
  const pdfText = await parsePDF(pdfBuffer)
  const originalStructured = parseResumeStructure(pdfText)

  const origExpSection = originalStructured.sections.find(s => s.type === 'experience')
  const origJobs = origExpSection?.content.filter(b => b.type === 'experience_item') || []

  const origCertSection = originalStructured.sections.find(s => s.type === 'certifications')
  const origCerts = origCertSection?.content.filter(b => b.type === 'certification_item') || []

  console.log(\`   ✅ Jobs extracted: \${origJobs.length}\`)
  console.log(\`   ✅ Certifications extracted: \${origCerts.length}\`)

  // Verify all jobs have complete data
  const completeJobs = origJobs.filter((job: any) => {
    const exp = job.content
    return exp.company && exp.startDate && exp.endDate
  })
  console.log(\`   ✅ Jobs with complete data: \${completeJobs.length}/\${origJobs.length}\`)

  // Step 2: Export to DOCX
  console.log('\n2. EXPORTING TO DOCX...')
  const docxBuffer = await generateDocx(originalStructured, 'test-resume.docx')
  fs.writeFileSync('test-export-validation.docx', docxBuffer)
  console.log(\`   ✅ DOCX generated: test-export-validation.docx (\${docxBuffer.length} bytes)\`)

  // Step 3: Re-parse the exported DOCX
  console.log('\n3. RE-PARSING EXPORTED DOCX...')
  const reparsedText = await parseDOCX(docxBuffer)
  const reparsedStructured = parseResumeStructure(reparsedText)

  const reparsedExpSection = reparsedStructured.sections.find(s => s.type === 'experience')
  const reparsedJobs = reparsedExpSection?.content.filter(b => b.type === 'experience_item') || []

  const reparsedCertSection = reparsedStructured.sections.find(s => s.type === 'certifications')
  const reparsedCerts = reparsedCertSection?.content.filter(b => b.type === 'certification_item') || []

  console.log(\`   ✅ Jobs re-parsed: \${reparsedJobs.length}\`)
  console.log(\`   ✅ Certifications re-parsed: \${reparsedCerts.length}\`)

  // Step 4: Validation
  console.log('\n4. VALIDATION RESULTS:')
  console.log('='.repeat(80))

  const jobsMatch = origJobs.length === reparsedJobs.length
  const certsMatch = origCerts.length === reparsedCerts.length

  console.log(\`   Job count: \${origJobs.length} → \${reparsedJobs.length} \${jobsMatch ? '✅' : '❌'}\`)
  console.log(\`   Cert count: \${origCerts.length} → \${reparsedCerts.length} \${certsMatch ? '✅' : '❌'}\`)

  // Check individual jobs
  console.log('\n   JOB DETAILS:')
  reparsedJobs.forEach((job: any, idx: number) => {
    const exp = job.content
    const hasCompany = !!exp.company
    const hasDates = !!exp.startDate && !!exp.endDate
    const status = hasCompany && hasDates ? '✅' : '⚠️'
    console.log(\`   \${status} \${idx + 1}. \${exp.jobTitle}\`)
    if (!hasCompany) console.log(\`        ❌ Missing company\`)
    if (!hasDates) console.log(\`        ❌ Missing dates\`)
  })

  // Check certifications
  if (reparsedCerts.length > 0) {
    console.log(\`\n   CERTIFICATIONS (showing first 5):\`)
    reparsedCerts.slice(0, 5).forEach((cert: any, idx: number) => {
      const c = cert.content
      console.log(\`   ✅ \${idx + 1}. \${c.name}\`)
    })
  }

  // Final verdict
  console.log('\n' + '='.repeat(80))
  if (jobsMatch && certsMatch && origJobs.length === 6 && origCerts.length === 12) {
    console.log('✅✅✅ ALL TESTS PASSED! ✅✅✅')
    console.log('✅ All 6 jobs preserved')
    console.log('✅ All 12 certifications preserved')
    console.log('✅ Export → Re-parse cycle successful')
  } else {
    console.log('❌ SOME TESTS FAILED')
    if (!jobsMatch) console.log(\`   ❌ Job count mismatch: \${origJobs.length} → \${reparsedJobs.length}\`)
    if (!certsMatch) console.log(\`   ❌ Cert count mismatch: \${origCerts.length} → \${reparsedCerts.length}\`)
  }
}

testCompleteFlow().catch(console.error)
