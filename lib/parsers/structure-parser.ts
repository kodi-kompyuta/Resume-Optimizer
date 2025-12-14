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
 * Parses plain text resume into structured format
 * Preserves all sections, bullets, and formatting metadata
 */
export class ResumeStructureParser {
  private lines: string[]
  private currentIndex: number = 0

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

    const wordCount = this.plainText.split(/\s+/).filter(w => w.length > 0).length

    return {
      metadata: {
        parsedAt: new Date().toISOString(),
        wordCount,
      },
      sections,
      rawText: this.plainText,
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

    // Look at first 10 lines for contact info
    const maxLines = Math.min(10, this.lines.length)
    let lastContactLine = -1

    for (let i = 0; i < maxLines; i++) {
      const line = this.lines[i].trim()
      if (!line) continue

      // Name is usually the first non-empty line, often in all caps or title case
      // Skip section headings like "CONTACT INFORMATION"
      if (!name && line.length < 50 && !this.isEmail(line) && !this.isPhone(line) && !this.isHeading(line)) {
        name = line
        contactInfo.name = line
        foundContact = true
        lastContactLine = i
        continue
      }

      // Email
      const emailMatch = line.match(/\b[\w.+-]+@[\w.-]+\.\w{2,}\b/i)
      if (emailMatch) {
        contactInfo.email = emailMatch[0]
        foundContact = true
        lastContactLine = i
      }

      // Phone - flexible pattern for worldwide phone numbers (any format)
      // Matches: +254723727791, +44 20 7946 0958, (555) 123-4567, etc.
      const phoneMatch = line.match(/(\+\d{1,4}[\s.-]?)?(\(?\d{1,4}\)?[\s.-]?){2,5}\d{1,4}/)
      if (phoneMatch && phoneMatch[0].replace(/\D/g, '').length >= 7) {
        // Ensure it has at least 7 digits (minimum valid phone number)
        contactInfo.phone = phoneMatch[0]
        foundContact = true
        lastContactLine = i
      }

      // LinkedIn
      if (line.toLowerCase().includes('linkedin.com/')) {
        const match = line.match(/linkedin\.com\/in\/[\w-]+/)
        contactInfo.linkedin = match ? match[0] : line
        foundContact = true
        lastContactLine = i
      }

      // GitHub
      if (line.toLowerCase().includes('github.com/')) {
        const match = line.match(/github\.com\/[\w-]+/)
        contactInfo.github = match ? match[0] : line
        foundContact = true
        lastContactLine = i
      }

      // Location (city, state/country format)
      if (line.match(/^[\w\s]+,\s*[\w\s]{2,}$/)) {
        contactInfo.location = line
        foundContact = true
        lastContactLine = i
      }
    }

    if (!foundContact) return null

    contentBlocks.push({
      id: uuidv4(),
      type: 'contact_info',
      content: contactInfo,
    })

    // Move index past contact section
    this.currentIndex = lastContactLine + 1

    return {
      id: uuidv4(),
      type: 'contact',
      heading: 'Contact Information',
      order: 0,
      content: contentBlocks,
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

    // Headings are usually:
    // 1. All caps (EXPERIENCE, EDUCATION)
    // 2. Short (< 50 chars)
    // 3. Not starting with bullet points or numbers
    // 4. Common section names

    if (trimmed.length === 0 || trimmed.length > 50) return false
    if (/^[-•*\d]/.test(trimmed)) return false

    const isAllCaps = trimmed === trimmed.toUpperCase() && /[A-Z]/.test(trimmed)
    const isCommonSection = this.isCommonSectionName(trimmed)

    return isAllCaps || isCommonSection
  }

  /**
   * Check if text is a common section name
   * Must be exact match or very close match to avoid false positives
   */
  private isCommonSectionName(text: string): boolean {
    const normalized = text.toLowerCase().trim()
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
      'achievements',
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
      case 'summary':
      case 'objective':
        return this.parseTextContent()
      default:
        return this.parseGenericContent()
    }
  }

