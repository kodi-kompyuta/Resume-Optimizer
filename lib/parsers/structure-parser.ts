import { v4 as uuidv4 } from 'uuid'
import {
  StructuredResume,
  ResumeSection,
  ContentBlock,
  SectionType,
  BulletList,
  BulletItem,
  ExperienceItem,
  EducationItem,
  ContactInfo,
  SkillGroup,
} from '@/types'

/**
 * Resume format types detected by the parser
 */
enum ResumeFormat {
  TRADITIONAL = 'traditional',           // Title, Company, Location/Dates on separate lines
  INLINE_PIPE = 'inline_pipe',          // Title | Company | Dates on one line
  DATE_FIRST = 'date_first',            // Dates appear before job title
  COMPACT = 'compact',                   // All info on single line
  FUNCTIONAL = 'functional',             // Skill-based, no clear job entries
  BULLET_JOBS = 'bullet_jobs',          // Jobs formatted as bullets
  COMPANY_HEADERS = 'company_headers',   // Company name as section, jobs underneath
  HYBRID = 'hybrid',                     // Mix of formats
  UNKNOWN = 'unknown',                   // Cannot determine format
}

/**
 * Convert ALL CAPS text to Title Case
 * Preserves acronyms and special formatting
 */
function toTitleCase(text: string): string {
  // If not all caps, return as-is
  if (text !== text.toUpperCase()) {
    return text
  }

  // List of words that should stay lowercase (unless first word)
  const lowercaseWords = ['a', 'an', 'and', 'as', 'at', 'but', 'by', 'for', 'in', 'of', 'on', 'or', 'the', 'to', 'with']

  // List of common acronyms that should stay uppercase
  const acronyms = ['IT', 'HR', 'CEO', 'CTO', 'VP', 'USA', 'UK', 'AI', 'ML', 'API', 'UI', 'UX', 'AWS', 'GCP', 'SQL', 'NoSQL', 'PhD', 'MBA', 'BSc', 'MSc', 'BA', 'MA', 'US', 'EU', 'UN', 'NATO', 'BTEC', 'WES', 'ECA']

  const words = text.split(/\s+/)

  return words.map((word, index) => {
    // Check if word (without punctuation) is an acronym
    const cleanWord = word.replace(/[^\w]/g, '')
    if (acronyms.includes(cleanWord)) {
      return word
    }

    // Check if word contains special characters (like &, /)
    if (/[&\/\-]/.test(word)) {
      // Split by special chars and title case each part
      return word.split(/([&\/\-])/).map(part => {
        if (part.match(/[&\/\-]/)) return part
        if (acronyms.includes(part)) return part
        return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
      }).join('')
    }

    // First word is always capitalized
    if (index === 0) {
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    }

    // Check if should be lowercase
    if (lowercaseWords.includes(cleanWord.toLowerCase())) {
      return word.toLowerCase()
    }

    // Default: capitalize first letter, rest lowercase
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  }).join(' ')
}

/**
 * Parses plain text resume into structured format
 * Preserves all sections, bullets, and formatting metadata
 */
export class ResumeStructureParser {
  private lines: string[]
  private currentIndex: number = 0
  private detectedExperienceFormat: ResumeFormat = ResumeFormat.UNKNOWN
  private detectedEducationFormat: 'single-line' | 'multi-line' = 'multi-line'

  constructor(private plainText: string) {
    this.lines = plainText.split('\n').map(line => line.trimEnd())
  }

  /**
   * Main parsing method
   */
  parse(): StructuredResume {
    const sections: ResumeSection[] = []
    let order = 0

    // Extract contact information first (usually at top)
    const contactSection = this.extractContactSection()
    if (contactSection) {
      contactSection.order = order++
      sections.push(contactSection)
    }

    // Parse remaining sections
    while (this.currentIndex < this.lines.length) {
      const section = this.parseSection(order)
      if (section) {
        section.order = order++
        sections.push(section)
      } else {
        this.currentIndex++
      }
    }

    // Post-process: Merge split certification sections
    // Common pattern: "PROFESSIONAL CERTIFICATIONS" followed by "AND TRAINING"
    this.mergeCertificationSections(sections)

    // Post-process: Consolidate orphaned job entries FIRST
    // Must run before deduplication to preserve job-title sections
    this.consolidateExperienceItems(sections)

    // Post-process: Deduplicate sections (e.g., multiple "EDUCATION" headings)
    // Run AFTER consolidation so job titles aren't incorrectly merged
    this.deduplicateSections(sections)

    // Post-process: Reorder sections to follow standard resume structure
    // Ensure references always appear last, education before certifications, etc.
    this.reorderSections(sections)

    const wordCount = this.plainText.split(/\s+/).filter(w => w.length > 0).length

    // Determine format preferences for export
    const experienceFormat = this.detectedExperienceFormat === ResumeFormat.INLINE_PIPE ? 'single-line' : 'multi-line'
    const educationFormat = this.detectedEducationFormat

    return {
      metadata: {
        parsedAt: new Date().toISOString(),
        wordCount,
        formatting: {
          experienceFormat,
          educationFormat,
        },
      },
      sections,
      rawText: this.plainText,
    }
  }

  /**
   * Merge split certification sections
   * Common pattern: "PROFESSIONAL CERTIFICATIONS" (empty) followed by "AND TRAINING" (has content)
   */
  private mergeCertificationSections(sections: ResumeSection[]): void {
    for (let i = 0; i < sections.length - 1; i++) {
      const current = sections[i]
      const next = sections[i + 1]

      // Check if current is certifications section with no content
      if (current.type === 'certifications' &&
          current.content.length === 0 &&
          next.heading.toUpperCase().includes('TRAINING')) {

        console.log('[Parser] Merging certification sections:', current.heading, '+', next.heading)

        // Merge next section's content into current
        current.content = next.content
        // Keep original heading (PROFESSIONAL CERTIFICATIONS only)

        // Remove the next section
        sections.splice(i + 1, 1)
        break
      }
    }
  }

  /**
   * Deduplicate sections by merging duplicate section types
   * If resume has multiple sections of same type (e.g., two "EDUCATION" headings),
   * merge their content into the first occurrence and remove duplicates
   */
  private deduplicateSections(sections: ResumeSection[]): void {
    const seen = new Map<string, number>() // type -> first occurrence index

    for (let i = sections.length - 1; i >= 0; i--) {
      const section = sections[i]
      const key = section.type

      if (seen.has(key)) {
        const firstIdx = seen.get(key)!
        // CRITICAL: Safety check - ensure target section exists
        if (sections[firstIdx] && section.content) {
          // Merge content from duplicate into first occurrence
          sections[firstIdx].content.push(...section.content)
          // Remove duplicate section
          sections.splice(i, 1)
          console.log(`[Parser] Merged duplicate ${section.type} section: ${section.heading}`)
        } else {
          console.warn(`[Parser] Cannot merge duplicate section - target or content missing`)
        }
      } else {
        seen.set(key, i)
      }
    }
  }

  /**
   * Reorder sections to follow standard resume structure
   * Ensures references/referees always appear last, education before certifications, etc.
   */
  private reorderSections(sections: ResumeSection[]): void {
    // Define standard section order priority (lower number = earlier in resume)
    const sectionPriority: Record<SectionType, number> = {
      'contact': 0,
      'summary': 1,
      'objective': 1,
      'skills': 2,
      'experience': 3,
      'education': 4,
      'certifications': 5,
      'languages': 6,
      'projects': 7,
      'awards': 8,
      'publications': 9,
      'volunteer': 10,
      'interests': 11,
      'references': 99,  // Always last!
      'custom': 50,      // Custom sections in the middle
    }

    // Sort sections by priority
    sections.sort((a, b) => {
      const priorityA = sectionPriority[a.type] ?? 50
      const priorityB = sectionPriority[b.type] ?? 50
      return priorityA - priorityB
    })

    // Reassign order numbers after sorting
    sections.forEach((section, index) => {
      section.order = index
    })

    console.log('[Parser] Sections reordered to standard resume structure')
  }

  /**
   * Consolidate experience items that appear outside the main WORK EXPERIENCE section
   * Handles unusual resume structures where jobs are scattered throughout the document
   */
  private consolidateExperienceItems(sections: ResumeSection[]): void {
    // Find the main experience section
    let experienceSection = sections.find(s => s.type === 'experience')

    // If no experience section exists, create one
    if (!experienceSection) {
      experienceSection = {
        id: uuidv4(),
        type: 'experience',
        heading: 'WORK EXPERIENCE',
        content: [],
        order: 3,
      }
      sections.push(experienceSection)
    }

    // Second pass: Find custom sections that look like job titles
    // These are ALL CAPS headings with job-related keywords
    const jobSectionIndicies: number[] = []

    sections.forEach((section, idx) => {
      const heading = section.heading.trim()

      // Check if this is a job title disguised as a section heading
      const isJobSection =
        heading === heading.toUpperCase() &&
        heading.length > 15 &&
        heading.length < 100 &&
        !this.isCommonSectionName(heading) &&
        section.type === 'custom' &&
        /^[A-Z\s&\/\-]+$/.test(heading) && // Only letters, spaces, &, /, -
        (heading.includes('MANAGER') ||
         heading.includes('ENGINEER') ||
         heading.includes('SPECIALIST') ||
         heading.includes('LEADER') ||
         heading.includes('TRAINER') ||
         heading.includes('DEVELOPER') ||
         heading.includes('ANALYST') ||
         heading.includes('COORDINATOR') ||
         heading.includes('ADMINISTRATOR') ||
         heading.includes('DIRECTOR') ||
         heading.includes('SUPPORT'))

      if (isJobSection) {
        console.log(`[Parser] Custom section "${heading}" is actually a job title`)
        jobSectionIndicies.push(idx)
      }
    })

    // Re-parse those job sections
    // CRITICAL FIX: Don't rely on pre-parsed section content (which may be incomplete)
    // Instead, find the job titles in the raw text and parse directly from there
    if (jobSectionIndicies.length > 0) {
      console.log(`[Parser] Re-parsing ${jobSectionIndicies.length} job titles by going back to raw text`)

      const jobTitles: string[] = jobSectionIndicies.map(idx => sections[idx].heading.trim())

      // Remove all job title sections first (in reverse to avoid index issues)
      for (let i = jobSectionIndicies.length - 1; i >= 0; i--) {
        sections.splice(jobSectionIndicies[i], 1)
      }

      // Now parse each job from raw text
      for (const jobTitle of jobTitles) {
        // Find this job title in the raw text
        let jobLineIndex = -1
        for (let i = 0; i < this.lines.length; i++) {
          if (this.lines[i].trim() === jobTitle) {
            jobLineIndex = i
            break
          }
        }

        if (jobLineIndex === -1) {
          console.log(`[Parser] ⚠️  Could not find job "${jobTitle}" in raw text`)
          continue
        }

        // Parse the job details from the following lines
        const jobExp: ExperienceItem = {
          id: uuidv4(),
          jobTitle: toTitleCase(jobTitle),  // Convert ALL CAPS to Title Case
          company: '',
          location: '',
          startDate: '',
          endDate: '',
          achievements: [],
        }

        let lineIdx = jobLineIndex + 1

        // Next line(s) should be dates
        // CRITICAL FIX: Handle dates split across two lines
        // Format 1: "May 2008 - May 2011" (one line)
        // Format 2: "May 2008 ‐" then "May 2011" (two lines)
        if (lineIdx < this.lines.length) {
          const dateLine = this.lines[lineIdx].trim()

          // Try single-line date format first
          let dateMatch = dateLine.match(/([A-Z][a-z]+\s+\d{4})\s*[-–—‐]\s*([A-Z][a-z]+\s+\d{4}|Present|Current)/i)

          if (dateMatch) {
            jobExp.startDate = dateMatch[1]
            jobExp.endDate = dateMatch[2]
            lineIdx++
          } else {
            // Try split date format: "May 2008 ‐" on one line, "May 2011" on next
            const startDateMatch = dateLine.match(/^([A-Z][a-z]+\s+\d{4})\s*[-–—‐]\s*$/i)
            if (startDateMatch && lineIdx + 1 < this.lines.length) {
              const nextLine = this.lines[lineIdx + 1].trim()
              const endDateMatch = nextLine.match(/^([A-Z][a-z]+\s+\d{4}|Present|Current)$/i)

              if (endDateMatch) {
                jobExp.startDate = startDateMatch[1]
                jobExp.endDate = endDateMatch[1]
                lineIdx += 2  // Skip both lines
              } else {
                lineIdx++  // Just skip the partial date line
              }
            } else {
              lineIdx++
            }
          }
        }

        // Next line should be company and location
        if (lineIdx < this.lines.length) {
          const companyLine = this.lines[lineIdx].trim()

          // Skip if it's another job title or major section heading
          if (!this.isHeading(this.lines[lineIdx]) || companyLine.endsWith('Kenya')) {
            if (companyLine.includes(',')) {
              const parts = companyLine.split(',').map(p => p.trim())
              jobExp.company = parts[0]
              jobExp.location = parts.slice(1).join(', ')
            } else if (companyLine && !this.isBullet(companyLine)) {
              jobExp.company = companyLine
            }
            lineIdx++
          }
        }

        // Remaining lines until next heading are achievements
        while (lineIdx < this.lines.length) {
          const line = this.lines[lineIdx].trim()

          // Stop at next section or job title
          if (this.isHeading(this.lines[lineIdx]) && !line.startsWith('•')) {
            break
          }

          // CRITICAL: Skip "Achievements" section labels
          // These are just headers, not actual achievement content
          if (line.toLowerCase() === 'achievements' || line.toLowerCase().startsWith('achievement')) {
            lineIdx++
            continue
          }

          if (this.isBullet(line)) {
            const bulletText = line.replace(/^[-•*]\s*/, '')
            jobExp.achievements.push({
              id: uuidv4(),
              text: bulletText,
              metadata: { indentLevel: 0 }
            })
          } else if (line && !this.isBullet(line)) {
            // Non-bullet text is also an achievement
            jobExp.achievements.push({
              id: uuidv4(),
              text: line,
              metadata: { indentLevel: 0 }
            })
          }

          lineIdx++
        }

        // Add to experience section
        experienceSection.content.push({
          id: uuidv4(),
          type: 'experience_item',
          content: jobExp,
        })

        console.log(`[Parser] Parsed job "${jobExp.jobTitle}" (company: "${jobExp.company}", location: "${jobExp.location}", dates: ${jobExp.startDate} - ${jobExp.endDate}, achievements: ${jobExp.achievements.length})`)
      }
    }
  }

