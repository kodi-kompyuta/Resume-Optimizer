/**
 * Helper function to convert StructuredResume to clean JSON format
 * This ensures we always have the JSON format for the professional template
 */
import { StructuredResume } from '@/types'

export function convertStructuredResumeToCleanJson(structured: StructuredResume): any {
  // Extract contact info
  const contactSection = structured.sections.find(s => s.type === 'contact')
  const contactBlock = contactSection?.content[0]
  const contact = contactBlock?.type === 'contact_info'
    ? (contactBlock.content as any)
    : { email: '', phone: '', location: '' }

  // Extract summary
  const summarySection = structured.sections.find(s => s.type === 'summary' || s.type === 'objective')
  const summaryBlock = summarySection?.content.find(b => b.type === 'text')
  const summary = summaryBlock ? (summaryBlock.content as string) : ''

  // Extract skills
  const skillsSection = structured.sections.find(s => s.type === 'skills')
  const core_skills: string[] = []
  if (skillsSection) {
    skillsSection.content.forEach(block => {
      if (block.type === 'skill_group') {
        const skillGroup = block.content as any
        core_skills.push(...skillGroup.skills)
      } else if (block.type === 'bullet_list') {
        const bullets = block.content as any
        bullets.items?.forEach((item: any) => core_skills.push(item.text))
      }
    })
  }

  // Extract work experience
  const expSection = structured.sections.find(s => s.type === 'experience')
  const work_experience: any[] = []
  if (expSection) {
    expSection.content.forEach(block => {
      if (block.type === 'experience_item') {
        const exp = block.content as any
        work_experience.push({
          job_title: exp.jobTitle || '',
          company: exp.company || '',
          location: exp.location || '',
          date_range: `${exp.startDate || ''} - ${exp.endDate || ''}`.trim(),
          responsibilities: exp.achievements?.map((a: any) => a.text) || []
        })
      }
    })
  }

  // Extract education
  const eduSection = structured.sections.find(s => s.type === 'education')
  const education: any[] = []
  if (eduSection) {
    eduSection.content.forEach(block => {
      if (block.type === 'education_item') {
        const edu = block.content as any
        education.push({
          degree: edu.degree || '',
          institution: edu.institution || '',
          location: edu.location || '',
          date_range: edu.graduationDate || ''
        })
      }
    })
  }

  // Extract certifications
  const certSection = structured.sections.find(s => s.type === 'certifications')
  const certifications: string[] = []
  if (certSection) {
    certSection.content.forEach(block => {
      if (block.type === 'bullet_list') {
        const bullets = block.content as any
        certifications.push(...bullets.items.map((i: any) => i.text))
      } else if (block.type === 'text') {
        certifications.push(block.content as string)
      }
    })
  }

  // Extract projects
  const projSection = structured.sections.find(s => s.type === 'projects')
  const projects: any[] = []
  if (projSection) {
    projSection.content.forEach(block => {
      if (block.type === 'text') {
        const text = block.content as string
        projects.push({
          title: 'Project',
          description: text
        })
      } else if (block.type === 'bullet_list') {
        const bullets = block.content as any
        bullets.items?.forEach((item: any) => {
          projects.push({
            title: item.text.split(':')[0] || 'Project',
            description: item.text
          })
        })
      }
    })
  }

  // Extract references
  const refSection = structured.sections.find(s => s.type === 'references' || s.heading.toLowerCase().includes('referee'))
  let references: string | string[] = 'Available upon request'
  if (refSection) {
    const textBlocks = refSection.content.filter(b => b.type === 'text')
    if (textBlocks.length > 0) {
      const refText = textBlocks.map(b => b.content as string).join('. ')
      references = refText || 'Available upon request'
    }
  }

  return {
    full_name: contact.name || '',
    contact: {
      phone: contact.phone || '',
      email: contact.email || '',
      location: contact.location || ''
    },
    summary,
    core_skills,
    work_experience,
    education,
    certifications,
    projects,
    references
  }
}
