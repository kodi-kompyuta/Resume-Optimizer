# Resume Template System

## Overview

This directory contains the Jinja-style template system for generating Word resumes from optimized JSON data.

## Files

- **`resume_template.docx`** - Word template with Jinja-style placeholders
- **`generate-template.ts`** - Script to regenerate the template
- **`fill-template.ts`** - Function to fill template with actual data

## Template Structure

The template uses Jinja-style placeholders:

```
{{ full_name }}
{{ contact.phone }} | {{ contact.email }} | {{ contact.location }}

SUMMARY
{{ summary }}

CORE SKILLS
{% for skill in core_skills %}
• {{ skill }}
{% endfor %}

PROFESSIONAL EXPERIENCE
{% for job in work_experience %}
{{ job.job_title }}
{{ job.company }} – {{ job.location }}
{{ job.date_range }}
{% for item in job.responsibilities %}
• {{ item }}
{% endfor %}
{% endfor %}

EDUCATION
{% for edu in education %}
{{ edu.degree }} – {{ edu.institution }} ({{ edu.date_range }})
{% endfor %}

CERTIFICATIONS
{% for cert in certifications %}
• {{ cert }}
{% endfor %}

PROJECTS
{% for project in projects %}
{{ project.title }}
• {{ project.description }}
{% endfor %}

REFEREES
Available upon request.
```

## Usage

### Regenerate Template

If you need to modify the template structure:

```bash
npx tsx lib/templates/generate-template.ts
```

### Fill Template with Data

```typescript
import { fillResumeTemplate } from '@/lib/templates/fill-template'

const optimizedData = {
  full_name: "John Doe",
  contact: {
    phone: "+1-234-567-8900",
    email: "john.doe@email.com",
    location: "San Francisco, CA"
  },
  summary: "Experienced software engineer...",
  core_skills: ["JavaScript", "React", "Node.js"],
  work_experience: [...],
  education: [...],
  certifications: [...],
  projects: [...]
}

const docBuffer = await fillResumeTemplate(optimizedData)
// Save or return the buffer
```

## Styling

The template uses:
- **Heading 2** for section headers (SUMMARY, CORE SKILLS, etc.)
- **Bold** for job titles and project names
- **Italics** for date ranges
- **Bullets** for lists (•)
- Standard paragraph spacing

## Integration

This template system integrates with:
1. **Optimizer** (`lib/openai/optimizer.ts`) - Generates the JSON data
2. **Export Service** (`lib/services/docx-export.ts`) - Uses template to create final resume
3. **Download API** (`app/api/export/docx/route.ts`) - Serves the generated file