  /**
   * Extract contact information section
   */
  private extractContactSection(): ResumeSection | null {
    const contactInfo: ContactInfo = {}
    const contentBlocks: ContentBlock[] = []
    let foundContact = false
    let name: string | undefined
    let lastContactLine = -1

    // Strategy 1: Look for explicit "CONTACT" section (handles sidebar layouts)
    const contactSectionIndex = this.lines.findIndex(line =>
      /^(CONTACT|CONTACT\s+INFO(RMATION)?|PERSONAL\s+INFO(RMATION)?)$/i.test(line.trim())
    )

    if (contactSectionIndex >= 0) {
      // Extract contact info from the section after the CONTACT heading
      // Search up to 30 lines after the heading or until we hit another section
      const searchEnd = Math.min(contactSectionIndex + 30, this.lines.length)

      for (let i = contactSectionIndex + 1; i < searchEnd; i++) {
        const line = this.lines[i].trim()
        if (!line) continue

        // Stop if we hit another major section heading
        if (this.isHeading(line) && i > contactSectionIndex + 5) break

        // Extract contact details
        this.extractContactFromLine(line, contactInfo)

        if (Object.keys(contactInfo).length > 0) {
          foundContact = true
          lastContactLine = Math.max(lastContactLine, i)
        }
      }
    }

    // Strategy 2: Check first 20 lines for contact info (traditional format)
    const maxLines = Math.min(20, this.lines.length)

    for (let i = 0; i < maxLines; i++) {
      const line = this.lines[i].trim()
      if (!line) continue

      // Name is usually the first non-empty line
      // Skip section headings like "CONTACT INFORMATION"
      if (!name && line.length < 50 && !this.isEmail(line) && !this.isPhone(line) && !this.isHeading(line)) {
        name = line
        if (!contactInfo.name) {
          contactInfo.name = line
          foundContact = true
          lastContactLine = Math.max(lastContactLine, i)
        }
        continue
      }

      // Extract other contact details
      const hadContact = Object.keys(contactInfo).length
      this.extractContactFromLine(line, contactInfo)

      if (Object.keys(contactInfo).length > hadContact) {
        foundContact = true
        lastContactLine = Math.max(lastContactLine, i)
      }
    }

    // Strategy 3: If still missing key info (phone/email), search first 100 lines
    // This handles sidebar layouts where contact info appears later in the document
    if (!contactInfo.phone || !contactInfo.email) {
      const extendedSearchLines = Math.min(100, this.lines.length)

      for (let i = 0; i < extendedSearchLines; i++) {
        const line = this.lines[i].trim()
        if (!line) continue

        // Skip if this line is part of a major section (avoid picking up phone numbers from content)
        const prevLine = i > 0 ? this.lines[i - 1].trim() : ''
        if (prevLine.match(/^(SKILLS|EDUCATION|EXPERIENCE|WORK\s+EXPERIENCE|CERTIFICATIONS|PROJECTS)/i)) {
          continue
        }

        this.extractContactFromLine(line, contactInfo)

        if (contactInfo.phone && contactInfo.email) {
          // Found both, can stop searching
          break
        }
      }
    }

    if (!foundContact) return null

    contentBlocks.push({
      id: uuidv4(),
      type: 'contact_info',
      content: contactInfo,
    })

    // Move index past contact section
    this.currentIndex = Math.max(lastContactLine + 1, contactSectionIndex >= 0 ? contactSectionIndex + 10 : 0)

    return {
      id: uuidv4(),
      type: 'contact',
      heading: 'Contact Information',
      order: 0,
      content: contentBlocks,
    }
  }

  /**
   * Helper to extract contact details from a single line
   */
  private extractContactFromLine(line: string, contactInfo: ContactInfo): void {
    // Email
    if (!contactInfo.email) {
      const emailMatch = line.match(/\b[\w.+-]+@[\w.-]+\.\w{2,}\b/i)
      if (emailMatch) {
        contactInfo.email = emailMatch[0]
      }
    }

    // Phone - flexible pattern for worldwide phone numbers
    if (!contactInfo.phone) {
      const phoneMatch = line.match(/(\+\d{1,4}[\s.-]?)?(\(?\d{1,4}\)?[\s.-]?){2,5}\d{1,4}/)
      if (phoneMatch && phoneMatch[0].replace(/\D/g, '').length >= 7) {
        contactInfo.phone = phoneMatch[0]
      }
    }

    // LinkedIn
    if (!contactInfo.linkedin && line.toLowerCase().includes('linkedin.com/')) {
      const match = line.match(/linkedin\.com\/in\/[\w-]+/)
      contactInfo.linkedin = match ? match[0] : line
    }

    // GitHub
    if (!contactInfo.github && line.toLowerCase().includes('github.com/')) {
      const match = line.match(/github\.com\/[\w-]+/)
      contactInfo.github = match ? match[0] : line
    }

    // Location (city, state/country format)
    if (!contactInfo.location && line.match(/^[\w\s]+,\s*[\w\s]{2,}$/)) {
      contactInfo.location = line
    }
  }

  /**
   * Parse a section (heading + content)
   */
  private parseSection(order: number): ResumeSection | null {
    // Skip empty lines
    while (this.currentIndex < this.lines.length && !this.lines[this.currentIndex].trim()) {
      this.currentIndex++
    }

    if (this.currentIndex >= this.lines.length) return null

    const line = this.lines[this.currentIndex]

    // Check if this line is a heading
    if (!this.isHeading(line)) return null

    const heading = line.trim()
    const sectionType = this.detectSectionType(heading)
    this.currentIndex++

    // Parse section content
    const content = this.parseSectionContent(sectionType)

    return {
      id: uuidv4(),
      type: sectionType,
      heading,
      order,
      content,
      metadata: {
        originalHeading: heading,
        formatting: {
          capitalization: this.detectCapitalization(heading),
        },
      },
    }
  }

  /**
   * Check if line is a section heading
   */
  private isHeading(line: string): boolean {
    const trimmed = line.trim()

    // Headings must be:
    // 1. Reasonable length (< 100 chars for job titles, < 50 for section names)
    // 2. Not starting with bullet points or numbers
    // 3. A known section name OR job title pattern

    if (trimmed.length === 0 || trimmed.length > 100) return false

    // CRITICAL: Any line with bullet formatting is NEVER a heading
    // This includes bullets at the start OR number-based bullets
    if (this.isBullet(trimmed) || /^[-•*\d]/.test(trimmed)) return false

    // CRITICAL FIX: Only treat as heading if it's a KNOWN section name
    // This prevents all-caps job titles like "SENIOR PROJECT MANAGER" from being treated as headings
    const isCommonSection = this.isCommonSectionName(trimmed)

    // Also check if it's all caps AND a very short word (likely an acronym section like "IT" or "HR")
    // CRITICAL: Exclude lines ending with periods - those are certification/item names, not section headings
    // (e.g., "CCNA.", "AWS Practitioner." are certifications, not section headers)
    // CRITICAL: Also exclude common certification acronyms (CCNA, CCNP, AWS, etc.)
    const isAllCaps = trimmed === trimmed.toUpperCase() && /[A-Z]/.test(trimmed)
    const isCertificationAcronym = isAllCaps && (
      /^(CCNA|CCNP|CCDA|CCIE|MCSA|MCSE|AWS|AZURE|ITIL|PMP|CISSP|CEH|COMPTIA|A\+|N\+|S\+)$/i.test(trimmed)
    )
    const isShortAcronym = isAllCaps &&
      trimmed.length <= 15 &&
      !trimmed.includes(' ') &&
      !trimmed.endsWith('.') &&
      !isCertificationAcronym  // Don't treat certifications as headings

    // CRITICAL: Detect job title headings (for resumes with scattered jobs)
    // Job titles are ALL CAPS, contain job keywords, and have reasonable length
    // Only detect as heading if we're NOT currently inside work experience section
    const isJobTitleHeading = isAllCaps &&
      trimmed.length >= 15 &&
      trimmed.length <= 80 &&
      !trimmed.endsWith('.') &&
      /^[A-Z\s&\/\-]+$/.test(trimmed) && // Only letters, spaces, &, /, -
      (trimmed.includes('MANAGER') ||
       trimmed.includes('ENGINEER') ||
       trimmed.includes('SPECIALIST') ||
       trimmed.includes('LEADER') ||
       trimmed.includes('TRAINER') ||
       trimmed.includes('DEVELOPER') ||
       trimmed.includes('ANALYST') ||
       trimmed.includes('COORDINATOR') ||
       trimmed.includes('ADMINISTRATOR') ||
       trimmed.includes('DIRECTOR') ||
       trimmed.includes('SUPPORT'))

    return isCommonSection || isShortAcronym || isJobTitleHeading
  }

  /**
   * Check if text is a common section name
   * Must be exact match or very close match to avoid false positives
   */
  private isCommonSectionName(text: string): boolean {
    // CRITICAL: Strip trailing colons before checking (e.g., "KEY SKILLS:" -> "key skills")
    const normalized = text.toLowerCase().trim().replace(/:+$/, '')
    const commonNames = [
      'summary',
      'objective',
      'profile',
      'professional summary',
      'personal profile',
      'professional profile',
      'experience',
      'work experience',
      'employment history',
      'work history',
      'professional experience',
      'education',
      'academic background',
      'skills',
      'key skills',
      'technical skills',
      'core competencies',
      'certifications',
      'professional certifications',
      'certificates',
      'licenses',
      'projects',
      'key projects',
      'notable projects',
      'awards',
      'honors',
      // REMOVED: 'achievements' - This is usually a subsection label within jobs, not a standalone section
      // If someone has an "Achievements" section, it will be detected as 'awards' type anyway
      'publications',
      'languages',
      'volunteer',
      'volunteer experience',
      'interests',
      'hobbies',
      'references',
      'referees',
      'contact information',
      'additional information',
      'training',
    ]

    // Exact match only - no substring matching
    return commonNames.includes(normalized)
  }

