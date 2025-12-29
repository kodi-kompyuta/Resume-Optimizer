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
 * - PDF-specific issues (page numbers, broken lines, headers/footers)
 */
export function normalizeResumeText(text: string, isPDF: boolean = false, debug: boolean = false): string {
  let normalized = text

  // PDF-SPECIFIC: Remove page numbers, headers, footers
  if (isPDF) {
    normalized = cleanPDFArtifacts(normalized)
    if (debug) console.log('[1] After cleanPDFArtifacts:\n', normalized.substring(0, 500), '\n')
  }

  // PDF-SPECIFIC: Merge broken date ranges FIRST (before splitting)
  if (isPDF) {
    normalized = mergeBrokenDateRanges(normalized)
    if (debug) console.log('[2] After mergeBrokenDateRanges:\n', normalized.substring(0, 500), '\n')
  }

  // PDF-SPECIFIC: Split inline dates from job titles SECOND
  if (isPDF) {
    normalized = splitInlineDates(normalized)
    if (debug) console.log('[3] After splitInlineDates:\n', normalized.substring(0, 500), '\n')
  }

  // PDF-SPECIFIC: Merge broken sentences THIRD
  if (isPDF) {
    normalized = mergeBrokenLines(normalized)
    if (debug) console.log('[4] After mergeBrokenLines:\n', normalized.substring(0, 500), '\n')
  }

  // PDF-SPECIFIC: Fix job descriptions formatted as bullets
  if (isPDF) {
    normalized = fixBulletDescriptions(normalized)
    if (debug) console.log('[5] After fixBulletDescriptions:\n', normalized.substring(0, 500), '\n')
  }

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

/**
 * Clean PDF-specific artifacts (page numbers, headers, footers, page breaks)
 */
function cleanPDFArtifacts(text: string): string {
  const lines = text.split('\n')
  const cleaned: string[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()

    // Skip empty lines
    if (!line) {
      cleaned.push('')
      continue
    }

    // Remove standalone page numbers (just a number)
    if (/^\d+$/.test(line) && line.length < 4) {
      continue
    }

    // Remove "X of Y" page markers
    if (/^--\s*\d+\s+of\s+\d+\s*--$/i.test(line)) {
      continue
    }

    // Remove common header/footer patterns
    if (/^page\s+\d+/i.test(line)) {
      continue
    }

    // Keep the line
    cleaned.push(line)
  }

  return cleaned.join('\n')
}

/**
 * Merge broken lines that were split mid-sentence by PDF extraction
 * Examples:
 * - "This is a sentence that was split across"
 * - "two lines because of PDF layout"
 * Should become:
 * - "This is a sentence that was split across two lines because of PDF layout"
 *
 * CRITICAL: Do NOT merge date lines or job title lines!
 */
function mergeBrokenLines(text: string): string {
  const lines = text.split('\n')
  const merged: string[] = []
  let currentLine = ''

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()

    // Empty line resets
    if (!line) {
      if (currentLine) {
        merged.push(currentLine)
        currentLine = ''
      }
      merged.push('')
      continue
    }

    // CRITICAL: Never merge date lines
    const isDateLine = /^(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{4}|^\d{4}(?:\s*[-–—]|$)/i.test(line)

    // CRITICAL: Never merge lines that look like job titles
    const isJobTitleLine = (line.includes(' - ') || line.includes(' – ') || line.includes(' at ')) && !line.startsWith('•')

    // Check if this line should be merged with previous
    const shouldMerge = currentLine && !isDateLine && !isJobTitleLine && (
      // Previous line ends with lowercase letter or comma (incomplete sentence)
      /[a-z,]$/.test(currentLine) &&
      // Current line starts with lowercase (continuation)
      /^[a-z]/.test(line) &&
      // Current line doesn't look like a bullet point
      !/^[•\-*]/.test(line) &&
      // Neither line is a section header
      !isLikelyHeader(currentLine) &&
      !isLikelyHeader(line)
    )

    if (shouldMerge) {
      // Merge with space
      currentLine = currentLine + ' ' + line
    } else {
      // Start new line
      if (currentLine) {
        merged.push(currentLine)
      }
      currentLine = line
    }
  }

  // Don't forget the last line
  if (currentLine) {
    merged.push(currentLine)
  }

  return merged.join('\n')
}

/**
 * Check if a line looks like a section header
 */
function isLikelyHeader(line: string): boolean {
  const trimmed = line.trim()

  // All caps and reasonable length
  if (trimmed === trimmed.toUpperCase() && trimmed.length > 2 && trimmed.length < 50) {
    return true
  }

  // Check against known section headers (case-insensitive)
  const normalized = trimmed.toLowerCase().replace(/:+$/, '')
  return SECTION_HEADERS.some(header => header.toLowerCase() === normalized)
}

/**
 * Split inline dates that appear on the same line as job titles
 * Example: "Job Title - Company July 2025" -> "Job Title - Company\nJuly 2025"
 */
function splitInlineDates(text: string): string {
  const lines = text.split('\n')
  const result: string[] = []

  for (const line of lines) {
    // Pattern 1: "Job Title - Company Month Year" or "Job Title - Company Month Year - Present"
    // Includes all dash variants: \u2010-\u2014
    const matchWithDash = line.match(/^(.+?[-–—‐\u2010-\u2014].+?)\s+((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{4}(?:\s*[-–—‐\u2010-\u2014]\s*(?:Present|Current|Now|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{4})?)?)$/i)

    if (matchWithDash) {
      const [, titleCompany, dates] = matchWithDash
      // Split into two lines
      result.push(titleCompany.trim())
      result.push(dates.trim())
    } else {
      // Pattern 2: "JOB TITLE Month Year - Present" (no dash before dates, all caps title)
      // This handles formats like "CUSTOMER SERVICE MANAGER Jan 2024 - Current"
      // Or "IT SUPPORT ENGINEER / IT TRAINER Jan 2005 - May 2008"
      const matchNoDash = line.match(/^([A-Z\s&\/]+?)\s+((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{4}(?:\s*[-–—‐\u2010-\u2014]\s*(?:Present|Current|Now|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{4})?)?)$/i)

      if (matchNoDash) {
        const [, title, dates] = matchNoDash
        // Split into two lines
        result.push(title.trim())
        result.push(dates.trim())
      } else {
        result.push(line)
      }
    }
  }

  return result.join('\n')
}

/**
 * Merge broken date ranges that were split across lines by PDF extraction
 * Examples:
 * - "Job Title - Company July\n2025" -> "Job Title - Company July 2025"
 * - "Job Title - Company Jan 2024 –\nJune 2025" -> "Job Title - Company Jan 2024 – June 2025"
 * - "IT Support Supervisor... Jan 2023 – Dec 2024" -> unchanged (already good)
 */
function mergeBrokenDateRanges(text: string): string {
  const lines = text.split('\n')
  const result: string[] = []
  let i = 0

  while (i < lines.length) {
    let line = lines[i].trim()
    const nextLine = i + 1 < lines.length ? lines[i + 1].trim() : ''

    // Case 1: Line ends with month (like "July"), next line is just a year
    // Example: "... July" + "2025" -> "... July 2025"
    if (line && /(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s*$/i.test(line) &&
        nextLine && /^\d{4}\s*$/.test(nextLine)) {
      result.push(line + ' ' + nextLine)
      i += 2
      continue
    }

    // Case 2: Line ends with "Month Year –", next line starts with "Month Year" or "Present"
    // Example: "... Jan 2024 –" + "June 2025" -> "... Jan 2024 – June 2025"
    if (line && /(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{4}\s*[-–—]\s*$/i.test(line) &&
        nextLine && /^(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{4}|Present|Current|Now)\b/i.test(nextLine)) {
      // Find where the next line's real content starts (after the date)
      const dateMatch = nextLine.match(/^((?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{4}|Present|Current|Now))\s*(.*)/i)
      if (dateMatch) {
        result.push(line + dateMatch[1])
        // If there's content after the date, add it as a new line
        if (dateMatch[2]) {
          result.push(dateMatch[2])
        }
      } else {
        result.push(line + nextLine)
      }
      i += 2
      continue
    }

    // Case 3: Line ends with year, next line starts with "– Month Year" or "– Present"
    // Example: "... 2024" + "– June 2025" -> "... 2024 – June 2025"
    if (line && /\d{4}\s*$/i.test(line) &&
        nextLine && /^[-–—]\s*(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{4}|Present|Current|Now)/i.test(nextLine)) {
      result.push(line + ' ' + nextLine)
      i += 2
      continue
    }

    result.push(line)
    i++
  }

  return result.join('\n')
}

/**
 * Fix job descriptions that are formatted as bullets in PDFs
 * In PDFs, sometimes job descriptions appear as bullet points instead of plain text
 * This converts them back to plain paragraphs when they appear right after a job title
 */
function fixBulletDescriptions(text: string): string {
  const lines = text.split('\n')
  const result: string[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i].trim()
    result.push(lines[i])

    // Check if this looks like a job title line (has " - " or " at ")
    const isJobTitleLine = line && (
      (line.includes(' - ') || line.includes(' – ') || line.includes(' at ')) &&
      !line.startsWith('•') &&
      !line.startsWith('-')
    )

    if (isJobTitleLine) {
      i++
      // Check if next few lines are bullets that are actually job descriptions
      let collectedBullets: string[] = []
      let hasAchievementsHeader = false

      while (i < lines.length) {
        const nextLine = lines[i].trim()

        // Stop if we hit "Achievements" header
        if (nextLine.toUpperCase() === 'ACHIEVEMENTS') {
          hasAchievementsHeader = true
          break
        }

        // Stop if we hit another section or another job title
        if (!nextLine || isLikelyHeader(nextLine) ||
            (nextLine.includes(' - ') && !nextLine.startsWith('•'))) {
          break
        }

        // If it's a bullet and we haven't seen "Achievements" yet, it might be a description
        if (nextLine.startsWith('•') || nextLine.startsWith('-')) {
          // Only collect the first 2-3 bullets as description (before Achievements header)
          if (!hasAchievementsHeader && collectedBullets.length < 3) {
            collectedBullets.push(nextLine.replace(/^[•\-]\s*/, ''))
            i++
            continue
          }
        }

        // CRITICAL FIX: If it's not a bullet, preserve it (dates, descriptions, etc.)
        // Don't consume lines that aren't bullets
        result.push(lines[i])
        i++
      }

      // If we collected bullets before Achievements header, convert them to plain text
      if (collectedBullets.length > 0) {
        result.push(collectedBullets.join(' '))
      }

      continue
    }

    i++
  }

  return result.join('\n')
}
