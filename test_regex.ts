// Test the embedded job regex pattern

const text = "As IT Support Supervisor for Church World Service (CWS Africa), oversee IT support for cloud and on-premises resources in Nairobi and 42 field processing sites across Sub-Saharan Africa, ensuring project execution and adherence to SLAs."

const pattern1 = /^As\s+([^,]+?)\s+(?:at|for)\s+([^,(]+?)(?:\s*\(([^)]+)\))?,\s*(.+)/i

console.log('Testing Pattern 1:')
console.log('Text:', text)
console.log('\nPattern:', pattern1)

const match = text.match(pattern1)

if (match) {
  console.log('\n✓ MATCH FOUND!')
  console.log('Full match:', match[0])
  console.log('Job Title:', match[1])
  console.log('Company:', match[2])
  console.log('Dates:', match[3])
  console.log('Description:', match[4])
} else {
  console.log('\n❌ NO MATCH')
}

// Test other embedded jobs
const otherJobs = [
  "As IT Infrastructure & Support Manager at African Banking Corporation (Aug 2013 – Nov 2020), provided strategic direction for enterprise-level infrastructure and end-user support, assessed IT industry trends to align with evolving infrastructure needs, and collaborated with business unit heads to advance service efficiency and effectiveness.",
  "As Technical Support Team Leader at Safran Morpho (seconded to IEBC), Nairobi (Nov 2012 – Jul 2013), managed the Biometric Voter Registration (BVR) IT infrastructure at the Interim Electoral and Boundaries Commission, ensuring continuous availability of servers, computers, and networking systems while supervising a team of two L1 engineers.",
  "Served as IT Trainer and Cisco Partner Relationship Administrator at Access Kenya, Nairobi.",
  "Served as a Technical Support Engineer / IT Trainer at Computer Learning Centre & Mart Networks, Nairobi."
]

console.log('\n\n================================================================================')
console.log('Testing other embedded jobs:')
console.log('================================================================================\n')

otherJobs.forEach((job, idx) => {
  console.log(`\nTest ${idx + 1}:`)
  console.log('Text:', job)
  const match = job.match(pattern1)
  if (match) {
    console.log('✓ MATCHED - Job Title:', match[1], '| Company:', match[2])
  } else {
    // Try pattern 2
    const pattern2 = /^Served as\s+([^,]+?)\s+at\s+([^,]+),\s*(.+)/i
    const match2 = job.match(pattern2)
    if (match2) {
      console.log('✓ MATCHED (Pattern 2) - Job Title:', match2[1], '| Company:', match2[2])
    } else {
      console.log('❌ NO MATCH')
    }
  }
})