  /**
   * Detect section type from heading
   */
  private detectSectionType(heading: string): SectionType {
    const lower = heading.toLowerCase()

    if (lower.includes('summar') || lower.includes('profile') || lower.includes('objective')) {
      return lower.includes('objective') ? 'objective' : 'summary'
    }
    if (lower.includes('experience') || lower.includes('employment') || lower.includes('work history')) {
      return 'experience'
    }
    if (lower.includes('education') || lower.includes('academic')) {
      return 'education'
    }
    if (lower.includes('skill') || lower.includes('competenc')) {
      return 'skills'
    }
    if (lower.includes('certif') || lower.includes('license')) {
      return 'certifications'
    }
    if (lower.includes('project')) {
      return 'projects'
    }
    if (lower.includes('award') || lower.includes('honor') || lower.includes('achievement')) {
      return 'awards'
    }
    if (lower.includes('publication')) {
      return 'publications'
    }
    if (lower.includes('language')) {
      return 'languages'
    }
    if (lower.includes('volunteer')) {
      return 'volunteer'
    }
    if (lower.includes('interest') || lower.includes('hobb')) {
      return 'interests'
    }
    if (lower.includes('reference') || lower.includes('referee')) {
      return 'references'
    }

    return 'custom'
  }

  /**
   * Parse section content based on type
   */
  private parseSectionContent(sectionType: SectionType): ContentBlock[] {
    switch (sectionType) {
      case 'experience':
        return this.parseExperienceContent()
      case 'education':
        return this.parseEducationContent()
      case 'skills':
        return this.parseSkillsContent()
      case 'certifications':
        return this.parseCertificationsContent()
      case 'languages':
        return this.parseLanguagesContent()
      case 'references':
        // References usually contain simple text like "Available upon request" or "On request"
        return this.parseTextContent()
      case 'summary':
      case 'objective':
        return this.parseTextContent()
      default:
        return this.parseGenericContent()
    }
  }

  /**
   * Detect the format of the experience section
   * Analyzes patterns in the experience section to determine parsing strategy
   */
  private detectExperienceFormat(startIndex: number): ResumeFormat {
    const analysisLines: string[] = []
    let idx = startIndex

    // Collect up to 50 lines from experience section for analysis
    while (idx < this.lines.length && analysisLines.length < 50) {
      const line = this.lines[idx].trim()

      // Stop at next major section
      if (this.isHeading(this.lines[idx]) &&
          !this.isDateRangeLine(line) &&
          line.toUpperCase() !== 'ACHIEVEMENTS') {
        break
      }

      if (line) analysisLines.push(line)
      idx++
    }

    if (analysisLines.length === 0) return ResumeFormat.UNKNOWN

    // Count different patterns
    let pipeCount = 0
    let dateFirstCount = 0
    let bulletJobCount = 0
    let dateOnlyCount = 0
    let traditionalCount = 0
    let companyHeaderCount = 0

    for (let i = 0; i < analysisLines.length - 1; i++) {
      const line = analysisLines[i]
      const nextLine = analysisLines[i + 1]
      const prevLine = i > 0 ? analysisLines[i - 1] : ''

      // Pattern: "Title | Company | Dates"
      if (line.includes('|') && this.containsDate(line)) {
        pipeCount++
      }

      // Pattern: Date range line followed by title/company (but NOT preceded by job title)
      // CRITICAL: Only count as date_first if the PREVIOUS line is NOT a job title
      if (this.isDateRangeLine(line) && nextLine && !this.isBullet(nextLine)) {
        // Check if previous line looks like a standalone job title (ALL CAPS, reasonable length)
        const isPrevLineJobTitle = prevLine &&
          prevLine === prevLine.toUpperCase() &&  // ALL CAPS
          prevLine.length >= 10 &&                // Not too short
          prevLine.length <= 80 &&                // Not too long
          !this.isDateLine(prevLine) &&           // Not a date
          !this.isBullet(prevLine) &&             // Not a bullet
          (prevLine.match(/,/g) || []).length <= 1 // Max 1 comma (not a location list)

        // Only count as date_first if previous line is NOT a job title
        if (!isPrevLineJobTitle) {
          dateFirstCount++
        }
      }

      // Pattern: Date range as standalone (like "MAY 2008 — MAY 2011")
      if (this.isDateRangeLine(line)) {
        dateOnlyCount++
      }

      // Pattern: Bullet with job info
      if (this.isBullet(line) && (line.includes(' at ') || line.includes(' - ')) && this.containsDate(line)) {
        bulletJobCount++
      }

      // Pattern: ALL CAPS line (potential company) followed by job title
      if (line === line.toUpperCase() &&
          line.length > 5 &&
          line.length < 50 &&
          !this.isDateRangeLine(line) &&
          nextLine &&
          !this.isBullet(nextLine) &&
          !this.isDateLine(nextLine)) {
        companyHeaderCount++
      }

      // Pattern: Traditional multi-line (title, then company/location, then dates or bullets)
      if (!this.isBullet(line) &&
          !this.isDateLine(line) &&
          !line.includes('|') &&
          line.length > 10 &&
          line.length < 80 &&
          (nextLine && (this.isDateLine(nextLine) || !this.isBullet(nextLine)))) {
        traditionalCount++
      }
    }

    // Decision tree based on pattern counts
    console.log('[Format Detection]', {
      pipeCount,
      dateFirstCount,
      bulletJobCount,
      dateOnlyCount,
      traditionalCount,
      companyHeaderCount
    })

    // Check for functional resume (mostly bullets, no clear job structure)
    const bulletRatio = analysisLines.filter(l => this.isBullet(l)).length / analysisLines.length
    const totalJobIndicators = pipeCount + dateOnlyCount + bulletJobCount + dateFirstCount + companyHeaderCount

    if (bulletRatio > 0.6 && totalJobIndicators === 0) {
      return ResumeFormat.FUNCTIONAL
    }

    // Determine primary format with priority system
    // Pure formats get highest priority when they dominate
    if (pipeCount >= 2 && pipeCount > bulletJobCount && pipeCount > dateOnlyCount) {
      return ResumeFormat.INLINE_PIPE
    }

    if (dateFirstCount >= 2 && dateFirstCount > pipeCount) {
      return ResumeFormat.DATE_FIRST
    }

    if (companyHeaderCount >= 2) {
      return ResumeFormat.COMPANY_HEADERS
    }

    // HYBRID: Mixed patterns (check this BEFORE bullet_jobs)
    // If we have both date-only lines AND bullet jobs, it's hybrid
    if (dateOnlyCount >= 1 && bulletJobCount >= 1) return ResumeFormat.HYBRID
    if (pipeCount >= 1 && (dateOnlyCount >= 1 || bulletJobCount >= 1)) return ResumeFormat.HYBRID
    if (traditionalCount >= 1 && (dateOnlyCount >= 1 || bulletJobCount >= 1)) return ResumeFormat.HYBRID

    // Bullet jobs format (only if it's the ONLY pattern, no mixing)
    if (bulletJobCount >= 2 && dateOnlyCount === 0 && pipeCount === 0 && dateFirstCount === 0 && traditionalCount === 0) {
      return ResumeFormat.BULLET_JOBS
    }

    // Default to traditional for standard CVs
    if (traditionalCount >= 1 || dateOnlyCount >= 1 || bulletJobCount >= 1 || pipeCount >= 1) {
      return ResumeFormat.TRADITIONAL
    }

    return ResumeFormat.UNKNOWN
  }

  /**
   * Helper: Check if text contains a date pattern
   */
  private containsDate(text: string): boolean {
    return /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{4}\b/i.test(text) ||
           /\b\d{4}\s*[-–—]\s*\d{4}\b/.test(text) ||
           /\b(Present|Current)\b/i.test(text)
  }

  /**
   * Parse experience section content
   * Detects format and delegates to appropriate parser
   */
  private parseExperienceContent(): ContentBlock[] {
    // Detect format of this experience section
    const format = this.detectExperienceFormat(this.currentIndex)
    console.log(`[Parser] Detected experience format: ${format}`)

    // Store detected format for later use in export
    this.detectedExperienceFormat = format

    // Delegate to format-specific parser
    switch (format) {
      case ResumeFormat.TRADITIONAL:
      case ResumeFormat.HYBRID:
        return this.parseTraditionalExperience()

      case ResumeFormat.INLINE_PIPE:
        return this.parseInlinePipeExperience()

      case ResumeFormat.DATE_FIRST:
        return this.parseDateFirstExperience()

      case ResumeFormat.BULLET_JOBS:
        return this.parseBulletJobsExperience()

      case ResumeFormat.COMPANY_HEADERS:
        return this.parseCompanyHeaderExperience()

      case ResumeFormat.FUNCTIONAL:
        return this.parseFunctionalExperience()

      case ResumeFormat.UNKNOWN:
      default:
        console.warn('[Parser] Unknown format, using traditional parser as fallback')
        return this.parseTraditionalExperience()
    }
  }

