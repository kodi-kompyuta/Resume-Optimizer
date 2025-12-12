/**
 * JSON Schema for Resume Structure Validation
 * Ensures complete structure preservation during optimization
 */

export const resumeStructureSchema = {
  $schema: "http://json-schema.org/draft-07/schema#",
  type: "object",
  required: ["metadata", "sections"],
  properties: {
    id: { type: "string" },
    metadata: {
      type: "object",
      required: ["parsedAt", "wordCount"],
      properties: {
        originalFilename: { type: "string" },
        fileType: { type: "string", enum: ["pdf", "docx", "txt"] },
        parsedAt: { type: "string" },
        wordCount: { type: "number" },
        detectedTemplate: { type: "string" },
        formatting: { type: "object" }
      }
    },
    sections: {
      type: "array",
      items: {
        type: "object",
        required: ["id", "type", "heading", "order", "content"],
        properties: {
          id: { type: "string" },
          type: {
            type: "string",
            enum: [
              "contact",
              "summary",
              "objective",
              "experience",
              "education",
              "skills",
              "certifications",
              "projects",
              "awards",
              "publications",
              "languages",
              "volunteer",
              "interests",
              "custom"
            ]
          },
          heading: { type: "string" },
          headingLevel: { type: "number" },
          order: { type: "number" },
          content: {
            type: "array",
            items: {
              type: "object",
              required: ["id", "type", "content"],
              properties: {
                id: { type: "string" },
                type: {
                  type: "string",
                  enum: [
                    "text",
                    "bullet_list",
                    "experience_item",
                    "education_item",
                    "contact_info",
                    "skill_group"
                  ]
                },
                content: {
                  oneOf: [
                    { type: "string" },
                    { type: "object" }
                  ]
                },
                metadata: { type: "object" }
              }
            }
          },
          metadata: { type: "object" }
        }
      }
    },
    rawText: { type: "string" }
  }
}

export const experienceItemSchema = {
  type: "object",
  required: ["id", "jobTitle", "company", "startDate", "endDate", "achievements"],
  properties: {
    id: { type: "string" },
    jobTitle: { type: "string" },
    company: { type: "string" },
    location: { type: "string" },
    startDate: { type: "string" },
    endDate: { type: ["string"] }, // Can be "Present"
    description: { type: "string" },
    achievements: {
      type: "array",
      items: {
        type: "object",
        required: ["id", "text"],
        properties: {
          id: { type: "string" },
          text: { type: "string" },
          subItems: { type: "array" },
          metadata: { type: "object" }
        }
      }
    },
    metadata: { type: "object" }
  }
}

export const educationItemSchema = {
  type: "object",
  required: ["id", "degree", "institution"],
  properties: {
    id: { type: "string" },
    degree: { type: "string" },
    institution: { type: "string" },
    location: { type: "string" },
    graduationDate: { type: "string" },
    gpa: { type: "string" },
    honors: { type: "string" },
    relevantCoursework: { type: "array", items: { type: "string" } },
    achievements: {
      type: "array",
      items: {
        type: "object",
        required: ["id", "text"],
        properties: {
          id: { type: "string" },
          text: { type: "string" }
        }
      }
    }
  }
}

export const contactInfoSchema = {
  type: "object",
  properties: {
    name: { type: "string" },
    email: { type: "string" },
    phone: { type: "string" },
    location: { type: "string" },
    linkedin: { type: "string" },
    github: { type: "string" },
    portfolio: { type: "string" },
    website: { type: "string" },
    other: { type: "object" }
  }
}

/**
 * Structure Preservation Rules
 * These fields must NEVER be modified during optimization
 */
export const PROTECTED_FIELDS = {
  experience: [
    'id',
    'jobTitle',
    'company',
    'location',
    'startDate',
    'endDate',
    'description',
    'achievements.*.id', // Bullet IDs must be preserved
    'achievements.*.metadata' // Metadata must be preserved
  ],
  education: [
    'id',
    'degree',
    'institution',
    'location',
    'graduationDate',
    'gpa',
    'honors',
    'relevantCoursework'
  ],
  contact: [
    'name',
    'email',
    'phone',
    'location',
    'linkedin',
    'github',
    'portfolio',
    'website',
    'other'
  ],
  section: [
    'id',
    'type',
    'heading',
    'headingLevel',
    'order',
    'metadata'
  ],
  global: [
    'id',
    'metadata'
  ]
}

/**
 * Modifiable Fields
 * Only these fields can be changed during optimization
 */
export const MODIFIABLE_FIELDS = {
  experience: [
    'achievements.*.text' // Only bullet text content can change
  ],
  education: [
    'achievements.*.text' // Only achievement text can change
  ],
  text_sections: [
    'content' // Summary, objective text can change
  ],
  skills: [
    'skills' // Can add new skills
  ]
}
