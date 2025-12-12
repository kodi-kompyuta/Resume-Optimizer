import {
  StructuredResume,
  ATSResumeTemplate,
  ATSHeader,
  ATSExperience,
  ATSEducation,
  ATSProject,
  ContactInfo,
  ExperienceItem,
  EducationItem,
  ContentBlock,
  SkillGroup,
} from '@/types'

/**
 * Convert StructuredResume to ATS-optimized flat template format
 */
export function convertToATSTemplate(structuredResume: StructuredResume): ATSResumeTemplate {
  const header = extractHeader(structuredResume)
  const summary = extractSummary(structuredResume)
  const coreSkills = extractCoreSkills(structuredResume)
  const technicalSkills = extractTechnicalSkills(structuredResume)
  const professionalExperience = extractExperience(structuredResume)
  const education = extractEducation(structuredResume)
  const certifications = extractCertifications(structuredResume)
  const projects = extractProjects(structuredResume)

  return {
    header,
    summary,
    core_skills: coreSkills,
    technical_skills: technicalSkills,
    professional_experience: professionalExperience,
    education,
    certifications,
    projects: projects.length > 0 ? projects : undefined,
    referees: 'Available upon request',
  }
}

/**
 * Extract header/contact information
 */
function extractHeader(resume: StructuredResume): ATSHeader {
  const contactSection = resume.sections.find(s => s.type === 'contact')

  if (!contactSection || contactSection.content.length === 0) {
    return {
      full_name: '',
      location: '',
      email: '',
      phone: '',
    }
  }

  const contactBlock = contactSection.content[0]
  if (contactBlock.type === 'contact_info') {
    const contact = contactBlock.content as ContactInfo
    return {
      full_name: contact.name || '',
      location: contact.location || '',
      email: contact.email || '',
      phone: contact.phone || '',
      linkedin: contact.linkedin,
      github: contact.github,
      portfolio: contact.portfolio,
      website: contact.website,
    }
  }

  return {
    full_name: '',
    location: '',
    email: '',
    phone: '',
  }
}

/**
 * Extract professional summary
 */
function extractSummary(resume: StructuredResume): string {
  const summarySection = resume.sections.find(
    s => s.type === 'summary' || s.type === 'objective'
  )

  if (!summarySection || summarySection.content.length === 0) {
    return ''
  }

  const textBlocks = summarySection.content
    .filter(block => block.type === 'text')
    .map(block => block.content as string)

  return textBlocks.join('\n\n')
}

/**
 * Extract core skills (general skills list)
 */
function extractCoreSkills(resume: StructuredResume): string[] {
  const skillsSection = resume.sections.find(s => s.type === 'skills')

  if (!skillsSection) {
    return []
  }

  const skills: string[] = []

  skillsSection.content.forEach(block => {
    if (block.type === 'skill_group') {
      const skillGroup = block.content as SkillGroup
      // Add skills without category
      if (!skillGroup.category || skillGroup.category.toLowerCase().includes('core')) {
        skills.push(...skillGroup.skills)
      }
    } else if (block.type === 'bullet_list') {
      const bulletList = block.content as { items: { text: string }[] }
      skills.push(...bulletList.items.map(item => item.text))
    }
  })

  return skills
}

/**
 * Extract technical skills grouped by category
 */
function extractTechnicalSkills(resume: StructuredResume): Record<string, string[]> {
  const skillsSection = resume.sections.find(s => s.type === 'skills')

  if (!skillsSection) {
    return {}
  }

  const technicalSkills: Record<string, string[]> = {}

  skillsSection.content.forEach(block => {
    if (block.type === 'skill_group') {
      const skillGroup = block.content as SkillGroup
      if (skillGroup.category && !skillGroup.category.toLowerCase().includes('core')) {
        technicalSkills[skillGroup.category] = skillGroup.skills
      }
    }
  })

  return technicalSkills
}

/**
 * Extract professional experience
 */
function extractExperience(resume: StructuredResume): ATSExperience[] {
  const experienceSection = resume.sections.find(s => s.type === 'experience')

  if (!experienceSection) {
    return []
  }

  const experiences: ATSExperience[] = []

  experienceSection.content.forEach(block => {
    if (block.type === 'experience_item') {
      const exp = block.content as ExperienceItem

      const dateRange = `${exp.startDate} - ${exp.endDate}`
      const responsibilities: string[] = []

      // Add description if exists
      if (exp.description) {
        responsibilities.push(exp.description)
      }

      // Add achievements
      if (exp.achievements && exp.achievements.length > 0) {
        responsibilities.push(...exp.achievements.map(item => item.text))
      }

      experiences.push({
        job_title: exp.jobTitle,
        company: exp.company,
        location: exp.location || '',
        date_range: dateRange,
        responsibilities,
      })
    }
  })

  return experiences
}

/**
 * Extract education
 */