  /**
   * Parse experience section content
   */
  private parseExperienceContent(): ContentBlock[] {
    const blocks: ContentBlock[] = []
    let currentExperience: ExperienceItem | null = null
    let achievementBuffer: BulletItem[] = []

    while (this.currentIndex < this.lines.length) {
      const line = this.lines[this.currentIndex].trim()

      // Stop at next major section heading (not ACHIEVEMENTS)
      if (this.isHeading(this.lines[this.currentIndex]) && line.toUpperCase() !== 'ACHIEVEMENTS') {
        // Save any pending experience
        if (currentExperience && achievementBuffer.length > 0) {
          currentExperience.achievements = achievementBuffer
          blocks.push({
            id: uuidv4(),
            type: 'experience_item',
            content: currentExperience,
          })
        }
        break
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

      if (hasDatePattern && (potentialLine.includes('|') || potentialLine.includes('–') || potentialLine.includes('-'))) {
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

    // Pattern 1: "Job Title - Company | Dates" or "Job Title | Company Dates"
    if (line.includes('|')) {
      const parts = line.split('|').map(p => p.trim())
      const leftPart = parts[0] // Could be "Job Title - Company" or just "Job Title"
      const rightPart = parts[1] // Could be "Dates" or "Company Dates"

      // Check if left part has a dash (Job Title - Company)
      if (leftPart.includes('–') || leftPart.includes('-')) {
        const titleCompanyParts = leftPart.split(/\s*[–-]\s*/)
        jobTitle = titleCompanyParts[0].trim()
        company = titleCompanyParts.slice(1).join(' - ').trim()
      } else {
        jobTitle = leftPart
      }

      // Extract dates from right part
      const dateInfo = this.parseDateLine(rightPart)
      location = dateInfo.location
      startDate = dateInfo.startDate
      endDate = dateInfo.endDate

      // If company not found yet, check right part
      if (!company && rightPart && !startDate) {
        company = rightPart.split(/\s+\d{4}/).shift()?.trim() || ''
      }
    } else if (line.includes(' at ')) {
      const parts = line.split(' at ')
      jobTitle = parts[0].trim()
      company = parts.slice(1).join(' at ').trim()
    } else {
      jobTitle = line
    }

    this.currentIndex++

    // Next line might be company (if not already parsed)
    if (this.currentIndex < this.lines.length && !company) {
      line = this.lines[this.currentIndex].trim()
      if (line && !this.isBullet(line) && !this.isDateLine(line) && !this.looksLikeJobTitle(line)) {
        company = line
        this.currentIndex++
      }
    }

    // Next line might be location and dates (if not already parsed)
    if (this.currentIndex < this.lines.length && !startDate) {
      line = this.lines[this.currentIndex].trim()
      if (line && this.isDateLine(line)) {
        const dateInfo = this.parseDateLine(line)
        location = dateInfo.location
        startDate = dateInfo.startDate
        endDate = dateInfo.endDate
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

    // First line: Degree or Institution
    let line = this.lines[this.currentIndex].trim()
    if (!line || this.isBullet(line)) return null

    let degree = line
    let institution = ''
    let location = ''
    let graduationDate = ''
    let gpa = ''

    this.currentIndex++

    // Next line might be institution
    if (this.currentIndex < this.lines.length) {
      line = this.lines[this.currentIndex].trim()
      if (line && !this.isBullet(line) && !this.isDateLine(line)) {
        institution = line
        this.currentIndex++
      }
    }

    // Look for date and location
    if (this.currentIndex < this.lines.length) {
      line = this.lines[this.currentIndex].trim()
      if (line && this.isDateLine(line)) {
        const dateInfo = this.parseDateLine(line)
        location = dateInfo.location
        graduationDate = dateInfo.endDate || dateInfo.startDate
        this.currentIndex++
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
      degree,
      institution,
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

    while (this.currentIndex < this.lines.length) {
      if (this.isHeading(this.lines[this.currentIndex])) break

      const line = this.lines[this.currentIndex].trim()
      if (!line) {
        this.currentIndex++
        continue
      }

      // Check if line is a category (ends with colon)
      if (line.endsWith(':')) {
        // Save previous group
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
      } else {
        // Parse skills from line (comma or bullet separated)
        const skills = this.isBullet(line)
          ? [line.replace(/^[-•*]\s*/, '')]
          : this.splitSkills(line)

        currentSkills.push(...skills)
      }

      this.currentIndex++
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
   * Parse text content (for summary, objective, etc.)
   */
  private parseTextContent(): ContentBlock[] {
    const blocks: ContentBlock[] = []
    const textLines: string[] = []

    while (this.currentIndex < this.lines.length) {
      if (this.isHeading(this.lines[this.currentIndex])) break

      const line = this.lines[this.currentIndex].trim()
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
        if (this.isHeading(this.lines[this.currentIndex])) break
        const line = this.lines[this.currentIndex].trim()
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
    // Matches patterns like:
    // Jan 2020 - Present
    // 2018 - 2020
    // January 2020 - December 2020
    // San Francisco, CA | Jan 2020 - Present
    return /\d{4}|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|Present/i.test(line)
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
        // Parse date range
        const dateMatch = part.match(/(.+?)\s*[-–—]\s*(.+)/)
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

    // Check for common job title patterns
    // Typically has title case or mixed case (not all lowercase, not all uppercase)
    const hasUpperCase = /[A-Z]/.test(trimmed)
    const hasLowerCase = /[a-z]/.test(trimmed)

    return hasUpperCase && hasLowerCase
  }
}

/**
 * Main export function
 */
export function parseResumeStructure(plainText: string): StructuredResume {
  const parser = new ResumeStructureParser(plainText)
  return parser.parse()
}
