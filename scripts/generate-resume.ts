/**
 * TypeScript equivalent of Python's generate_resume.py
 *
 * Usage:
 *   npx tsx scripts/generate-resume.ts
 *
 * This mimics the Python docxtpl pattern:
 *   1. Load JSON data file
 *   2. Load Word template
 *   3. Render template with data
 *   4. Save output
 */
import { fillResumeTemplate } from '@/lib/templates/fill-template'
import * as fs from 'fs'
import * as path from 'path'

interface ResumeData {
  full_name: string
  contact: {
    phone: string
    email: string
    location: string
  }
  summary: string
  core_skills: string[]
  work_experience: Array<{
    job_title: string
    company: string
    location: string
    date_range: string
    responsibilities: string[]
  }>
  education: Array<{
    degree: string
    institution: string
    date_range: string
    location?: string
  }>
  certifications: string[]
  projects: Array<{
    title: string
    description: string
  }> | string[]
}

async function renderResume(
  dataFile: string,
  templatePath: string,
  outputPath: string
): Promise<void> {
  try {
    console.log('📦 Loading resume data...')

    // Load JSON data
    const dataContent = fs.readFileSync(dataFile, 'utf-8')
    const data: ResumeData = JSON.parse(dataContent)

    console.log('📄 Rendering template with data...')
    console.log(`   - Name: ${data.full_name}`)
    console.log(`   - Skills: ${data.core_skills?.length || 0}`)
    console.log(`   - Experience: ${data.work_experience?.length || 0} positions`)

    // Render the template (equivalent to doc.render(data) in Python)
    const buffer = await fillResumeTemplate(data)

    // Save output
    fs.writeFileSync(outputPath, buffer)

    console.log(`✅ Resume saved to ${outputPath}`)
  } catch (error) {
    console.error('❌ Error generating resume:', error)
    throw error
  }
}

// Main execution (equivalent to Python's if __name__ == "__main__")
if (require.main === module) {
  const dataFile = process.argv[2] || 'optimized_resume.json'
  const templatePath = process.argv[3] || path.join(__dirname, '../lib/templates/resume_template.docx')
  const outputPath = process.argv[4] || 'optimized_resume_output.docx'

  console.log('🚀 Resume Generator')
  console.log('==================')
  console.log(`Data file: ${dataFile}`)
  console.log(`Template: ${templatePath}`)
  console.log(`Output: ${outputPath}`)
  console.log('')

  renderResume(dataFile, templatePath, outputPath)
    .then(() => {
      console.log('')
      console.log('✨ Done!')
    })
    .catch((error) => {
      console.error('')
      console.error('Failed to generate resume')
      process.exit(1)
    })
}

export { renderResume }