function extractEducation(resume: StructuredResume): ATSEducation[] {
  const educationSection = resume.sections.find(s => s.type === 'education')

  if (!educationSection) {
    return []
  }

  const educationList: ATSEducation[] = []

  educationSection.content.forEach(block => {
    if (block.type === 'education_item') {
      const edu = block.content as EducationItem

      const achievements: string[] = []
      if (edu.achievements && edu.achievements.length > 0) {
        achievements.push(...edu.achievements.map(item => item.text))
      }

      educationList.push({
        degree: edu.degree,
        institution: edu.institution,
        location: edu.location || '',
        date_range: edu.graduationDate || '',
        gpa: edu.gpa,
        honors: edu.honors,
        achievements: achievements.length > 0 ? achievements : undefined,
      })
    }
  })

  return educationList
}

/**
 * Extract certifications
 */
function extractCertifications(resume: StructuredResume): string[] {
  const certSection = resume.sections.find(s => s.type === 'certifications')

  if (!certSection) {
    return []
  }

  const certifications: string[] = []

  certSection.content.forEach(block => {
    if (block.type === 'bullet_list') {
      const bulletList = block.content as { items: { text: string }[] }
      certifications.push(...bulletList.items.map(item => item.text))
    } else if (block.type === 'text') {
      certifications.push(block.content as string)
    }
  })

  return certifications
}

/**
 * Extract projects
 */
function extractProjects(resume: StructuredResume): ATSProject[] {
  const projectsSection = resume.sections.find(s => s.type === 'projects')

  if (!projectsSection) {
    return []
  }

  const projects: ATSProject[] = []

  // Try to parse project items
  // This is a simplified version - in practice, you might have a specific project content type
  projectsSection.content.forEach(block => {
    if (block.type === 'text') {
      const text = block.content as string
      // Basic parsing - you can enhance this
      const lines = text.split('\n')
      if (lines.length > 0) {
        projects.push({
          title: lines[0],
          description: lines.slice(1).join(' '),
        })
      }
    } else if (block.type === 'bullet_list') {
      const bulletList = block.content as { items: { text: string }[] }
      bulletList.items.forEach(item => {
        projects.push({
          title: item.text.split(':')[0] || item.text,
          description: item.text.split(':')[1] || item.text,
        })
      })
    }
  })

  return projects
}

/**
 * Convert ATSResumeTemplate back to plain text resume for display
 */
export function atsTemplateToText(template: ATSResumeTemplate): string {
  const sections: string[] = []

  // Header
  sections.push(template.header.full_name)
  const contactLine: string[] = []
  if (template.header.email) contactLine.push(template.header.email)
  if (template.header.phone) contactLine.push(template.header.phone)
  if (template.header.location) contactLine.push(template.header.location)
  if (template.header.linkedin) contactLine.push(template.header.linkedin)
  sections.push(contactLine.join(' | '))
  sections.push('')

  // Summary
  if (template.summary) {
    sections.push('PROFESSIONAL SUMMARY')
    sections.push(template.summary)
    sections.push('')
  }

  // Core Skills
  if (template.core_skills.length > 0) {
    sections.push('CORE SKILLS')
    sections.push(template.core_skills.join(' • '))
    sections.push('')
  }

  // Technical Skills
  if (Object.keys(template.technical_skills).length > 0) {
    sections.push('TECHNICAL SKILLS')
    Object.entries(template.technical_skills).forEach(([category, skills]) => {
      sections.push(`${category}: ${skills.join(', ')}`)
    })
    sections.push('')
  }

  // Professional Experience
  if (template.professional_experience.length > 0) {
    sections.push('PROFESSIONAL EXPERIENCE')
    template.professional_experience.forEach(exp => {
      sections.push(`${exp.job_title}`)
      sections.push(`${exp.company} | ${exp.location} | ${exp.date_range}`)
      exp.responsibilities.forEach(resp => {
        sections.push(`• ${resp}`)
      })
      sections.push('')
    })
  }

  // Education
  if (template.education.length > 0) {
    sections.push('EDUCATION')
    template.education.forEach(edu => {
      sections.push(`${edu.degree}`)
      sections.push(`${edu.institution} | ${edu.location} | ${edu.date_range}`)
      if (edu.gpa) sections.push(`GPA: ${edu.gpa}`)
      if (edu.honors) sections.push(edu.honors)
      if (edu.achievements && edu.achievements.length > 0) {
        edu.achievements.forEach(ach => sections.push(`• ${ach}`))
      }
      sections.push('')
    })
  }

  // Certifications
  if (template.certifications.length > 0) {
    sections.push('CERTIFICATIONS')
    template.certifications.forEach(cert => {
      sections.push(`• ${cert}`)
    })
    sections.push('')
  }

  // Projects
  if (template.projects && template.projects.length > 0) {
    sections.push('PROJECTS')
    template.projects.forEach(proj => {
      sections.push(`${proj.title}`)
      sections.push(proj.description)
      if (proj.technologies) sections.push(`Technologies: ${proj.technologies.join(', ')}`)
      sections.push('')
    })
  }

  // Referees
  if (template.referees) {
    sections.push('REFEREES')
    sections.push(template.referees)
  }

  return sections.join('\n')
}
