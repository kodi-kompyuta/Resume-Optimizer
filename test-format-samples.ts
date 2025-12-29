import { ResumeStructureParser } from './lib/parsers/structure-parser'

// Test different CV formats

const samples = {
  inline_pipe: `
John Doe
john@example.com
+1234567890

PROFESSIONAL EXPERIENCE

Software Engineer | Google Inc. | June 2020 - Present
• Built scalable microservices architecture
• Led team of 5 engineers
• Improved system performance by 40%

Data Analyst | Facebook | Jan 2018 - May 2020
• Analyzed user behavior data
• Created dashboards for executives
`,

  date_first: `
Jane Smith
jane@example.com

WORK EXPERIENCE

June 2020 - Present
Senior Software Engineer
Tech Corp Inc., San Francisco, CA
• Architected cloud infrastructure
• Mentored junior developers

Jan 2018 - May 2020
Software Developer
StartupCo, Remote
• Developed mobile applications
• Implemented CI/CD pipelines
`,

  company_headers: `
Bob Johnson
bob@example.com

PROFESSIONAL EXPERIENCE

GOOGLE INC.
Senior Software Engineer | June 2020 - Present
• Led platform engineering team
• Reduced latency by 50%

FACEBOOK
Data Engineer | Jan 2018 - May 2020
• Built data pipelines
• Migrated databases to cloud
`,

  functional: `
Alice Williams
alice@example.com

PROFESSIONAL EXPERIENCE

TECHNICAL LEADERSHIP
• Led cross-functional team of 10 engineers on cloud migration project
• Managed $2M infrastructure budget
• Presented technical roadmap to C-suite executives

SOFTWARE DEVELOPMENT
• Developed microservices using Kubernetes and Docker
• Implemented CI/CD pipelines reducing deployment time by 50%
• Built RESTful APIs serving 1M+ requests per day

PROJECT MANAGEMENT
• Coordinated agile sprints for 3 product teams
• Delivered 15+ features on time and under budget
`,

  bullet_jobs: `
Mike Davis
mike@example.com

WORK HISTORY

• Software Engineer at Google (2020-2023): Built search algorithms, led team of 5
• Data Analyst at Facebook (2018-2020): Created analytics dashboards, analyzed user behavior
• Junior Developer at StartupCo (2016-2018): Full-stack web development, deployed 20+ features
`,
}

async function testFormat(name: string, text: string) {
  console.log(`\n${'='.repeat(60)}`)
  console.log(`Testing Format: ${name.toUpperCase()}`)
  console.log('='.repeat(60))

  const parser = new ResumeStructureParser(text)
  const structured = parser.parse()

  const expSection = structured.sections.find(s => s.type === 'experience')
  if (expSection) {
    console.log(`\nJobs Found: ${expSection.content.filter(b => b.type === 'experience_item').length}`)
    expSection.content.forEach((block: any, i: number) => {
      if (block.type === 'experience_item') {
        const exp = block.content
        console.log(`\nJob ${i + 1}:`)
        console.log(`  Title: ${exp.jobTitle}`)
        console.log(`  Company: ${exp.company}`)
        console.log(`  Dates: ${exp.startDate} - ${exp.endDate}`)
        console.log(`  Achievements: ${exp.achievements?.length || 0} bullets`)
      }
    })
  } else {
    console.log('\n❌ No experience section found!')
  }
}

async function main() {
  for (const [name, text] of Object.entries(samples)) {
    await testFormat(name, text)
  }

  console.log(`\n${'='.repeat(60)}`)
  console.log('✅ Multi-format parser testing complete!')
  console.log('='.repeat(60))
}

main().catch(console.error)
