/**
 * Shared text normalization for resume parsing
 * Used by both DOCX and PDF parsers to ensure consistent processing
 */

/**
 * Known resume section headers
 */
const SECTION_HEADERS = [
  'WORK EXPERIENCE',
  'PROFESSIONAL EXPERIENCE',
  'EXPERIENCE',
  'EMPLOYMENT HISTORY',
  'EDUCATION',
  'SKILLS',
  'KEY SKILLS',
  'TECHNICAL SKILLS',
  'CORE COMPETENCIES',
  'CERTIFICATIONS',
  'PROFESSIONAL CERTIFICATIONS',
  'ACHIEVEMENTS',
  'PROJECTS',
  'SUMMARY',
  'OBJECTIVE',
  'PROFILE',
  'PROFESSIONAL PROFILE',
  'PERSONAL PROFILE',
  'CONTACT INFORMATION',
  'REFERENCES',
  'REFEREES',
  'ADDITIONAL INFORMATION',
  'TRAINING',
  'AWARDS',
  'PUBLICATIONS',
  'LANGUAGES',
  'VOLUNTEER',
  'INTERESTS',
]

/**
 * Normalize resume text extracted from DOCX or PDF
 * Fixes common parsing issues:
 * - Embedded section headers
 * - Single-line experience entries
 * - Achievement paragraphs
 * - Multi-column layouts
 * - Date formats
 */
export function normalizeResumeText(text: string): string {
  let normalized = text

  // CRITICAL FIX: Split embedded section headers
  // Look for patterns like "...text, WORK EXPERIENCEMore text"
  // where WORK EXPERIENCE should be on its own line
  for (const header of SECTION_HEADERS) {
    // Pattern: any text, then header (possibly with leading comma/period), then more text
    const pattern = new RegExp(`([\\s\\S]*?)([,.]\\s*)(${header})([^\\n])`, 'gi')
    normalized = normalized.replace(pattern, (match, before, punct, headerText, after) => {
      // Put header on its own line
      return `${before}${punct}\n\n${headerText}\n${after}`
    })

    // Also handle cases where header is at the start of a line but followed immediately by content
    const startPattern = new RegExp(`^(${header})([A-Z][a-z])`, 'gim')
    normalized = normalized.replace(startPattern, (match, headerText, nextChar) => {
      return `${headerText}\n${nextChar}`
    })

    // Handle cases where header is mid-line without punctuation
    const midPattern = new RegExp(`([a-z])\\s+(${header})([A-Z])`, 'gi')
    normalized = normalized.replace(midPattern, (match, before, headerText, after) => {
      return `${before}\n\n${headerText}\n${after}`
    })
  }

  // Clean up excessive line breaks (more than 2 in a row)
  normalized = normalized.replace(/\n{3,}/g, '\n\n')

  // CRITICAL FIX: Normalize single-line experience entries
  normalized = normalizeSingleLineExperience(normalized)

  // CRITICAL FIX: Convert ACHIEVEMENTS paragraphs to bullet points
  normalized = splitAchievementParagraphs(normalized)

  return normalized.trim()
}

/**
 * Normalize single-line experience format to multi-line
 * Input: "Job Title - Company    Jan 2024 - Present, Description"
 * Output: "Job Title\nCompany\nJan 2024 - Present\nDescription"
 */
function normalizeSingleLineExperience(text: string): string {
  const lines = text.split('\n')
  const result: string[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // Pattern: Title - Company [whitespace] Dates, Description
    const match = line.match(/^(.+?)\s*[-–—]\s*(.+?)\s{2,}([A-Z][a-z]{2,}\s+\d{4}\s*[-–—].+?),\s*(.+)$/)

    if (match) {
      const [, jobTitle, company, dates, description] = match

      // Convert to multi-line format
      result.push(jobTitle.trim())
      result.push(company.trim())
      result.push(dates.trim())
      result.push(description.trim())
      result.push('') // Blank line after
    } else {
      result.push(line)
    }
  }

  return result.join('\n')
}

/**
 * Split ACHIEVEMENTS paragraphs into bullet points
 * Converts long paragraphs into individual sentences with bullet markers
 */
function splitAchievementParagraphs(text: string): string {
  const lines = text.split('\n')
  const result: string[] = []
  let inAchievements = false

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()

    // Check if this is an ACHIEVEMENTS header
    if (line.toUpperCase() === 'ACHIEVEMENTS') {
      result.push(line)
      inAchievements = true
      continue
    }

    // Check if we're starting a new section (all caps header)
    if (line.toUpperCase() === line && line.length > 3 && line.length < 50 && /^[A-Z\s]+$/.test(line)) {
      inAchievements = false
      result.push(line)
      continue
    }

    // If in achievements section and it's a long paragraph, split it
    if (inAchievements && line.length > 100 && !line.startsWith('•') && !line.startsWith('-')) {
      // Split by sentence boundaries
      const sentences = line.split(/\.\s+(?=[A-Z])/)

      sentences.forEach(sentence => {
        const trimmed = sentence.trim()
        if (trimmed.length > 20) {
          // Add bullet marker
          const bullet = trimmed.endsWith('.') ? `• ${trimmed}` : `• ${trimmed}.`
          result.push(bullet)
        }
      })
    } else {
      result.push(line)
    }
  }

  return result.join('\n')
}
