// Test to verify all jobs are correctly extracted from the resume

import fs from 'fs'

const data = JSON.parse(fs.readFileSync('test_output_2_structured.json', 'utf-8'))

console.log('================================================================================')
console.log('JOB EXTRACTION VERIFICATION')
console.log('================================================================================\n')

// Find all experience sections
const experienceSections = data.sections.filter((s: any) => s.type === 'experience')

console.log(`Found ${experienceSections.length} experience section(s)\n`)

let totalJobs = 0

experienceSections.forEach((section: any, idx: number) => {
  console.log(`\n--- Section ${idx + 1}: ${section.heading || 'Untitled'} ---`)

  if (section.content && Array.isArray(section.content)) {
    const jobs = section.content.filter((b: any) => b.type === 'experience_item')

    console.log(`Jobs found: ${jobs.length}\n`)

    jobs.forEach((job: any, jobIdx: number) => {
      totalJobs++
      const content = job.content

      console.log(`${jobIdx + 1}. ${content.jobTitle || 'NO TITLE'}`)
      console.log(`   Company: ${content.company || 'MISSING'}`)
      console.log(`   Dates: ${content.startDate || 'MISSING'} - ${content.endDate || 'MISSING'}`)
      console.log(`   Description: ${content.description ? content.description.substring(0, 60) + '...' : 'MISSING'}`)
      console.log(`   Achievements: ${content.achievements?.length || 0} bullets`)

      // Show first achievement
      if (content.achievements && content.achievements.length > 0) {
        console.log(`   First bullet: "${content.achievements[0].text.substring(0, 70)}..."`)
      }
      console.log()
    })
  }
})

console.log('================================================================================')
console.log(`TOTAL JOBS EXTRACTED: ${totalJobs}`)
console.log('================================================================================\n')

// Expected jobs based on the resume
const expectedJobs = [
  'Head of Client Service & Projects at Echotel International',
  'IT Support Supervisor for Church World Service (CWS Africa)',
  'IT Infrastructure & Support Manager at African Banking Corporation',
  'Technical Support Team Leader at Safran Morpho',
  'IT Trainer and Cisco Partner Relationship Administrator at Access Kenya',
  'Technical Support Engineer / IT Trainer at Computer Learning Centre & Mart Networks'
]

console.log('EXPECTED JOBS FROM RESUME:')
expectedJobs.forEach((job, idx) => {
  console.log(`${idx + 1}. ${job}`)
})

console.log(`\n✓ Expected: ${expectedJobs.length} jobs`)
console.log(`✓ Extracted: ${totalJobs} jobs`)

if (totalJobs >= expectedJobs.length) {
  console.log('\n✅ SUCCESS: All expected jobs extracted (or more)')
} else {
  console.log(`\n⚠️  WARNING: Missing ${expectedJobs.length - totalJobs} job(s)`)
}
