/**
 * Script to generate the resume_template.docx file
 * Run with: npx tsx lib/templates/generate-template.ts
 */
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx'
import * as fs from 'fs'
import * as path from 'path'

async function generateTemplate() {
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          // Header - Name
          new Paragraph({
            text: '{{ full_name }}',
            heading: HeadingLevel.TITLE,
            alignment: AlignmentType.CENTER,
            spacing: {
              after: 100,
            },
          }),

          // Contact Info
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: {
              after: 200,
            },
            children: [
              new TextRun({
                text: '{{ contact.phone }} | {{ contact.email }} | {{ contact.location }}',
                size: 20,
              }),
            ],
          }),

          // SUMMARY Section
          new Paragraph({
            text: 'SUMMARY',
            heading: HeadingLevel.HEADING_2,
            spacing: {
              before: 200,
              after: 100,
            },
          }),
          new Paragraph({
            text: '{{ summary }}',
            spacing: {
              after: 200,
            },
          }),

          // CORE SKILLS Section
          new Paragraph({
            text: 'CORE SKILLS',
            heading: HeadingLevel.HEADING_2,
            spacing: {
              before: 200,
              after: 100,
            },
          }),
          new Paragraph({
            text: '{% for skill in core_skills %}',
            spacing: { after: 50 },
          }),
          new Paragraph({
            text: '• {{ skill }}',
            spacing: { after: 50 },
          }),
          new Paragraph({
            text: '{% endfor %}',
            spacing: { after: 200 },
          }),

          // PROFESSIONAL EXPERIENCE Section
          new Paragraph({
            text: 'PROFESSIONAL EXPERIENCE',
            heading: HeadingLevel.HEADING_2,
            spacing: {
              before: 200,
              after: 100,
            },
          }),
          new Paragraph({
            text: '{% for job in work_experience %}',
            spacing: { after: 50 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: '{{ job.job_title }}',
                bold: true,
              }),
            ],
            spacing: { after: 50 },
          }),
          new Paragraph({
            text: '{{ job.company }} – {{ job.location }}',
            spacing: { after: 50 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: '{{ job.date_range }}',
                italics: true,
              }),
            ],
            spacing: { after: 100 },
          }),
          new Paragraph({
            text: '{% for item in job.responsibilities %}',
            spacing: { after: 50 },
          }),
          new Paragraph({
            text: '• {{ item }}',
            spacing: { after: 50 },
          }),
          new Paragraph({
            text: '{% endfor %}',
            spacing: { after: 50 },
          }),
          new Paragraph({
            text: '{% endfor %}',
            spacing: { after: 200 },
          }),

          // EDUCATION Section
          new Paragraph({
            text: 'EDUCATION',
            heading: HeadingLevel.HEADING_2,
            spacing: {
              before: 200,
              after: 100,
            },
          }),
          new Paragraph({
            text: '{% for edu in education %}',
            spacing: { after: 50 },
          }),
          new Paragraph({
            text: '{{ edu.degree }} – {{ edu.institution }} ({{ edu.date_range }})',
            spacing: { after: 50 },
          }),
          new Paragraph({
            text: '{% endfor %}',
            spacing: { after: 200 },
          }),

          // CERTIFICATIONS Section
          new Paragraph({
            text: 'CERTIFICATIONS',
            heading: HeadingLevel.HEADING_2,
            spacing: {
              before: 200,
              after: 100,
            },
          }),
          new Paragraph({
            text: '{% for cert in certifications %}',
            spacing: { after: 50 },
          }),
          new Paragraph({
            text: '• {{ cert }}',
            spacing: { after: 50 },
          }),
          new Paragraph({
            text: '{% endfor %}',
            spacing: { after: 200 },
          }),

          // PROJECTS Section
          new Paragraph({
            text: 'PROJECTS',
            heading: HeadingLevel.HEADING_2,
            spacing: {
              before: 200,
              after: 100,
            },
          }),
          new Paragraph({
            text: '{% for project in projects %}',
            spacing: { after: 50 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: '{{ project.title }}',
                bold: true,
              }),
            ],
            spacing: { after: 50 },
          }),
          new Paragraph({
            text: '• {{ project.description }}',
            spacing: { after: 100 },
          }),
          new Paragraph({
            text: '{% endfor %}',
            spacing: { after: 200 },
          }),

          // REFEREES Section
          new Paragraph({
            text: 'REFEREES',
            heading: HeadingLevel.HEADING_2,
            spacing: {
              before: 200,
              after: 100,
            },
          }),
          new Paragraph({
            text: 'Available upon request.',
          }),
        ],
      },
    ],
  })

  // Generate the Word document
  const buffer = await Packer.toBuffer(doc)

  // Save to lib/templates/resume_template.docx
  const outputPath = path.join(__dirname, 'resume_template.docx')
  fs.writeFileSync(outputPath, buffer)

  console.log('✅ Template created successfully:', outputPath)
  console.log('📝 File: resume_template.docx')
  console.log('📍 Location: lib/templates/')
}

generateTemplate().catch(console.error)