  /**
   * Parse traditional/hybrid experience format
   * Handles most common formats with separate lines for title, company, dates
   */
  private parseTraditionalExperience(): ContentBlock[] {
    const blocks: ContentBlock[] = []
    let currentExperience: ExperienceItem | null = null
    let achievementBuffer: BulletItem[] = []

    while (this.currentIndex < this.lines.length) {
      const line = this.lines[this.currentIndex].trim()

      // Check if this is a date-only heading (job entry with just dates)
      // Example: "MAY 2008 — MAY 2011" or "JANUARY 2005 — MAY 2008"
      const isDateOnlyLine = this.isDateRangeLine(line)

      // Stop at next major section heading (not ACHIEVEMENTS and not date-only lines)
      if (this.isHeading(this.lines[this.currentIndex]) &&
          line.toUpperCase() !== 'ACHIEVEMENTS' &&
          !isDateOnlyLine) {
        // Save any pending experience
        if (currentExperience) {
          currentExperience.achievements = achievementBuffer
          blocks.push({
            id: uuidv4(),
            type: 'experience_item',
            content: currentExperience,
          })
        }
        break
      }

      // Handle date-only job entries (e.g., "MAY 2008 — MAY 2011")
      if (isDateOnlyLine) {
        // Save previous experience if exists
        if (currentExperience) {
          currentExperience.achievements = achievementBuffer
          blocks.push({
            id: uuidv4(),
            type: 'experience_item',
            content: currentExperience,
          })
        }

        // Parse the date range
        const dateInfo = this.parseDateRange(line)

        // Create new experience with dates, will fill in title/company from following content
        currentExperience = {
          id: uuidv4(),
          jobTitle: '', // Will be inferred from bullets
          company: '',
          startDate: dateInfo.startDate,
          endDate: dateInfo.endDate,
          achievements: [],
        }
        achievementBuffer = []
        this.currentIndex++
        continue
      }

      // Skip ACHIEVEMENTS header
      if (line.toUpperCase() === 'ACHIEVEMENTS') {
        this.currentIndex++
        continue
      }

      // Skip empty lines
      if (!line) {
        this.currentIndex++
        continue
      }

      // Check if this is a bullet with an embedded job role
      if (this.isBullet(line)) {
        const embeddedJob = this.extractEmbeddedJob(line)

        if (embeddedJob) {
          // Save previous experience if exists
          if (currentExperience) {
            currentExperience.achievements = achievementBuffer
            blocks.push({
              id: uuidv4(),
              type: 'experience_item',
              content: currentExperience,
            })
          }

          // Start new experience
          currentExperience = embeddedJob
          achievementBuffer = []
          this.currentIndex++

          // Check if next line is a date range (for embedded jobs that have dates on next line)
          if (this.currentIndex < this.lines.length) {
            const nextLine = this.lines[this.currentIndex].trim()
            if (this.isDateLine(nextLine) && !currentExperience.startDate) {
              const dateInfo = this.parseDateLine(nextLine)
              currentExperience.startDate = dateInfo.startDate
              currentExperience.endDate = dateInfo.endDate
              this.currentIndex++
            }
          }

          continue
        }

        // Regular bullet - add to buffer
        const bulletText = this.extractBulletText(line)
        achievementBuffer.push({
          id: uuidv4(),
          text: bulletText,
        })
        this.currentIndex++
        continue
      }

      // Check if this is a standalone date line (following an embedded job mention)
      if (this.isDateLine(line)) {
        if (currentExperience && !currentExperience.startDate) {
          const dateInfo = this.parseDateLine(line)
          currentExperience.startDate = dateInfo.startDate
          currentExperience.endDate = dateInfo.endDate
        }
        this.currentIndex++
        continue
      }

      // CRITICAL: Check if line looks like a non-bulleted achievement description
      // (vs a new job title). This handles achievement text without • symbols.
      const looksLikeAchievement = currentExperience && this.looksLikeAchievementText(line)

      if (looksLikeAchievement) {
        // This is an achievement description without bullet symbol
        // Accumulate multi-line achievement text
        let achievementText = line
        this.currentIndex++

        // Continue reading until we hit a blank line, bullet, or next job
        while (this.currentIndex < this.lines.length) {
          const nextLine = this.lines[this.currentIndex].trim()

          // Stop conditions
          if (!nextLine ||
              this.isBullet(nextLine) ||
              this.isHeading(this.lines[this.currentIndex]) ||
              this.looksLikeJobTitle(nextLine) ||
              this.looksLikeCompanyName(nextLine)) {
            break
          }

          // If line ends with period, it's the end of this achievement
          if (nextLine.endsWith('.')) {
            achievementText += ' ' + nextLine
            this.currentIndex++
            break
          }

          // Continue accumulating
          achievementText += ' ' + nextLine
          this.currentIndex++
        }

        // Add to achievement buffer
        achievementBuffer.push({
          id: uuidv4(),
          text: achievementText.trim(),
        })
        continue
      }

      // Try to parse as traditional experience item (without consuming bullets)
      const expItem = this.parseExperienceItem(false)
      if (expItem) {
        // Save previous experience if exists
        if (currentExperience) {
          currentExperience.achievements = achievementBuffer
          blocks.push({
            id: uuidv4(),
            type: 'experience_item',
            content: currentExperience,
          })
        }

        // Start new experience
        currentExperience = expItem
        achievementBuffer = [] // Start fresh buffer for this job
      } else {
        this.currentIndex++
      }
    }

    // Save final experience if exists
    if (currentExperience) {
      currentExperience.achievements = achievementBuffer
      blocks.push({
        id: uuidv4(),
        type: 'experience_item',
        content: currentExperience,
      })
    }

    // Infer job titles and companies for date-only entries from their bullets
    blocks.forEach(block => {
      if (block.type !== 'experience_item') return

      const exp = block.content as ExperienceItem

      // If job title is empty, try to infer from first bullet
      if (!exp.jobTitle && exp.achievements && exp.achievements.length > 0) {
        const firstBullet = exp.achievements[0].text

        // Look for verbs that typically start job descriptions: "Led", "Managed", "Delivered", etc.
        // Extract the main action as the job title
        const actionMatch = firstBullet.match(/^(Led|Managed|Delivered|Provided|Coordinated|Oversaw|Supported|Developed|Implemented|Facilitated|Trained|Conducted)\s+(.+?)(?:in partnership|for|at|to|across|\.|\,)/i)

        if (actionMatch) {
          const action = actionMatch[1]
          const object = actionMatch[2].trim()
          // Create concise title: "Led technology training" instead of full sentence
          exp.jobTitle = `${action} ${object}`.substring(0, 80)
        } else if (firstBullet.length > 10) {
          // Fallback: Take first clause or up to 80 chars
          const titleCandidate = firstBullet.split(/[.;,]/).shift()?.trim() || firstBullet
          exp.jobTitle = titleCandidate.substring(0, 80)
        }
      }

      // Try to extract company from achievements if company is empty
      if (!exp.company && exp.achievements) {
        let bestCompany = ''

        for (const achievement of exp.achievements) {
          // PRIORITY 1: Look for possessive company names (Company's, AccessKenya's)
          const possessiveMatch = achievement.text.match(/\b([A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+)*)'s\b/)
          if (possessiveMatch) {
            const candidate = possessiveMatch[1].trim()
            // Ignore generic terms
            if (!['HR', 'IT', 'The'].includes(candidate) && candidate.length > 2) {
              bestCompany = candidate
              break // Possessive form is highly reliable
            }
          }

          // PRIORITY 2: Look for "at/for/with Company Name" patterns
          if (!bestCompany) {
            const companyMatch = achievement.text.match(/\b(?:at|for|with)\s+([A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+)*)\b/)
            if (companyMatch) {
              const candidate = companyMatch[1].trim()
              // Ignore generic single-letter or common abbreviations
              if (!['HR', 'IT', 'US'].includes(candidate) && candidate.length > 2) {
                bestCompany = candidate
              }
            }
          }
        }

        if (bestCompany) {
          exp.company = bestCompany
        }
      }
    })

    // CRITICAL: Deduplicate experience items
    // This prevents duplicate job entries in the resume
    const seen = new Map<string, boolean>()
    const deduplicated = blocks.filter(block => {
      if (block.type !== 'experience_item') return true

      const exp = block.content as ExperienceItem
      // Create a unique key from job details
      const key = `${exp.jobTitle}|${exp.company}|${exp.startDate}|${exp.endDate}`.toLowerCase().trim()

      if (seen.has(key)) {
        console.warn('[Parser] Duplicate job detected and removed:', exp.jobTitle, 'at', exp.company)
        return false
      }

      seen.set(key, true)
      return true
    })

    if (deduplicated.length < blocks.length) {
      console.log(`[Parser] Removed ${blocks.length - deduplicated.length} duplicate experience items`)
    }

    return deduplicated
  }

  /**
   * Parse inline pipe format: "Title | Company | Dates"
   */
  private parseInlinePipeExperience(): ContentBlock[] {
    const blocks: ContentBlock[] = []

    while (this.currentIndex < this.lines.length) {
      const line = this.lines[this.currentIndex].trim()

      // Stop at next section
      if (this.isHeading(this.lines[this.currentIndex]) && line.toUpperCase() !== 'ACHIEVEMENTS') {
        break
      }

      if (!line || this.isBullet(line)) {
        this.currentIndex++
        continue
      }

      // Parse pipe-delimited job entry
      if (line.includes('|')) {
        const parts = line.split('|').map(p => p.trim())
        if (parts.length >= 2) {
          let jobTitle = parts[0]
          let company = ''
          let startDate = ''
          let endDate = ''
          let location = ''

          // Check if first part contains " - " (job title - company)
          if (parts[0].includes(' - ')) {
            const dashParts = parts[0].split(' - ')
            jobTitle = dashParts[0].trim()
            company = dashParts.slice(1).join(' - ').trim()
          } else if (parts[0].includes(' – ')) {
            const dashParts = parts[0].split(' – ')
            jobTitle = dashParts[0].trim()
            company = dashParts.slice(1).join(' – ').trim()
          }

          // Process remaining parts (location and/or dates)
          for (let i = 1; i < parts.length; i++) {
            const part = parts[i]
            if (this.containsDate(part)) {
              const dateInfo = this.parseDateLine(part)
              startDate = dateInfo.startDate
              endDate = dateInfo.endDate
              if (dateInfo.location && !location) {
                location = dateInfo.location
              }
            } else if (!location && part) {
              // If not dates and no location yet, this is location or company
              if (!company) {
                company = part
              } else {
                location = part
              }
            }
          }

          const exp: ExperienceItem = {
            id: uuidv4(),
            jobTitle,
            company,
            location,
            startDate,
            endDate,
            achievements: [],
          }

          // Parse achievements (bullets following the job line)
          this.currentIndex++
          const achievements: BulletItem[] = []
          while (this.currentIndex < this.lines.length) {
            const achievementLine = this.lines[this.currentIndex].trim()
            if (!achievementLine) {
              this.currentIndex++
              continue
            }
            if (this.isHeading(this.lines[this.currentIndex]) || (achievementLine.includes('|') && this.containsDate(achievementLine))) {
              break
            }
            if (this.isBullet(achievementLine)) {
              achievements.push({
                id: uuidv4(),
                text: this.extractBulletText(achievementLine),
              })
            }
            this.currentIndex++
          }

          exp.achievements = achievements
          blocks.push({
            id: uuidv4(),
            type: 'experience_item',
            content: exp,
          })
          continue
        }
      }

      this.currentIndex++
    }

    return blocks
  }

  /**
   * Parse date-first format: Dates appear before job title/company
   */
  private parseDateFirstExperience(): ContentBlock[] {
    const blocks: ContentBlock[] = []

    while (this.currentIndex < this.lines.length) {
      const line = this.lines[this.currentIndex].trim()

      // Stop at next section
      if (this.isHeading(this.lines[this.currentIndex]) && !this.isDateRangeLine(line)) {
        break
      }

      if (!line) {
        this.currentIndex++
        continue
      }

      // Look for date line
      if (this.isDateLine(line) || this.isDateRangeLine(line)) {
        const dateInfo = this.parseDateLine(line)
        this.currentIndex++

        // Next line should be job title
        let jobTitle = ''
        let company = ''
        let location = dateInfo.location

        if (this.currentIndex < this.lines.length) {
          const titleLine = this.lines[this.currentIndex].trim()
          if (titleLine && !this.isBullet(titleLine)) {
            jobTitle = titleLine
            this.currentIndex++
          }
        }

        // Next line might be company
        if (this.currentIndex < this.lines.length) {
          const companyLine = this.lines[this.currentIndex].trim()
          if (companyLine && !this.isBullet(companyLine) && !this.isDateLine(companyLine)) {
            company = companyLine
            this.currentIndex++
          }
        }

        // Parse achievements
        const achievements: BulletItem[] = []
        while (this.currentIndex < this.lines.length) {
          const achievementLine = this.lines[this.currentIndex].trim()
          if (!achievementLine) {
            this.currentIndex++
            continue
          }
          if (this.isHeading(this.lines[this.currentIndex]) || this.isDateLine(achievementLine)) {
            break
          }
          if (this.isBullet(achievementLine)) {
            achievements.push({
              id: uuidv4(),
              text: this.extractBulletText(achievementLine),
            })
          }
          this.currentIndex++
        }

        blocks.push({
          id: uuidv4(),
          type: 'experience_item',
          content: {
            id: uuidv4(),
            jobTitle,
            company,
            location,
            startDate: dateInfo.startDate,
            endDate: dateInfo.endDate,
            achievements,
          },
        })
        continue
      }

      this.currentIndex++
    }

    return blocks
  }

  /**
   * Parse bullet jobs format: Each job is a bullet point
   */
  private parseBulletJobsExperience(): ContentBlock[] {
    const blocks: ContentBlock[] = []

    while (this.currentIndex < this.lines.length) {
      const line = this.lines[this.currentIndex].trim()

      // Stop at next section
      if (this.isHeading(this.lines[this.currentIndex])) {
        break
      }

      if (!line) {
        this.currentIndex++
        continue
      }

      if (this.isBullet(line)) {
        const embeddedJob = this.extractEmbeddedJob(line)
        if (embeddedJob) {
          blocks.push({
            id: uuidv4(),
            type: 'experience_item',
            content: embeddedJob,
          })
        }
      }

      this.currentIndex++
    }

    return blocks
  }

  /**
   * Parse company header format: Company names as section headers with jobs underneath
   */
  private parseCompanyHeaderExperience(): ContentBlock[] {
    const blocks: ContentBlock[] = []

    while (this.currentIndex < this.lines.length) {
      const line = this.lines[this.currentIndex].trim()

      // Check if this is a company header (ALL CAPS, not too long)
      const isCompanyHeader = line === line.toUpperCase() &&
                               line.length > 5 &&
                               line.length < 50 &&
                               !this.isDateLine(line) &&
                               !this.isBullet(line)

      if (isCompanyHeader) {
        const company = line
        this.currentIndex++

        // Parse jobs under this company
        while (this.currentIndex < this.lines.length) {
          const jobLine = this.lines[this.currentIndex].trim()

          // Stop if we hit another company header or section
          if ((jobLine === jobLine.toUpperCase() && jobLine.length > 5) ||
              this.isHeading(this.lines[this.currentIndex])) {
            break
          }

          if (!jobLine) {
            this.currentIndex++
            continue
          }

          // Parse job title and dates
          if (!this.isBullet(jobLine)) {
            let jobTitle = jobLine
            let startDate = ''
            let endDate = ''
            let location = ''

            // Check if dates are on same line
            if (this.containsDate(jobLine)) {
              const parts = jobLine.split('|').map(p => p.trim())
              if (parts.length >= 2) {
                jobTitle = parts[0]
                const dateInfo = this.parseDateLine(parts[1])
                startDate = dateInfo.startDate
                endDate = dateInfo.endDate
                location = dateInfo.location
              }
            }

            this.currentIndex++

            // Check next line for dates if not found
            if (!startDate && this.currentIndex < this.lines.length) {
              const nextLine = this.lines[this.currentIndex].trim()
              if (this.isDateLine(nextLine)) {
                const dateInfo = this.parseDateLine(nextLine)
                startDate = dateInfo.startDate
                endDate = dateInfo.endDate
                location = dateInfo.location
                this.currentIndex++
              }
            }

            // Parse achievements
            const achievements: BulletItem[] = []
            while (this.currentIndex < this.lines.length) {
              const achievementLine = this.lines[this.currentIndex].trim()
              if (!achievementLine) {
                this.currentIndex++
                continue
              }
              if ((achievementLine === achievementLine.toUpperCase() && achievementLine.length > 5) ||
                  this.isHeading(this.lines[this.currentIndex]) ||
                  (!this.isBullet(achievementLine) && achievementLine.length > 10)) {
                break
              }
              if (this.isBullet(achievementLine)) {
                achievements.push({
                  id: uuidv4(),
                  text: this.extractBulletText(achievementLine),
                })
              }
              this.currentIndex++
            }

            blocks.push({
              id: uuidv4(),
              type: 'experience_item',
              content: {
                id: uuidv4(),
                jobTitle,
                company,
                location,
                startDate,
                endDate,
                achievements,
              },
            })
          } else {
            this.currentIndex++
          }
        }
      } else {
        // Stop at next section
        if (this.isHeading(this.lines[this.currentIndex])) {
          break
        }
        this.currentIndex++
      }
    }

    return blocks
  }

  /**
   * Parse functional resume format: Skill-based sections with bullets
   */
  private parseFunctionalExperience(): ContentBlock[] {
    const blocks: ContentBlock[] = []

    // For functional resumes, create a single "experience" entry with all bullets
    const achievements: BulletItem[] = []

    while (this.currentIndex < this.lines.length) {
      const line = this.lines[this.currentIndex].trim()

      // Stop at next section
      if (this.isHeading(this.lines[this.currentIndex])) {
        break
      }

      if (this.isBullet(line)) {
        achievements.push({
          id: uuidv4(),
          text: this.extractBulletText(line),
        })
      }

      this.currentIndex++
    }

    // Create a single functional experience entry
    if (achievements.length > 0) {
      blocks.push({
        id: uuidv4(),
        type: 'experience_item',
        content: {
          id: uuidv4(),
          jobTitle: 'Professional Experience',
          company: '',
          location: '',
          startDate: '',
          endDate: '',
          achievements,
        },
      })
    }

    return blocks
  }

  /**
   * Extract embedded job information from bullet text
   * Handles patterns like: "As [Title] at/for [Company] ([Dates]), ..."
   */
  private extractEmbeddedJob(bulletText: string): ExperienceItem | null {
    const text = this.extractBulletText(bulletText)

    // Pattern 1: "As [Title] at/for [Company] ([Dates])," or "As [Title] at/for [Company],"
    const pattern1 = /^As\s+([^,]+?)\s+(?:at|for)\s+([^,(]+?)(?:\s*\(([^)]+)\))?,\s*(.+)/i
    const match1 = text.match(pattern1)

    if (match1) {
      const [, jobTitle, company, dates, description] = match1
      const { startDate, endDate } = dates ? this.parseDateRange(dates.trim()) : { startDate: '', endDate: '' }

      return {
        id: uuidv4(),
        jobTitle: jobTitle.trim(),
        company: company.trim(),
        startDate,
        endDate,
        description: description.trim(),
        achievements: [],
      }
    }

    // Pattern 2: "Served as [Title] at [Company], [Location]"
    const pattern2 = /^Served as\s+([^,]+?)\s+at\s+([^,]+),\s*(.+)/i
    const match2 = text.match(pattern2)

    if (match2) {
      const [, jobTitle, company, location] = match2

      return {
        id: uuidv4(),
        jobTitle: jobTitle.trim(),
        company: company.trim(),
        location: location.trim(),
        startDate: '',
        endDate: '',
        achievements: [],
      }
    }

    // Pattern 3: "Job Title - Company Name Dates" or "Job Title - Company (Details) Dates"
    // Examples:
    // "IT Support Supervisor - Church World Service (CWS Africa) Jan 2023 – Dec 2024."
    // "IT Infrastructure & Support Manager - African Banking Corporation Aug 2013 – Nov 2020."
    if (text.includes('–') || text.includes('-')) {
      // Try to split on the dash
      const parts = text.split(/\s*[–-]\s*/)
      if (parts.length >= 2) {
        const potentialTitle = parts[0].trim()
        const restOfLine = parts.slice(1).join(' - ').trim()

        // Check if this looks like a job title
        if (potentialTitle.length > 5 && potentialTitle.length < 100) {
          // Try to extract dates from the rest
          const dateMatch = restOfLine.match(/\b((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{4})\s*[–-]\s*((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{4}|Present|Current)\b/i)

          if (dateMatch) {
            const startDate = dateMatch[1].trim()
            const endDate = dateMatch[2].trim()

            // Extract company (everything before the dates)
            const companyPart = restOfLine.substring(0, dateMatch.index).trim()

            return {
              id: uuidv4(),
              jobTitle: potentialTitle,
              company: companyPart,
              startDate,
              endDate,
              achievements: [],
            }
          }
        }
      }
    }

    // Pattern 4: "Job Title at Company, Location Dates" or "Job Title at Company (Details), Location Dates"
    // Examples:
    // "Technical Support Team Leader at Safran Morpho (seconded to IEBC), Nairobi Nov 2012 – Jul 2013"
    if (text.includes(' at ')) {
      const atPattern = /^(.+?)\s+at\s+(.+?)(?:,\s*(.+?))?\s+((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{4})\s*[–-]\s*((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{4}|Present|Current)/i
      const match = text.match(atPattern)

      if (match) {
        const [, jobTitle, companyWithDetails, location, startDate, endDate] = match

        return {
          id: uuidv4(),
          jobTitle: jobTitle.trim(),
          company: companyWithDetails.trim(),
          location: location?.trim() || '',
          startDate: startDate.trim(),
          endDate: endDate.trim(),
          achievements: [],
        }
      }
    }

    return null
  }

  /**
   * Extract clean text from bullet (remove bullet markers)
   */
  private extractBulletText(line: string): string {
    return line.replace(/^[-•*]\s*/, '').trim()
  }

  /**
   * Parse date range into start and end dates
   */
  private parseDateRange(dateStr: string): { startDate: string; endDate: string } {
    const parts = dateStr.split(/[-–—]/).map(p => p.trim())

    if (parts.length >= 2) {
      return {
        startDate: parts[0],
        endDate: parts[1],
      }
    }

    return { startDate: dateStr, endDate: '' }
  }

  /**
   * Parse a single experience item
   * @param parseBullets - If false, skip parsing bullet points (for manual bullet handling)
   */
  private parseExperienceItem(parseBullets: boolean = true): ExperienceItem | null {
    const startIndex = this.currentIndex

    let line = this.lines[this.currentIndex].trim()
    if (!line || this.isBullet(line)) return null

    // CRITICAL FIX: Reject lines that obviously aren't job titles
    // (achievement bullets that had markers removed, technical jargon, etc.)
    if (line.endsWith('.') && !line.includes(' - ') && !line.includes(' – ')) {
      // Line ends with period but has no dash - likely a description sentence
      return null
    }

    if (/^[a-z]/.test(line) && line.length < 100) {
      // Starts with lowercase and is short - likely a sentence fragment
      return null
    }

    let jobTitle = ''
    let company = ''
    let location = ''
    let startDate = ''
    let endDate: string | 'Present' = ''
    let jobTitleLine = line

    // CRITICAL FIX: Look ahead to find the line with dates (the actual job title line)
    // Often resumes have a description before the "Job Title - Company | Dates" line
    let foundJobLine = false
    let lookAheadIndex = this.currentIndex

    while (lookAheadIndex < Math.min(this.currentIndex + 5, this.lines.length)) {
      const potentialLine = this.lines[lookAheadIndex].trim()

      // Check if this line contains dates (month + year pattern)
      const hasDatePattern = /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{4}\b/i.test(potentialLine)

      // CRITICAL: Skip date-only lines (e.g., "Jan 2024 - Present", "2018 - 2020")
      // Check if line looks like ONLY dates (date range pattern)
      const looksLikeDateOnly = this.looksLikeDateRangeLine(potentialLine)

      if (hasDatePattern && looksLikeDateOnly) {
        // This is just a date line, not a job title line - skip it
        lookAheadIndex++
        continue
      }

      // Check if this line has dates AND other content (job title/company)
      if (hasDatePattern && !looksLikeDateOnly && (potentialLine.includes('|') || potentialLine.includes('–') || potentialLine.includes('-'))) {
        // This is the actual job title line!
        jobTitleLine = potentialLine
        foundJobLine = true

        // Skip any description lines before the job title line
        if (lookAheadIndex > this.currentIndex) {
          this.currentIndex = lookAheadIndex
        }
        break
      }

      lookAheadIndex++
      if (this.isHeading(potentialLine) || this.isBullet(potentialLine)) break
    }

    // Parse the job title line
    line = jobTitleLine

    // Pattern 1: Handle pipe-separated format
    // Supports: "Job Title - Company | Location | Dates" or "Job Title | Company | Dates" or "Job Title - Company | Dates"
    if (line.includes('|')) {
      const parts = line.split('|').map(p => p.trim())

      // Part 0: Always contains job title (and possibly company)
      const firstPart = parts[0]

      // Check if first part has " - " (job title - company format)
      // Use more specific pattern to avoid splitting on hyphens in words
      if (firstPart.includes(' - ')) {
        const dashParts = firstPart.split(' - ')
        jobTitle = dashParts[0].trim()
        company = dashParts.slice(1).join(' - ').trim()
      } else if (firstPart.includes(' – ')) {
        // Handle en-dash
        const dashParts = firstPart.split(' – ')
        jobTitle = dashParts[0].trim()
        company = dashParts.slice(1).join(' – ').trim()
      } else {
        jobTitle = firstPart
      }

      // Remaining parts: Could be location and/or dates
      // Try to find dates in any remaining part
      for (let i = 1; i < parts.length; i++) {
        const part = parts[i]

        // Check if this part contains dates
        if (this.containsDate(part)) {
          const dateInfo = this.parseDateLine(part)
          if (dateInfo.startDate) {
            startDate = dateInfo.startDate
            endDate = dateInfo.endDate
            // Location might be in the same part before dates
            if (dateInfo.location) {
              location = dateInfo.location
            }
          }
        } else if (!location && part && !company) {
          // If no dates and no location yet, this might be location or company
          location = part
        } else if (!company && part && location) {
          // If we have location but no company, this might be company
          company = part
        }
      }
    } else if (line.includes(' at ')) {
      // Pattern 2: "Job Title at Company" format
      const parts = line.split(' at ')
      jobTitle = parts[0].trim()
      company = parts.slice(1).join(' at ').trim()
    } else if (line.includes(' - ') && !this.isDateRangeLine(line)) {
      // Pattern 3: "Job Title - Company" format (without pipes, dates on separate line)
      // CRITICAL: Only split on " - " if this is NOT a date range line
      const dashParts = line.split(' - ')
      jobTitle = dashParts[0].trim()
      company = dashParts.slice(1).join(' - ').trim()
    } else if (line.includes(' – ') && !this.isDateRangeLine(line)) {
      // Pattern 4: "Job Title – Company" format (en-dash)
      const dashParts = line.split(' – ')
      jobTitle = dashParts[0].trim()
      company = dashParts.slice(1).join(' – ').trim()
    } else {
      // Fallback: entire line is job title
      jobTitle = line
    }

    this.currentIndex++

    // Next line might be company (if not already parsed)
    if (this.currentIndex < this.lines.length && !company) {
      line = this.lines[this.currentIndex].trim()
      // CRITICAL: Don't split on " - " if the line looks like a full company name
      // (e.g., "Church World Service - Resettlement Support Centre, Nairobi, Kenya")
      // Only split if it's clearly "Title - Company" format
      if (line && !this.isBullet(line) && !this.isDateLine(line) && !this.looksLikeJobTitle(line)) {
        // Check if line contains " - " and might be "CompanyPart1 - CompanyPart2"
        if ((line.includes(' - ') || line.includes(' – ')) && this.looksLikeCompanyName(line)) {
          // This is a full company name with dashes (don't split it)
          company = line
        } else if (line.includes(' - ') && !this.looksLikeCompanyName(line)) {
          // This might be "Department - Organization" or similar, split it
          const parts = line.split(' - ')
          company = parts.slice(1).join(' - ').trim() || parts[0].trim()
        } else if (line.includes(' – ') && !this.looksLikeCompanyName(line)) {
          const parts = line.split(' – ')
          company = parts.slice(1).join(' – ').trim() || parts[0].trim()
        } else {
          company = line
        }
        this.currentIndex++
      }
    }

    // Next line(s) might be location and dates (if not already parsed)
    // CRITICAL: Skip blank lines to find the date line
    if (this.currentIndex < this.lines.length && !startDate) {
      // Skip up to 2 blank lines
      let dateSearchIndex = this.currentIndex
      while (dateSearchIndex < Math.min(this.currentIndex + 3, this.lines.length)) {
        line = this.lines[dateSearchIndex].trim()

        if (line && this.isDateLine(line)) {
          // Found date line!
          const dateInfo = this.parseDateLine(line)
          location = dateInfo.location
          startDate = dateInfo.startDate
          endDate = dateInfo.endDate
          this.currentIndex = dateSearchIndex + 1
          break
        }

        // Stop if we hit a bullet or new job title
        if (line && (this.isBullet(line) || this.looksLikeJobTitle(line))) {
          break
        }

        dateSearchIndex++
      }
    }

    // CRITICAL FIX: After finding dates, check if next line is company
    // Handles format: "JOB TITLE\nDates\nCompany\nDescription"
    if (this.currentIndex < this.lines.length && !company && startDate) {
      line = this.lines[this.currentIndex].trim()
      // CRITICAL: Use looksLikeCompanyName() to identify companies
      // Don't rely on !looksLikeJobTitle() because company names with dashes can look like job titles
      const isCompanyLine = line &&
        !this.isBullet(line) &&
        !this.isDateLine(line) &&
        !this.isHeading(this.lines[this.currentIndex]) &&
        (this.looksLikeCompanyName(line) || !this.looksLikeJobTitle(line))

      if (isCompanyLine) {
        company = line
        this.currentIndex++
      }
    }

    // CRITICAL: Parse position summary/description (text before bullets)
    let description = ''
    const descriptionLines: string[] = []

    while (this.currentIndex < this.lines.length) {
      const currentLine = this.lines[this.currentIndex].trim()

      // Stop at heading, bullet point, or empty line followed by bullet
      if (this.isHeading(this.lines[this.currentIndex])) break
      if (this.isBullet(currentLine)) break

      // Stop if this looks like a new job title (Title – Company format)
      // This prevents consuming next job's info as part of current job's description
      if (this.looksLikeJobTitle(currentLine)) break

      // If empty line, check if next line is a bullet or new job (end of description)
      if (!currentLine) {
        if (this.currentIndex + 1 < this.lines.length) {
          const nextLine = this.lines[this.currentIndex + 1].trim()
          if (this.isBullet(nextLine) || this.looksLikeJobTitle(nextLine)) {
            this.currentIndex++
            break
          }
        }
        this.currentIndex++
        continue
      }

      // This is part of the description
      descriptionLines.push(currentLine)
      this.currentIndex++
    }

    if (descriptionLines.length > 0) {
      description = descriptionLines.join(' ')
    }

    // Parse bullet points (achievements) - only if requested
    let achievements: BulletItem[] = []

    if (parseBullets) {
      // CRITICAL: Skip ACHIEVEMENTS header if present (it's just a label for bullets)
      if (this.currentIndex < this.lines.length) {
        const nextLine = this.lines[this.currentIndex].trim()
        if (nextLine.toUpperCase() === 'ACHIEVEMENTS') {
          this.currentIndex++ // Skip the ACHIEVEMENTS header
        }
      }

      achievements = this.parseBulletPoints()
    }

    // Must have at least job title - achievements are optional
    if (!jobTitle) {
      this.currentIndex = startIndex + 1
      return null
    }

    return {
      id: uuidv4(),
      jobTitle,
      company,
      location,
      startDate,
      endDate,
      description: description || undefined, // Only include if not empty
      achievements, // Can be empty array
    }
  }

  /**
   * Parse education section
   */
  private parseEducationContent(): ContentBlock[] {
    const blocks: ContentBlock[] = []

    while (this.currentIndex < this.lines.length) {
      if (this.isHeading(this.lines[this.currentIndex])) break

      const line = this.lines[this.currentIndex].trim()
      if (!line) {
        this.currentIndex++
        continue
      }

      const eduItem = this.parseEducationItem()
      if (eduItem) {
        blocks.push({
          id: uuidv4(),
          type: 'education_item',
          content: eduItem,
        })
      } else {
        this.currentIndex++
      }
    }

    return blocks
  }

  /**
   * Parse single education item
   */
  private parseEducationItem(): EducationItem | null {
    const startIndex = this.currentIndex

    let line = this.lines[this.currentIndex].trim()
    if (!line || this.isBullet(line)) return null

    let degree = ''
    let institution = ''
    let fieldOfStudy = ''
    let location = ''
    let graduationDate = ''
    let gpa = ''

    // CRITICAL: Check if first line is a date range (date-first format)
    // Format: "2022 - 2025" followed by "Degree - Institution"
    // This must come BEFORE treating the line as a degree name!
    if (this.looksLikeDateRangeLine(line)) {
      // This is date-first format
      const dateInfo = this.parseDateLine(line)
      graduationDate = dateInfo.endDate || dateInfo.startDate
      location = dateInfo.location
      this.currentIndex++

      // Next line should have Degree - Institution
      if (this.currentIndex < this.lines.length) {
        line = this.lines[this.currentIndex].trim()

        // Parse "Degree - Institution" or "Degree – Institution" format
        if (line.includes(' - ') || line.includes(' – ')) {
          const separator = line.includes(' – ') ? ' – ' : ' - '
          const parts = line.split(separator)
          degree = parts[0].trim()
          institution = parts.slice(1).join(separator).trim()
        } else {
          // No separator, entire line is the degree
          degree = line
        }
        this.currentIndex++

        // CRITICAL: Check if next line(s) are continuations of broken words
        // Handles cases like "British Technical" + "Education" + "al Council"
        while (this.currentIndex < this.lines.length) {
          const nextLine = this.lines[this.currentIndex].trim()

          // Skip blank lines
          if (!nextLine) {
            this.currentIndex++
            continue
          }

          // Check if this is a continuation line:
          // 1. Starts with lowercase (e.g., "al Council")
          // 2. Is a partial word that would complete the previous line (e.g., "Education" after "British Technical")
          const startsWithLowercase = /^[a-z]/.test(nextLine)
          const looksLikePartialWord = nextLine.length < 20 && !nextLine.includes(' ') && !nextLine.match(/[-–—]/)

          if ((startsWithLowercase || looksLikePartialWord) && !this.isBullet(nextLine)) {
            // This is a continuation - merge it
            if (degree && !institution) {
              // Merge with degree (e.g., "British Technical" + "Education" + "al Council")
              degree = degree + nextLine
            } else if (institution) {
              // Merge with institution
              institution = institution + ' ' + nextLine
            }

            this.currentIndex++

            // Re-check if merged line has separator
            const merged = degree
            if (merged.includes(' - ') || merged.includes(' – ')) {
              const separator = merged.includes(' – ') ? ' – ' : ' - '
              const parts = merged.split(separator)
              degree = parts[0].trim()
              institution = parts.slice(1).join(separator).trim()
            }
          } else {
            // Not a continuation line, stop merging
            break
          }
        }
      }
    } else {
      // Traditional format: Degree, Institution, Date
      degree = line
      this.currentIndex++

      // Check if degree line has "Degree - Something" format
      if (degree.includes(' - ') || degree.includes(' – ')) {
        const separator = degree.includes(' – ') ? ' – ' : ' - '
        const parts = degree.split(separator)
        const firstPart = parts[0].trim()
        const secondPart = parts.slice(1).join(separator).trim()

        // CRITICAL: Distinguish between "Degree - Institution" vs "Degree - Field of Study"
        // Check if second part is actually an institution (not a field of study)
        if (!this.looksLikeDateRangeLine(secondPart)) {
          degree = firstPart

          // If second part looks like an institution, use it as institution
          // Otherwise, treat it as field of study and keep looking for institution
          if (this.looksLikeInstitution(secondPart)) {
            institution = secondPart
          } else {
            // This is likely a field of study (e.g., "MASTER OF SCIENCE - BIG DATA TECHNOLOGIES")
            fieldOfStudy = secondPart
            // Institution should be on a later line
          }
        }
      }

      // If no institution yet, look for it on subsequent lines
      while (!institution && this.currentIndex < this.lines.length) {
        line = this.lines[this.currentIndex].trim()

        // Skip empty lines
        if (!line) {
          this.currentIndex++
          continue
        }

        // If we encounter a date line while searching for institution, capture it
        if (this.isDateLine(line) || this.looksLikeDateRangeLine(line)) {
          if (!graduationDate) {
            const dateInfo = this.parseDateLine(line)
            graduationDate = dateInfo.endDate || dateInfo.startDate
            if (!location && dateInfo.location) {
              location = dateInfo.location
            }
          }
          this.currentIndex++
          continue
        }

        // Stop at bullets or next section
        if (this.isBullet(line) || this.isHeading(this.lines[this.currentIndex])) {
          break
        }

        // CRITICAL: Check if line looks like field info (not institution)
        // Patterns like "IN COMPUTING - COMPUTING" are field info, not institutions
        const looksLikeFieldInfo =
          (line.toUpperCase().startsWith('IN ') && line.includes('-')) || // "IN COMPUTING - SOMETHING"
          (line === line.toUpperCase() && line.length < 50 && !this.looksLikeInstitution(line)) // ALL CAPS field name

        if (looksLikeFieldInfo) {
          // This is field information, store it and continue looking for institution
          if (!fieldOfStudy) {
            fieldOfStudy = line
          }
          this.currentIndex++
          continue
        }

        // This should be the institution
        if (!this.looksLikeInstitution(line)) {
          // Double-check: if it doesn't look like an institution, it might be continuation
          // of degree or other metadata. Continue searching.
          this.currentIndex++
          continue
        }

        institution = line
        this.currentIndex++
        break
      }

      // Look for date line (skip up to 2 blank lines)
      if (!graduationDate && this.currentIndex < this.lines.length) {
        let dateSearchIndex = this.currentIndex
        while (dateSearchIndex < Math.min(this.currentIndex + 3, this.lines.length)) {
          line = this.lines[dateSearchIndex].trim()

          if (line && (this.isDateLine(line) || this.looksLikeDateRangeLine(line))) {
            const dateInfo = this.parseDateLine(line)
            if (!location && dateInfo.location) {
              location = dateInfo.location
            }
            graduationDate = dateInfo.endDate || dateInfo.startDate
            this.currentIndex = dateSearchIndex + 1
            break
          }

          // Stop if we hit a bullet or what looks like a new education item
          if (line && this.isBullet(line)) {
            break
          }

          dateSearchIndex++
        }
      }
    }

    // Look for GPA
    if (this.currentIndex < this.lines.length) {
      line = this.lines[this.currentIndex].trim()
      const gpaMatch = line.match(/GPA:\s*(\d+\.\d+)/i)
      if (gpaMatch) {
        gpa = gpaMatch[1]
        this.currentIndex++
      }
    }

    // Parse any achievements/coursework bullets
    const achievements = this.parseBulletPoints()

    if (!degree && !institution) {
      this.currentIndex = startIndex + 1
      return null
    }

    return {
      id: uuidv4(),
      degree: toTitleCase(degree),  // Convert ALL CAPS to Title Case
      institution,
      fieldOfStudy: fieldOfStudy || undefined,
      location,
      graduationDate,
      gpa,
      achievements: achievements.length > 0 ? achievements : undefined,
    }
  }

  /**
   * Parse skills section
   */
  private parseSkillsContent(): ContentBlock[] {
    const blocks: ContentBlock[] = []
    let currentCategory: string | undefined
    let currentSkills: string[] = []

    // CRITICAL FIX: Join lines intelligently, then split by period delimiter
    // Only join a line to previous if it's clearly a continuation
    const rawLines: string[] = []

    while (this.currentIndex < this.lines.length) {
      if (this.isHeading(this.lines[this.currentIndex])) break

      const line = this.lines[this.currentIndex].trim()
      if (!line) {
        this.currentIndex++
        continue
      }

      // Check if line is a category (ends with colon)
      if (line.endsWith(':')) {
        // Process accumulated lines before starting new category
        if (rawLines.length > 0) {
          const joinedLines = this.joinSkillLines(rawLines)
          const skills = this.parseSkillsByDelimiter(joinedLines)
          currentSkills.push(...skills)
          rawLines.length = 0
        }

        // Save previous category group
        if (currentSkills.length > 0) {
          blocks.push({
            id: uuidv4(),
            type: 'skill_group',
            content: {
              category: currentCategory,
              skills: currentSkills,
            },
          })
        }

        currentCategory = line.slice(0, -1)
        currentSkills = []
      } else if (this.isBullet(line)) {
        // Process accumulated lines first
        if (rawLines.length > 0) {
          const joinedLines = this.joinSkillLines(rawLines)
          const skills = this.parseSkillsByDelimiter(joinedLines)
          currentSkills.push(...skills)
          rawLines.length = 0
        }

        // Bullet points are individual skills
        const skillText = line.replace(/^[-•*]\s*/, '').trim()
        if (skillText) {
          currentSkills.push(skillText)
        }
      } else {
        // Accumulate non-bullet, non-category lines
        rawLines.push(line)
      }

      this.currentIndex++
    }

    // Process any remaining accumulated lines
    if (rawLines.length > 0) {
      const joinedLines = this.joinSkillLines(rawLines)
      const skills = this.parseSkillsByDelimiter(joinedLines)
      currentSkills.push(...skills)
    }

    // Save last group
    if (currentSkills.length > 0) {
      blocks.push({
        id: uuidv4(),
        type: 'skill_group',
        content: {
          category: currentCategory,
          skills: currentSkills,
        },
      })
    }

    return blocks
  }

  /**
   * Intelligently join skill lines
   * Only join a line to previous if it's a continuation:
   * - Previous line has unbalanced parentheses AND current line starts lowercase/punctuation
   * - Current line clearly continues previous (lowercase start)
   */
  private joinSkillLines(lines: string[]): string {
    if (lines.length === 0) return ''
    if (lines.length === 1) return lines[0]

    let result = lines[0]

    for (let i = 1; i < lines.length; i++) {
      const prevLine = lines[i - 1]
      const currLine = lines[i]

      // Count parentheses in CURRENT skill only (since last period)
      // This prevents one malformed skill from polluting subsequent skills
      const lastPeriodIndex = result.lastIndexOf('.')
      const currentSkillPart = lastPeriodIndex >= 0 ? result.substring(lastPeriodIndex + 1) : result
      const openParens = (currentSkillPart.match(/\(/g) || []).length
      const closeParens = (currentSkillPart.match(/\)/g) || []).length
      const hasUnbalancedParens = openParens > closeParens

      // Check if current line looks like a continuation
      const startsLowercase = /^[a-z0-9]/.test(currLine)
      const startsWithPunctuation = /^[,;)]/.test(currLine)
      const endsWithPeriod = currLine.endsWith('.')
      const startsUppercase = /^[A-Z]/.test(currLine)

      // Count parens in current line to see if it closes the open paren
      const currOpenParens = (currLine.match(/\(/g) || []).length
      const currCloseParens = (currLine.match(/\)/g) || []).length
      const closesParenthesis = currCloseParens > currOpenParens

      // Priority logic for joining:
      // 1. If current closes paren → JOIN (completes parenthetical expression)
      // 2. If current is complete skill (uppercase + period) → NEW SKILL (even if prev has unbalanced parens)
      // 3. If starts lowercase/punctuation → JOIN (continuation)
      // 4. If prev has unbalanced parens → JOIN (continuation)
      // 5. Otherwise → NEW SKILL

      if (closesParenthesis) {
        // Priority 1: Closes parenthesis - must be continuation
        result += ' ' + currLine
      } else if (startsUppercase && endsWithPeriod && currLine.length > 5) {
        // Priority 2: Complete new skill (uppercase + period)
        // This is a NEW skill even if previous has unbalanced parens
        if (!result.endsWith('.')) {
          result += '. '
        } else {
          result += ' '
        }
        result += currLine
      } else if (startsLowercase || startsWithPunctuation) {
        // Priority 3: Starts lowercase/punctuation - continuation
        result += ' ' + currLine
      } else if (hasUnbalancedParens) {
        // Priority 4: Previous has unbalanced parens - probably continuation
        result += ' ' + currLine
      } else {
        // Priority 5: Otherwise, it's a new skill
        if (!result.endsWith('.')) {
          result += '. '
        } else {
          result += ' '
        }
        result += currLine
      }
    }

    return result
  }

  /**
   * Parse skills by delimiter
   * Skills are period-delimited, but periods are optional
   * Strategy: Split on periods first, then check each part for completeness
   */
  private parseSkillsByDelimiter(text: string): string[] {
    const skills: string[] = []

    // Split on period - each period indicates end of a skill
    const periodParts = text.split(/\.(?=\s|$)/) // Split on period followed by space or end

    for (const part of periodParts) {
      const trimmed = part.trim()
      if (!trimmed) continue

      // Check if parentheses are balanced - if not, this is incomplete
      const openParens = (trimmed.match(/\(/g) || []).length
      const closeParens = (trimmed.match(/\)/g) || []).length

      if (openParens === closeParens) {
        // Balanced parentheses = complete skill
        skills.push(trimmed)
      } else {
        // Unbalanced - this shouldn't happen after our line-joining logic
        // But if it does, still add it (better than losing data)
        console.warn('[Parser] Warning: Unbalanced parentheses in skill:', trimmed.substring(0, 50))
        skills.push(trimmed)
      }
    }

    return skills
  }

  /**
   * Parse languages section
   * Handles formats like "English, IELTS 8.0 / CLB 9" or bullet lists
   */
  private parseLanguagesContent(): ContentBlock[] {
    const blocks: ContentBlock[] = []
    const textLines: string[] = []

    while (this.currentIndex < this.lines.length) {
      const currentLine = this.lines[this.currentIndex]

      // Stop at next section heading
      if (this.isHeading(currentLine)) {
        break
      }

      const line = currentLine.trim()
      if (line) {
        textLines.push(line)
      }

      this.currentIndex++
    }

    // If we have content, create a text block
    if (textLines.length > 0) {
      blocks.push({
        id: uuidv4(),
        type: 'text',
        content: textLines.join(' '),
      })
    }

    return blocks
  }

  /**
   * Parse certifications section
   * Handles various formats: bullet points, period-separated items, or plain text
   */
  private parseCertificationsContent(): ContentBlock[] {
    const blocks: ContentBlock[] = []
    const certifications: string[] = []

    while (this.currentIndex < this.lines.length) {
      if (this.isHeading(this.lines[this.currentIndex])) break

      const line = this.lines[this.currentIndex].trim()

      // Skip empty lines
      if (!line) {
        this.currentIndex++
        continue
      }

      // Handle bullet points
      if (this.isBullet(line)) {
        const certName = line.replace(/^[-•*]\s*/, '').trim()
        if (certName) {
          certifications.push(certName)
        }
        this.currentIndex++
        continue
      }

      // Handle period-separated certifications (e.g., "AWS Practitioner.")
      // Each line ending with period is treated as a separate certification
      if (line.endsWith('.')) {
        const certName = line.replace(/\.$/, '').trim()
        if (certName) {
          certifications.push(certName)
        }
        this.currentIndex++
        continue
      }

      // Handle lines without periods
      // CRITICAL: Only join lines if they're clearly continuations (lowercase start or short fragments)
      let certName = line
      this.currentIndex++

      // Check if next line is a continuation
      while (this.currentIndex < this.lines.length) {
        const nextLine = this.lines[this.currentIndex].trim()

        // Stop conditions
        if (!nextLine || this.isHeading(this.lines[this.currentIndex]) || this.isBullet(nextLine)) {
          break
        }

        // Only join if next line is clearly a continuation:
        // 1. Starts with lowercase (continuation word)
        // 2. Starts with "(" (clarification)
        // 3. Is a very short fragment (< 20 chars) that looks incomplete
        // 4. Previous line ends with "Certified" or "pursuing" AND next line is a certification level
        const prevEndsWithCertified = /\b(Certified|pursuing|Cloud|Certified AWS|Certified Azure)\s*$/i.test(certName)
        const nextIsCertLevel = /^(Solutions Architect|Cloud Practitioner|Developer|SysOps|Administrator|Associate|Professional|Fundamentals|Foundation|Specialist)/i.test(nextLine)

        const isContinuation =
          /^[a-z(]/.test(nextLine) ||  // Starts lowercase or with paren
          (nextLine.length < 20 && !/^(AWS|Azure|CCNA|CCNP|CCDA|MCSA|MCSE|ITIL|Red Hat|Siemon|User|Network)/.test(nextLine)) ||
          (prevEndsWithCertified && nextIsCertLevel)  // Certification level continuation

        // If it doesn't look like a continuation, treat current as complete and don't join
        if (!isContinuation) {
          break
        }

        // Join the continuation
        if (nextLine.endsWith('.')) {
          certName += ' ' + nextLine.replace(/\.$/, '').trim()
          this.currentIndex++
          break
        } else {
          certName += ' ' + nextLine
          this.currentIndex++
        }
      }

      if (certName.trim()) {
        certifications.push(certName.trim())
      }
    }

    // Create certification items
    certifications.forEach(cert => {
      blocks.push({
        id: uuidv4(),
        type: 'certification_item',
        content: {
          id: uuidv4(),
          name: cert,
          issuer: undefined,
          date: undefined,
          expiryDate: undefined,
          credentialId: undefined,
        },
      })
    })

    return blocks
  }

  /**
   * Parse text content (for summary, objective, etc.)
   */
  private parseTextContent(): ContentBlock[] {
    const blocks: ContentBlock[] = []
    const textLines: string[] = []

    while (this.currentIndex < this.lines.length) {
      if (this.isHeading(this.lines[this.currentIndex])) break

      const line = this.lines[this.currentIndex].trim()

      // CRITICAL: Stop at bullets (don't capture them)
      // This prevents orphaned achievement bullets from being captured
      if (line && this.isBullet(line)) {
        break
      }

      // CRITICAL: Stop at "Achievements" heading even if not recognized as section
      // This prevents orphaned "Achievements" sections from being captured
      if (line.toLowerCase() === 'achievements' || line.toLowerCase().startsWith('achievement')) {
        break
      }

      if (line) {
        textLines.push(line)
      }

      this.currentIndex++
    }

    if (textLines.length > 0) {
      blocks.push({
        id: uuidv4(),
        type: 'text',
        content: textLines.join(' '),
      })
    }

    return blocks
  }

  /**
   * Parse generic section content (bullets or text)
   */
  private parseGenericContent(): ContentBlock[] {
    const blocks: ContentBlock[] = []

    // Check if content contains bullets
    const hasBullets = this.lines
      .slice(this.currentIndex)
      .some(line => this.isBullet(line) && !this.isHeading(line))

    if (hasBullets) {
      const bullets = this.parseBulletPoints()
      if (bullets.length > 0) {
        blocks.push({
          id: uuidv4(),
          type: 'bullet_list',
          content: {
            items: bullets,
          },
        })
      }
    } else {
      // Parse as text
      const textLines: string[] = []
      while (this.currentIndex < this.lines.length) {
        const currentLine = this.lines[this.currentIndex]
        if (this.isHeading(currentLine)) {
          console.log(`[Parser] ⛔ Stopping generic content parse - detected heading: "${currentLine.trim().substring(0, 60)}"`)
          break
        }
        const line = currentLine.trim()
        if (line) textLines.push(line)
        this.currentIndex++
      }

      if (textLines.length > 0) {
        blocks.push({
          id: uuidv4(),
          type: 'text',
          content: textLines.join(' '),
        })
      }
    }

    return blocks
  }

  /**
   * Parse bullet points
   */
  private parseBulletPoints(): BulletItem[] {
    const bullets: BulletItem[] = []

    while (this.currentIndex < this.lines.length) {
      const line = this.lines[this.currentIndex]

      if (this.isHeading(line)) break
      if (!line.trim()) {
        this.currentIndex++
        continue
      }

      if (this.isBullet(line.trim())) {
        const text = line.trim().replace(/^[-•*]\s*/, '')
        bullets.push({
          id: uuidv4(),
          text,
          metadata: {
            indentLevel: this.getIndentLevel(line),
            originalText: text,
          },
        })
        this.currentIndex++
      } else {
        break
      }
    }

    return bullets
  }

  /**
   * Check if line is a bullet point
   */
  private isBullet(line: string): boolean {
    return /^[-•*]\s+/.test(line.trim())
  }

  /**
   * Get indent level
   */
  private getIndentLevel(line: string): number {
    const match = line.match(/^(\s*)/)
    return match ? Math.floor(match[1].length / 2) : 0
  }

  /**
   * Check if line contains date information
   */
  private isDateLine(line: string): boolean {
    // CRITICAL: Must match actual DATE RANGES, not just presence of years/months
    // Previously matched "May Corporation" or "2020 Technologies" as date lines!
    //
    // Matches patterns like:
    // Jan 2020 - Present (date range)
    // 2018 - 2020 (date range)
    // January 2020 - December 2020 (date range)
    // San Francisco, CA | Jan 2020 - Present (date range with location)
    // July 2025 (single date - start date only, ongoing position)
    //
    // Does NOT match:
    // May Corporation (just a word that happens to be a month name)
    // 2020 Technologies (year in company name)

    // Check for date range pattern: date-like content, separator (-, –, —, ‐), date-like content
    // CRITICAL: Include \u2010 (hyphen), \u2013 (en-dash), \u2014 (em-dash), and regular hyphen
    const hasDateRange = /(\d{4}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s*\d{4})\s*[-–—‐\u2010-\u2014]\s*(\d{4}|Present|Current|Now|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s*\d{4})/i.test(line)

    // CRITICAL FIX: Also accept single dates (Month Year format) for ongoing positions
    // But make sure it's ONLY the date on the line, not part of other text
    // Match: "July 2025" or "Jan 2024" when it's the whole line
    const isSingleDate = /^\s*(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{4}\s*$/i.test(line)

    return hasDateRange || isSingleDate
  }

  /**
   * Parse date line to extract location and dates
   */
  private parseDateLine(line: string): {
    location: string
    startDate: string
    endDate: string | 'Present'
  } {
    let location = ''
    let startDate = ''
    let endDate: string | 'Present' = ''

    // Split by pipe or multiple spaces
    const parts = line.split(/\s*\|\s*|\s{2,}/)

    for (const part of parts) {
      // Check if part contains dates
      if (/\d{4}|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|Present/i.test(part)) {
        // Parse date range - CRITICAL: Include all dash variants (\u2010-\u2014)
        const dateMatch = part.match(/(.+?)\s*[-–—‐\u2010-\u2014]\s*(.+)/)
        if (dateMatch) {
          startDate = dateMatch[1].trim()
          endDate = dateMatch[2].trim() === 'Present' ? 'Present' : dateMatch[2].trim()
        } else {
          startDate = part.trim()
        }
      } else if (part.trim()) {
        // Assume it's location
        location = part.trim()
      }
    }

    return { location, startDate, endDate }
  }

  /**
   * Detect capitalization style
   */
  private detectCapitalization(text: string): 'normal' | 'uppercase' | 'lowercase' | 'title' {
    if (text === text.toUpperCase()) return 'uppercase'
    if (text === text.toLowerCase()) return 'lowercase'
    if (text.split(' ').every(word => word[0] === word[0].toUpperCase())) return 'title'
    return 'normal'
  }

  /**
   * Helper: Check if text is email
   */
  private isEmail(text: string): boolean {
    return /^[\w.+-]+@[\w.-]+\.\w{2,}$/.test(text.trim())
  }

  /**
   * Helper: Check if text is phone (worldwide format)
   */
  private isPhone(text: string): boolean {
    const trimmed = text.trim()
    const match = trimmed.match(/^(\+\d{1,4}[\s.-]?)?(\(?\d{1,4}\)?[\s.-]?){2,5}\d{1,4}$/)
    return match !== null && trimmed.replace(/\D/g, '').length >= 7
  }

  /**
   * Helper: Check if line is a date range only (job entry with just dates)
   * Examples: "MAY 2008 — MAY 2011", "JANUARY 2005 — MAY 2008"
   */
  private isDateRangeLine(text: string): boolean {
    const trimmed = text.trim()

    // Check for month year — month year pattern
    // CRITICAL: Include all dash variants (\u2010-\u2014)
    const dateRangePattern = /^(JAN(?:UARY)?|FEB(?:RUARY)?|MAR(?:CH)?|APR(?:IL)?|MAY|JUN(?:E)?|JUL(?:Y)?|AUG(?:UST)?|SEP(?:TEMBER)?|OCT(?:OBER)?|NOV(?:EMBER)?|DEC(?:EMBER)?)[A-Z]*\.?\s+\d{4}\s*[-–—‐\u2010-\u2014]\s*(JAN(?:UARY)?|FEB(?:RUARY)?|MAR(?:CH)?|APR(?:IL)?|MAY|JUN(?:E)?|JUL(?:Y)?|AUG(?:UST)?|SEP(?:TEMBER)?|OCT(?:OBER)?|NOV(?:EMBER)?|DEC(?:EMBER)?)[A-Z]*\.?\s+\d{4}\s*$/i

    return dateRangePattern.test(trimmed)
  }

  /**
   * Helper: Check if line looks like a date range (more flexible than isDateRangeLine)
   * Matches: "Jan 2024 - Present", "2018 - 2020", "January 2005 — MAY 2008"
   * Does NOT match: "Regional Head of Client Services & Projects - Echotel International"
   *
   * Strategy: If the line has date content and a separator, check if most of the content
   * is dates/years/Present/Current (not job titles or company names)
   */
  private looksLikeDateRangeLine(text: string): boolean {
    const trimmed = text.trim()

    // Must have a separator - CRITICAL: Include all dash variants
    if (!(/[-–—‐\u2010-\u2014]/.test(trimmed))) return false

    // Pattern 1: Month Year - Month Year (e.g., "Jan 2024 - Dec 2024")
    if (/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{4}\s*[-–—‐\u2010-\u2014]\s*(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{4}\s*$/i.test(trimmed)) {
      return true
    }

    // Pattern 2: Month Year - Present/Current (e.g., "Jan 2024 - Present")
    if (/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{4}\s*[-–—‐\u2010-\u2014]\s*(Present|Current|Now)\s*$/i.test(trimmed)) {
      return true
    }

    // Pattern 3: Year - Year (e.g., "2018 - 2020")
    if (/^\d{4}\s*[-–—‐\u2010-\u2014]\s*\d{4}\s*$/i.test(trimmed)) {
      return true
    }

    // Pattern 4: Year - Present (e.g., "2020 - Present")
    if (/^\d{4}\s*[-–—‐\u2010-\u2014]\s*(Present|Current|Now)\s*$/i.test(trimmed)) {
      return true
    }

    return false
  }

  /**
   * Helper: Split skills by comma while preserving content in parentheses
   * Example: "Cloud Computing (AWS, Azure)" stays as one skill
   */
  private splitSkills(text: string): string[] {
    const skills: string[] = []
    let current = ''
    let parenDepth = 0

    for (let i = 0; i < text.length; i++) {
      const char = text[i]

      if (char === '(') {
        parenDepth++
        current += char
      } else if (char === ')') {
        parenDepth--
        current += char
      } else if ((char === ',' || char === ';') && parenDepth === 0) {
        // Only split on comma/semicolon if not inside parentheses
        const trimmed = current.trim()
        if (trimmed) skills.push(trimmed)
        current = ''
      } else {
        current += char
      }
    }

    // Add the last skill
    const trimmed = current.trim()
    if (trimmed) skills.push(trimmed)

    return skills
  }

  /**
   * Helper: Check if line looks like a job title
   * Detects patterns like "Job Title – Company Name"
   */
  private looksLikeJobTitle(text: string): boolean {
    const trimmed = text.trim()

    // Must contain a dash or em dash separating title and company
    if (!trimmed.includes('–') && !trimmed.includes('-')) return false

    // Should not be a date line
    if (this.isDateLine(trimmed)) return false

    // Should not be a bullet point
    if (this.isBullet(trimmed)) return false

    // Should have reasonable length for a job title (not too short, not too long)
    if (trimmed.length < 10 || trimmed.length > 150) return false

    // CRITICAL FIX: Reject lines ending with periods (likely sentences/descriptions)
    if (trimmed.endsWith('.')) return false

    // CRITICAL FIX: Reject lines starting with lowercase (not proper job titles)
    if (/^[a-z]/.test(trimmed)) return false

    // CRITICAL FIX: Reject lines with too many commas (likely lists, not titles)
    const commaCount = (trimmed.match(/,/g) || []).length
    if (commaCount >= 3) return false

    // CRITICAL FIX: Reject if this looks like technical jargon or acronyms list
    // (e.g., "ICDL, A+, N+, CCNA, CCNP...")
    const hasMultiplePlusOrAcronyms = /[A-Z]\+.*[A-Z]\+|[A-Z]{2,}\s*,\s*[A-Z]{2,}/.test(trimmed)
    if (hasMultiplePlusOrAcronyms) return false

    // Check for common job title patterns
    // Typically has title case or mixed case (not all lowercase, not all uppercase)
    const hasUpperCase = /[A-Z]/.test(trimmed)
    const hasLowerCase = /[a-z]/.test(trimmed)

    return hasUpperCase && hasLowerCase
  }

  /**
   * Check if text looks like an achievement description (vs a job title)
   * Used to identify non-bulleted achievement text
   */
  private looksLikeAchievementText(text: string): boolean {
    const trimmed = text.trim()

    // Must have reasonable length
    if (trimmed.length < 10) return false

    // Achievement text characteristics:
    // 1. NOT all caps (job titles are typically ALL CAPS in resumes)
    // 2. Usually ends with period
    // 3. Often starts with action verbs or descriptive text
    // 4. Contains mixed case

    const isAllCaps = trimmed === trimmed.toUpperCase() && /[A-Z]/.test(trimmed)
    if (isAllCaps) return false // Job titles are all caps

    // Check if starts with common achievement patterns
    const achievementStarters = /^(Deployment|Implementation|Currently|Deployed|Seconded|Successfully|Introduced|Supported|Managed|Led|Developed|Responsible|Interfaced|Assessed|Migrat|Oversee|Achiev|Improv)/i
    const startsLikeAchievement = achievementStarters.test(trimmed)

    // Check if ends with period (achievement descriptions usually do)
    const endsWithPeriod = trimmed.endsWith('.')

    // If it looks like achievement start OR ends with period, likely an achievement
    return startsLikeAchievement || endsWithPeriod
  }

  /**
   * Check if text looks like a company name
   */
  private looksLikeCompanyName(text: string): boolean {
    const trimmed = text.trim()

    // Company names often have:
    // - Location (city, country) with comma
    // - Mixed case (not all uppercase or all lowercase)
    // - Reasonable length

    if (trimmed.length < 5) return false

    // Check for location indicators
    const hasLocation = trimmed.includes(',')

    // Check for mixed case
    const hasUpperCase = /[A-Z]/.test(trimmed)
    const hasLowerCase = /[a-z]/.test(trimmed)
    const hasMixedCase = hasUpperCase && hasLowerCase

    // Check for company keywords
    const companyKeywords = ['ltd', 'inc', 'llc', 'corporation', 'company', 'service', 'bank', 'group', 'centre', 'center']
    const hasCompanyKeyword = companyKeywords.some(keyword => trimmed.toLowerCase().includes(keyword))

    return (hasLocation && hasMixedCase) || hasCompanyKeyword
  }

  /**
   * Check if text looks like an educational institution (vs field of study)
   */
  private looksLikeInstitution(text: string): boolean {
    const trimmed = text.trim().toLowerCase()

    // Institution keywords
    const institutionKeywords = [
      'university', 'college', 'institute', 'school', 'centre', 'center',
      'academy', 'polytechnic', 'conservatory', 'seminary'
    ]

    // Check if contains institution keywords
    if (institutionKeywords.some(keyword => trimmed.includes(keyword))) {
      return true
    }

    // Check if contains location indicators (countries, cities)
    const locationKeywords = [
      'united kingdom', 'uk', 'usa', 'united states', 'canada', 'kenya',
      'nairobi', 'london', 'new york', 'toronto', 'singapore'
    ]

    if (locationKeywords.some(keyword => trimmed.includes(keyword))) {
      return true
    }

    // Check if contains comma (institutions often have "Name, Location")
    // But field of study rarely has commas
    if (trimmed.includes(',')) {
      return true
    }

    return false
  }
}

/**
 * Main export function
 */
export function parseResumeStructure(plainText: string): StructuredResume {
  const parser = new ResumeStructureParser(plainText)
  return parser.parse()
}
