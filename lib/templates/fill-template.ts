/**
 * Fill resume template with optimized data
 *
 * This module provides functionality to fill the Jinja-style template
 * with actual resume data from the optimizer.
 */
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx'

interface OptimizedResumeData {
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

/**
 * Fill the resume template with optimized data and generate a Word document
 */
export async function fillResumeTemplate(data: OptimizedResumeData): Promise<Buffer> {
  const children: Paragraph[] = []

  // Header - Name
  children.push(
    new Paragraph({
      text: data.full_name,
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: {
        after: 100,
      },
    })
  )

  // Contact Info
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: {
        after: 200,
      },
      children: [
        new TextRun({
          text: `${data.contact.phone} | ${data.contact.email} | ${data.contact.location}`,
          size: 20,
        }),
      ],
    })
  )

  // SUMMARY Section
  children.push(
    new Paragraph({
      text: 'SUMMARY',
      heading: HeadingLevel.HEADING_2,
      spacing: {
        before: 200,
        after: 100,
      },
    })
  )
  children.push(
    new Paragraph({
      text: data.summary,
      spacing: {
        after: 200,
      },
    })
  )

  // CORE SKILLS Section
  if (data.core_skills && data.core_skills.length > 0) {
    children.push(
      new Paragraph({
        text: 'CORE SKILLS',
        heading: HeadingLevel.HEADING_2,
        spacing: {
          before: 200,
          after: 100,
        },
      })
    )

    data.core_skills.forEach(skill => {
      children.push(
        new Paragraph({
          text: `• ${skill}`,
          spacing: { after: 50 },
        })
      )
    })

    children.push(
      new Paragraph({
        text: '',
        spacing: { after: 200 },
      })
    )
  }

  // PROFESSIONAL EXPERIENCE Section
  if (data.work_experience && data.work_experience.length > 0) {
    children.push(
      new Paragraph({
        text: 'PROFESSIONAL EXPERIENCE',
        heading: HeadingLevel.HEADING_2,
        spacing: {
          before: 200,
          after: 100,
        },
      })
    )

    data.work_experience.forEach((job, index) => {
      // Job Title
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: job.job_title,
              bold: true,
            }),
          ],
          spacing: { after: 50 },
        })
      )

      // Company and Location
      children.push(
        new Paragraph({
          text: `${job.company} – ${job.location}`,
          spacing: { after: 50 },
        })
      )

      // Date Range
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: job.date_range,
              italics: true,
            }),
          ],
          spacing: { after: 100 },
        })
      )

      // Responsibilities
      if (job.responsibilities && job.responsibilities.length > 0) {
        job.responsibilities.forEach(resp => {
          children.push(
            new Paragraph({
              text: `• ${resp}`,
              spacing: { after: 50 },
            })
          )
        })
      }

      // Add space between jobs
      if (index < data.work_experience.length - 1) {
        children.push(
          new Paragraph({
            text: '',
            spacing: { after: 100 },
          })
        )
      }
    })

    children.push(
      new Paragraph({
        text: '',
        spacing: { after: 200 },
      })
    )
  }

  // EDUCATION Section
  if (data.education && data.education.length > 0) {
    children.push(
      new Paragraph({
        text: 'EDUCATION',
        heading: HeadingLevel.HEADING_2,
        spacing: {
          before: 200,
          after: 100,
        },
      })
    )

    data.education.forEach(edu => {
      children.push(
        new Paragraph({
          text: `${edu.degree} – ${edu.institution} (${edu.date_range})`,
          spacing: { after: 50 },
        })
      )
    })

    children.push(
      new Paragraph({
        text: '',
        spacing: { after: 200 },
      })
    )
  }

  // CERTIFICATIONS Section
  if (data.certifications && data.certifications.length > 0) {
    children.push(
      new Paragraph({
        text: 'CERTIFICATIONS',
        heading: HeadingLevel.HEADING_2,
        spacing: {
          before: 200,
          after: 100,
        },
      })
    )

    data.certifications.forEach(cert => {
      children.push(
        new Paragraph({
          text: `• ${cert}`,
          spacing: { after: 50 },
        })
      )
    })

    children.push(
      new Paragraph({
        text: '',
        spacing: { after: 200 },
      })
    )
  }

  // PROJECTS Section
  if (data.projects && data.projects.length > 0) {
    children.push(
      new Paragraph({
        text: 'PROJECTS',
        heading: HeadingLevel.HEADING_2,
        spacing: {
          before: 200,
          after: 100,
        },
      })
    )

    data.projects.forEach(proj => {
      const project = typeof proj === 'string'
        ? { title: 'Project', description: proj }
        : proj

      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: project.title,
              bold: true,
            }),
          ],
          spacing: { after: 50 },
        })
      )

      children.push(
        new Paragraph({
          text: `• ${project.description}`,
          spacing: { after: 100 },
        })
      )
    })

    children.push(
      new Paragraph({
        text: '',
        spacing: { after: 200 },
      })
    )
  }

  // REFEREES Section
  children.push(
    new Paragraph({
      text: 'REFEREES',
      heading: HeadingLevel.HEADING_2,
      spacing: {
        before: 200,
        after: 100,
      },
    })
  )
  children.push(
    new Paragraph({
      text: 'Available upon request.',
    })
  )

  // Create the document
  const doc = new Document({
    sections: [
      {
        properties: {},
        children,
      },
    ],
  })

  // Generate and return the buffer
  return await Packer.toBuffer(doc)
}
