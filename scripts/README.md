# Resume Generation Scripts

This directory contains standalone scripts for generating resumes from JSON data.

## 🚀 Quick Start

### Generate Resume from JSON

```bash
# Basic usage (uses default example data)
npx tsx scripts/generate-resume.ts

# Use custom JSON file
npx tsx scripts/generate-resume.ts my-resume-data.json

# Specify all parameters
npx tsx scripts/generate-resume.ts input.json template.docx output.docx
```

## 📁 Files

### `generate-resume.ts`
TypeScript equivalent of Python's `generate_resume.py` using docxtpl pattern.

**Python equivalent:**
```python
from docxtpl import DocxTemplate
import json

def render_resume(data_file, template_path, output_path):
    doc = DocxTemplate(template_path)
    with open(data_file, 'r') as f:
        data = json.load(f)
    doc.render(data)
    doc.save(output_path)
    print(f"✅ Resume saved to {output_path}")
```

**TypeScript version:**
```typescript
async function renderResume(
  dataFile: string,
  templatePath: string,
  outputPath: string
): Promise<void> {
  const data = JSON.parse(fs.readFileSync(dataFile, 'utf-8'))
  const buffer = await fillResumeTemplate(data)
  fs.writeFileSync(outputPath, buffer)
  console.log(`✅ Resume saved to ${outputPath}`)
}
```

### `example-resume-data.json`
Example resume data in the correct JSON format for testing.

## 📝 JSON Data Format

Your JSON file should follow this structure:

```json
{
  "full_name": "John Doe",
  "contact": {
    "phone": "+1-234-567-8900",
    "email": "john.doe@email.com",
    "location": "San Francisco, CA"
  },
  "summary": "Experienced software engineer...",
  "core_skills": ["JavaScript", "React", "Node.js"],
  "work_experience": [
    {
      "job_title": "Senior Software Engineer",
      "company": "Tech Corp",
      "location": "San Francisco, CA",
      "date_range": "Jan 2020 - Present",
      "responsibilities": [
        "Led development of...",
        "Architected and implemented..."
      ]
    }
  ],
  "education": [
    {
      "degree": "Bachelor of Science in Computer Science",
      "institution": "University of Texas",
      "date_range": "2012 - 2016"
    }
  ],
  "certifications": [
    "AWS Certified Solutions Architect"
  ],
  "projects": [
    {
      "title": "Project Name",
      "description": "Project description..."
    }
  ]
}
```

## 🔄 Integration Flow

```
┌─────────────────┐
│  Resume + JD    │
│  (uploaded)     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  AI Optimizer   │
│  (GPT-4)        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ optimized.json  │  ← This is your data file
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ generate-resume │  ← This script
│  .ts            │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  output.docx    │  ← Final formatted resume
└─────────────────┘
```

## 🎨 Styling

The output document uses the template from `lib/templates/resume_template.docx` which includes:

- **Heading 2** for section headers (SUMMARY, CORE SKILLS, etc.)
- **Bold** for job titles and project names
- **Italics** for date ranges
- **Bullets** (•) for all lists
- Professional spacing and formatting

## 🛠️ Customization

To modify the template:

1. Edit `lib/templates/generate-template.ts`
2. Regenerate: `npx tsx lib/templates/generate-template.ts`
3. Or manually edit `lib/templates/resume_template.docx` in Word

## 📚 Examples

### Example 1: Basic Generation
```bash
npx tsx scripts/generate-resume.ts
```
Output: `optimized_resume_output.docx` (using example data)

### Example 2: Use Your Own Data
```bash
npx tsx scripts/generate-resume.ts my-resume.json
```
Output: `optimized_resume_output.docx`

### Example 3: Custom Output Path
```bash
npx tsx scripts/generate-resume.ts my-resume.json template.docx john-doe-resume.docx
```
Output: `john-doe-resume.docx`

## 🐛 Troubleshooting

**Error: Cannot find data file**
- Make sure your JSON file exists and the path is correct
- Use absolute path or path relative to project root

**Error: Invalid JSON**
- Validate your JSON at jsonlint.com
- Check for missing commas, quotes, or brackets

**Error: Missing required fields**
- Ensure your JSON has all required fields: `full_name`, `contact`, `summary`, etc.
- See `example-resume-data.json` for reference

## 📄 PDF Conversion

### Convert DOCX to PDF

```bash
# Convert a resume to PDF
npx tsx scripts/convert-to-pdf.ts optimized_resume_output.docx

# Specify output path
npx tsx scripts/convert-to-pdf.ts resume.docx my-resume.pdf
```

**Requirements:**
- Install LibreOffice (cross-platform)
  - Windows: https://www.libreoffice.org/download/download/
  - macOS: `brew install --cask libreoffice`
  - Linux: `sudo apt-get install libreoffice`

**Python equivalent:**
```python
# Option A: docx2pdf (Windows/macOS only)
from docx2pdf import convert
convert("optimized_resume_output.docx")

# Option B: LibreOffice (cross-platform)
libreoffice --headless --convert-to pdf optimized_resume_output.docx
```

**TypeScript implementation:**
```typescript
import { convert } from './convert-to-pdf'
await convert('resume.docx', 'resume.pdf')
```

### Complete Pipeline: JSON → DOCX → PDF

Generate both DOCX and PDF in one command:

```bash
# Use example data
npx tsx scripts/generate-and-convert.ts

# Use your own data
npx tsx scripts/generate-and-convert.ts my-resume.json my-output

# Outputs:
#   my-output.docx
#   my-output.pdf
```

## 🔗 Related

- Template system: `lib/templates/`
- Optimizer: `lib/openai/optimizer.ts`
- Export API: `app/api/export/docx/route.ts`
