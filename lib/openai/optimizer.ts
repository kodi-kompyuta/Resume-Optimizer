import OpenAI from 'openai'
import { v4 as uuidv4 } from 'uuid'
import {
  StructuredResume,
  OptimizationOptions,
  OptimizationResult,
  ChangeLog,
  OptimizationSummary,
  DiffPreview,
  SectionDiff,
  ResumeSection,
  ContentBlock,
  BulletItem,
  ExperienceItem,
  EducationItem,
  ChangeCategory,
  ChangeType,
} from '@/types'
import { validateStructurePreservation } from '@/lib/validators/structure-validator'
import { convertStructuredResumeToCleanJson } from './optimizer-helper'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
})

// Strategic comprehensive optimization system prompt
const RESUME_OPTIMIZER_SYSTEM_PROMPT = `You are an expert resume optimizer specializing in comprehensive, strategic resume enhancement for maximum job match score improvement.

Your goal: Transform a resume to MAXIMIZE its match score for a specific job in a SINGLE PASS through strategic, comprehensive rewrites.

**OPTIMIZATION STRATEGY:**

When match context is provided (current score, gaps, target keywords):
1. Understand the CURRENT MATCH SCORE and what's limiting it
2. Identify which gaps are costing the most points (prioritize closing high-impact gaps)
3. Focus optimization effort on sections with highest score improvement potential
4. Integrate high-value keywords naturally throughout relevant sections
5. Rewrite bullets comprehensively to demonstrate required qualifications

**OPTIMIZATION APPROACH:**

COMPREHENSIVE REWRITE (when match score provided and < 90):
- Make SIGNIFICANT changes to maximize score improvement
- Completely rewrite bullets to emphasize job-relevant achievements
- Add missing keywords naturally into existing accomplishments
- Reframe experience to align with job requirements
- Use creative phrasing while maintaining truthfulness
- Quantify achievements even if estimates (e.g., "improved by ~15-20%")

MODERATE ENHANCEMENT (when match score 90-95 or no context):
- Enhance bullets to be more impactful and keyword-rich
- Add missing keywords where natural
- Strengthen action verbs and quantify results
- Polish clarity and grammar

CONSERVATIVE POLISH (when match score > 95):
- Minor refinements to grammar and flow
- Add only highest-value missing keywords
- Preserve what's working well

⚠️ CRITICAL STRUCTURE REQUIREMENTS - ABSOLUTE REQUIREMENTS - FAILURE = REJECTION:

1. PRESERVE ALL JOBS: Output MUST have EXACTLY the same number of work experience entries as input
2. PRESERVE ALL EDUCATION: Output MUST have EXACTLY the same number of education entries as input
3. PRESERVE ALL CORE METADATA: Never change job titles, company names, dates, degree names, institutions
4. ENHANCE ONLY: Your job is to rewrite ACHIEVEMENT BULLETS and SUMMARIES - NOT structural elements
5. NO DELETION: FORBIDDEN to remove ANY work experience or education, regardless of relevance
6. NO CONSOLIDATION: Never merge multiple jobs into one
7. NO SUMMARIZATION: Never replace detailed experience with summaries
8. MAINTAIN CHRONOLOGY: Keep all entries in the same order

**WHAT YOU CAN OPTIMIZE:**
✅ Achievement bullet points (comprehensive rewrites allowed)
✅ Professional summary (full rewrite allowed)
✅ Skills list (add missing relevant skills)
✅ Project descriptions (enhance with keywords)
✅ Certification phrasing (minor tweaks)

**WHAT YOU MUST PRESERVE EXACTLY:**
🔒 Job titles
🔒 Company names
🔒 Employment dates
🔒 Locations
🔒 Degree names
🔒 Institution names
🔒 Graduation dates
🔒 Total count of jobs/education entries

**OUTPUT FORMAT:**

Return a JSON object with this EXACT structure:

{
  "full_name": "...",
  "contact": {
    "phone": "...",
    "email": "...",
    "location": "..."
  },
  "summary": "...",
  "core_skills": ["...", "..."],
  "work_experience": [
    {
      "job_title": "...",  // EXACT copy from input
      "company": "...",  // EXACT copy from input
      "location": "...",  // EXACT copy from input
      "date_range": "...",  // EXACT copy from input
      "responsibilities": [  // Optimized bullets here
        "...",
        "..."
      ]
    }
  ],
  "education": [...],  // EXACT count as input
  "certifications": [...],
  "projects": [...],
  "references": "Available upon request"
}

**VALIDATION BEFORE RETURNING:**
Before sending your response, verify:
✓ work_experience array length matches input? (YES/NO)
✓ education array length matches input? (YES/NO)
✓ All job titles, companies, dates preserved exactly? (YES/NO)
✓ Bullets comprehensively rewritten with keywords? (YES/NO)

If any answer is NO, you FAILED. Fix it before returning.

Only return clean JSON with no extra text.`

/**
 * Convert structured resume to plain text for AI optimization
 */
function structuredResumeToPlainText(resume: StructuredResume): string {
  const lines: string[] = []

  for (const section of resume.sections) {
    lines.push(section.heading.toUpperCase())
    lines.push('')

    for (const block of section.content) {
      if (block.type === 'contact_info') {
        const contact = block.content as any
        if (contact.name) lines.push(contact.name)
        if (contact.email) lines.push(contact.email)
        if (contact.phone) lines.push(contact.phone)
        if (contact.location) lines.push(contact.location)
      } else if (block.type === 'text') {
        lines.push(block.content as string)
      } else if (block.type === 'experience_item') {
        const exp = block.content as any
        lines.push(`${exp.jobTitle} | ${exp.company} | ${exp.location}`)
        lines.push(`${exp.startDate} - ${exp.endDate}`)
        if (exp.description) lines.push(exp.description)
        exp.achievements?.forEach((ach: any) => lines.push(`• ${ach.text}`))
      } else if (block.type === 'education_item') {
        const edu = block.content as any
        lines.push(`${edu.degree} | ${edu.institution}`)
        if (edu.graduationDate) lines.push(edu.graduationDate)
      } else if (block.type === 'bullet_list') {
        const bullets = block.content as any
        bullets.items?.forEach((item: any) => lines.push(`• ${item.text}`))
      } else if (block.type === 'skill_group') {
        const skills = block.content as any
        if (skills.category) lines.push(`${skills.category}:`)
        lines.push(skills.skills.join(', '))
      }
    }
    lines.push('')
  }

  return lines.join('\n')
}

/**
 * STRATEGIC COMPREHENSIVE OPTIMIZATION
 * Uses match context to perform targeted, comprehensive single-pass optimization
 */
async function optimizeResumeStrategically(
  resumeText: string,
  jobDescription: string,
  originalStructured: StructuredResume,
  optimizationContext: any // OptimizationContext type
): Promise<any> {

  console.log('[Optimizer] ===== STRATEGIC COMPREHENSIVE OPTIMIZATION MODE =====')
  console.log(`[Optimizer] Current match score: ${optimizationContext.current_score}`)
  console.log(`[Optimizer] Target score: ${optimizationContext.target_score}`)
  console.log(`[Optimizer] Optimization context:`, JSON.stringify({
    hasGaps: !!optimizationContext.prioritized_gaps,
    gapsCount: optimizationContext.prioritized_gaps?.length || 0,
    hasKeywords: !!optimizationContext.high_value_keywords,
    keywordsCount: optimizationContext.high_value_keywords?.length || 0
  }))

  // Safety checks - provide defaults if fields are missing
  const prioritizedGaps = optimizationContext.prioritized_gaps || []
  const highValueKeywords = optimizationContext.high_value_keywords || []
  const sectionPriorities = optimizationContext.section_priorities || []
  const strategicGuidance = optimizationContext.strategic_guidance || 'Optimize resume to match job requirements.'

  console.log(`[Optimizer] High-value keywords (first 5): ${highValueKeywords.slice(0, 5).join(', ')}`)

  // Determine optimization aggressiveness based on current score
  const currentScore = optimizationContext.current_score
  const targetScore = optimizationContext.target_score || (currentScore + 10)
  const scoreGap = targetScore - currentScore

  let optimizationLevel: string
  let temperature: number

  if (currentScore >= 90) {
    optimizationLevel = "CONSERVATIVE POLISH"
    temperature = 0.7
  } else if (currentScore >= 75) {
    optimizationLevel = "MODERATE ENHANCEMENT"
    temperature = 0.85
  } else {
    optimizationLevel = "COMPREHENSIVE REWRITE"
    temperature = 1.0
  }

  console.log(`[Optimizer] Strategy: ${optimizationLevel} (temperature: ${temperature})`)

  // Count original content for validation
  const originalExpCount = originalStructured.sections
    .find(s => s.type === 'experience')?.content
    .filter(b => b.type === 'experience_item').length || 0

  const originalEduCount = originalStructured.sections
    .find(s => s.type === 'education')?.content
    .filter(b => b.type === 'education_item').length || 0

  console.log(`[Optimizer] Original: ${originalExpCount} jobs, ${originalEduCount} education entries`)

  // Build strategic optimization prompt
  const strategicPrompt = `${RESUME_OPTIMIZER_SYSTEM_PROMPT}

**OPTIMIZATION CONTEXT:**

Current Match Score: ${currentScore}/100
Target Score: ${targetScore}/100
Score Gap to Close: ${scoreGap} points

Optimization Level: ${optimizationLevel}

**CRITICAL GAPS TO ADDRESS (Prioritized):**
${prioritizedGaps.length > 0
  ? prioritizedGaps.slice(0, 5).map((gap: any, i: number) =>
      `${i+1}. [${gap.severity.toUpperCase()}] ${gap.requirement}
         Impact: ${gap.impact_points} points
         Current: ${gap.current_level || 'Not demonstrated'}
         Required: ${gap.required_level}
         How to fix: ${gap.suggestion}`
    ).join('\n\n')
  : 'No specific gaps identified. Focus on general keyword integration and impact demonstration.'}

**HIGH-VALUE KEYWORDS TO INTEGRATE (Top 15):**
${highValueKeywords.length > 0
  ? highValueKeywords.slice(0, 15).join(', ')
  : 'General job-related keywords from description'}

**SECTION PRIORITIES (Focus Here First):**
${sectionPriorities.length > 0
  ? sectionPriorities.slice(0, 3).map((sp: any) =>
      `- ${sp.section_type} (Priority ${sp.priority}/10): ${sp.reason}`
    ).join('\n')
  : '- experience (Priority 10/10): Focus on demonstrating relevant achievements\n- skills (Priority 8/10): Ensure all relevant skills are listed\n- summary (Priority 7/10): Align with job requirements'}

**STRATEGIC GUIDANCE:**
${strategicGuidance}

---

**YOUR TASK:**

Given the above context, optimize this resume to MAXIMIZE match score in ONE PASS.

Resume (${originalExpCount} jobs, ${originalEduCount} education entries):
${resumeText}

Job Description:
${jobDescription}

**CRITICAL REMINDERS:**
- You MUST return EXACTLY ${originalExpCount} work_experience entries
- You MUST return EXACTLY ${originalEduCount} education entries
- For ${optimizationLevel} mode, make comprehensive bullet rewrites that:
  * Integrate high-value keywords naturally
  * Address critical gaps by reframing existing experience
  * Quantify achievements to demonstrate required qualifications
  * Use strong action verbs and impact-oriented language

Return the optimized resume as clean JSON with no extra text.`

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'user', content: strategicPrompt }
    ],
    temperature: temperature,
    max_tokens: 4096,
    response_format: { type: 'json_object' },
  })

  const content = completion.choices[0].message.content
  if (!content) {
    throw new Error('No response from AI optimizer')
  }

  const result = JSON.parse(content)

  console.log('[Optimizer] Successfully parsed optimized resume JSON')
  console.log('[Optimizer] Optimized work experience entries:', result.work_experience?.length || 0)

  // CRITICAL VALIDATION
  const optimizedExpCount = result.work_experience?.length || 0
  const optimizedEduCount = result.education?.length || 0

  if (optimizedExpCount < originalExpCount) {
    console.error(`[Optimizer] ❌ VALIDATION FAILED: AI removed ${originalExpCount - optimizedExpCount} work experience entries!`)
    throw new Error(`AI removed work experience! Expected ${originalExpCount} jobs but got ${optimizedExpCount}. Rejecting optimization.`)
  }

  if (optimizedEduCount < originalEduCount) {
    console.error(`[Optimizer] ❌ VALIDATION FAILED: AI removed education entries!`)
    throw new Error(`AI removed education! Expected ${originalEduCount} entries but got ${optimizedEduCount}. Rejecting optimization.`)
  }

  console.log('[Optimizer] ✅ Validation passed: All content preserved')

  return result
}

/**
 * Simple direct optimization using job description
 * Following Claude API pattern: combine prompt + resume + JD, send, get JSON back
 */
async function optimizeResumeWithJobDescription(
  resumeText: string,
  jobDescription: string,
  originalStructured: StructuredResume
): Promise<any> {
  // Count original content for validation
  const originalExpCount = originalStructured.sections
    .find(s => s.type === 'experience')?.content
    .filter(b => b.type === 'experience_item').length || 0

  const originalEduCount = originalStructured.sections
    .find(s => s.type === 'education')?.content
    .filter(b => b.type === 'education_item').length || 0

  console.log(`[Optimizer] Original has ${originalExpCount} jobs, ${originalEduCount} education entries`)

  // Combine everything into one prompt (following Claude API pattern)
  const fullPrompt = `${RESUME_OPTIMIZER_SYSTEM_PROMPT}

Resume:
${resumeText}

Job Description:
${jobDescription}

IMPORTANT: The resume above has ${originalExpCount} work experience entries. Your output MUST have exactly ${originalExpCount} work experience entries.

Return the optimized resume as clean JSON with no extra text.`

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'user', content: fullPrompt }
    ],
    temperature: 0, // Use 0 for consistency (like Claude example)
    max_tokens: 4096, // Match Claude's max_tokens
    response_format: { type: 'json_object' },
  })

  const content = completion.choices[0].message.content
  if (!content) {
    throw new Error('No response from AI optimizer')
  }

  // Parse and return the JSON result
  const result = JSON.parse(content)

  console.log('[Optimizer] Successfully parsed optimized resume JSON')
  console.log('[Optimizer] Full name:', result.full_name)
  console.log('[Optimizer] Work experience entries:', result.work_experience?.length || 0)
  console.log('[Optimizer] Core skills count:', result.core_skills?.length || 0)

  // CRITICAL VALIDATION: Ensure no content was removed
  const optimizedExpCount = result.work_experience?.length || 0
  const optimizedEduCount = result.education?.length || 0

  if (optimizedExpCount < originalExpCount) {
    console.error(`[Optimizer] ❌ VALIDATION FAILED: AI removed ${originalExpCount - optimizedExpCount} work experience entries!`)
    console.error(`[Optimizer] Original: ${originalExpCount} jobs, Optimized: ${optimizedExpCount} jobs`)
    throw new Error(`AI removed work experience! Expected ${originalExpCount} jobs but got ${optimizedExpCount}. Rejecting optimization.`)
  }

  if (optimizedEduCount < originalEduCount) {
    console.error(`[Optimizer] ❌ VALIDATION FAILED: AI removed education entries!`)
    throw new Error(`AI removed education! Expected ${originalEduCount} entries but got ${optimizedEduCount}. Rejecting optimization.`)
  }

  console.log('[Optimizer] ✅ Validation passed: All content preserved')

  return result
}

/**
 * Convert optimized JSON back to StructuredResume format
 */
function jsonToStructuredResume(json: any, originalResume: StructuredResume): StructuredResume {
  const sections: ResumeSection[] = []
  let order = 0

  // Contact section
  sections.push({
    id: uuidv4(),
    type: 'contact',
    heading: 'Contact',
    order: order++,
    content: [{
      id: uuidv4(),
      type: 'contact_info',
      content: {
        name: json.full_name,
        email: json.contact.email,
        phone: json.contact.phone,
        location: json.contact.location,
      }
    }]
  })

  // Summary section
  if (json.summary) {
    sections.push({
      id: uuidv4(),
      type: 'summary',
      heading: 'Professional Summary',
      order: order++,
      content: [{
        id: uuidv4(),
        type: 'text',
        content: json.summary
      }]
    })
  }

  // Skills section
  if (json.core_skills && json.core_skills.length > 0) {
    sections.push({
      id: uuidv4(),
      type: 'skills',
      heading: 'Skills',
      order: order++,
      content: [{
        id: uuidv4(),
        type: 'skill_group',
        content: {
          skills: json.core_skills,
          displayStyle: 'inline' as const
        }
      }]
    })
  }

  // Work experience section
  if (json.work_experience && json.work_experience.length > 0) {
    sections.push({
      id: uuidv4(),
      type: 'experience',
      heading: 'Professional Experience',
      order: order++,
      content: json.work_experience.map((exp: any) => ({
        id: uuidv4(),
        type: 'experience_item',
        content: {
          id: uuidv4(),
          jobTitle: exp.job_title,
          company: exp.company,
          location: exp.location,
          startDate: exp.date_range.split(' - ')[0] || exp.date_range,
          endDate: exp.date_range.split(' - ')[1] || 'Present',
          achievements: exp.responsibilities.map((resp: string) => ({
            id: uuidv4(),
            text: resp,
            metadata: { indentLevel: 0 }
          }))
        }
      }))
    })
  }

  // Education section
  if (json.education && json.education.length > 0) {
    sections.push({
      id: uuidv4(),
      type: 'education',
      heading: 'Education',
      order: order++,
      content: json.education.map((edu: any) => ({
        id: uuidv4(),
        type: 'education_item',
        content: {
          id: uuidv4(),
          degree: edu.degree,
          institution: edu.institution,
          location: edu.location,
          graduationDate: edu.date_range
        }
      }))
    })
  }

  // Certifications section
  if (json.certifications && json.certifications.length > 0) {
    sections.push({
      id: uuidv4(),
      type: 'certifications',
      heading: 'Certifications',
      order: order++,
      content: [{
        id: uuidv4(),
        type: 'bullet_list',
        content: {
          items: json.certifications.map((cert: string) => ({
            id: uuidv4(),
            text: cert,
            metadata: { indentLevel: 0 }
          }))
        }
      }]
    })
  }

  // Projects section
  if (json.projects && json.projects.length > 0) {
    sections.push({
      id: uuidv4(),
      type: 'projects',
      heading: 'Projects',
      order: order++,
      content: json.projects.map((proj: any) => ({
        id: uuidv4(),
        type: 'text',
        content: typeof proj === 'string' ? proj : `${proj.title}: ${proj.description}`
      }))
    })
  }

  return {
    id: originalResume.id,
    metadata: {
      ...originalResume.metadata,
      parsedAt: new Date().toISOString()
    },
    sections,
    rawText: originalResume.rawText
  }
}

/**
 * Optimize resume while preserving structure
 */
export async function optimizeResume(
  structuredResume: StructuredResume,
  options: OptimizationOptions,
  jobDescription?: string
): Promise<OptimizationResult> {
  // STRATEGIC OPTIMIZATION: DISABLED - Breaking critical features
  // Issues identified:
  // 1. No detailed change preview (just 1 generic change vs detailed per-section)
  // 2. Rigid template drops custom sections, references, additional info
  // 3. Not actually reducing rounds needed (still iterative in practice)
  // 4. Content loss risk if parser has bugs
  // Keeping section-by-section which preserves all content and shows detailed changes
  /* DISABLED STRATEGIC OPTIMIZATION CODE - Commented out to avoid TypeScript errors
  if (false && options.optimizationContext && jobDescription && jobDescription?.trim()) {
    console.log('[Optimizer] ===== STRATEGIC COMPREHENSIVE OPTIMIZATION MODE =====')
    console.log('[Optimizer] Current score:', options.optimizationContext.current_score)
    console.log('[Optimizer] Using comprehensive single-pass approach')

    try {
      // Convert structured resume to plain text
      const resumeText = structuredResumeToPlainText(structuredResume)
      console.log('[Optimizer] Resume text prepared for AI')

      // Perform strategic optimization
      const optimizedJson = await optimizeResumeStrategically(
        resumeText,
        jobDescription,
        structuredResume,
        options.optimizationContext
      )
      console.log('[Optimizer] ✅ Received strategically optimized resume')

      // Convert back to StructuredResume format
      const optimizedResume = jsonToStructuredResume(optimizedJson, structuredResume)

      // Generate comprehensive change summary
      const gapsCount = options.optimizationContext.prioritized_gaps?.length || 0
      const keywordsCount = options.optimizationContext.high_value_keywords?.length || 0

      const changes: ChangeLog[] = [{
        id: uuidv4(),
        sectionId: 'all',
        sectionName: 'All Sections',
        contentBlockId: 'all',
        changeType: 'enhance',
        originalValue: 'Original resume',
        newValue: `Strategically optimized resume (${options.optimizationContext.current_score}% → ${options.optimizationContext.target_score}% target)`,
        reason: `Comprehensive optimization targeting ${gapsCount} gaps with ${keywordsCount} strategic keywords.`,
        confidence: 0.95,
        impact: 'high',
        category: 'keyword',
      }]

      const summary: OptimizationSummary = {
        totalChanges: changes.length,
        changesByCategory: {
          keyword: 1,
          bullet_point: 0,
          grammar: 0,
          clarity: 0,
          section_content: 0,
          formatting: 0,
        },
        keywordsAdded: optimizedJson.core_skills || [],
        atsScoreChange: {
          before: options.optimizationContext.current_score,
          after: options.optimizationContext.current_score + 8, // Estimate
          improvement: 8
        },
        estimatedImpact: `Comprehensive optimization targeting ${gapsCount} gaps with ${keywordsCount} strategic keywords.`,
      }

      const preview: DiffPreview = {
        sections: [],
        highlightedChanges: [],
      }

      return {
        originalResume: structuredResume,
        optimizedResume,
        optimizedJson: optimizedJson,
        changes,
        summary,
        preview,
      }
    } catch (error) {
      console.error('[Optimizer] Strategic optimization failed, falling back to section-by-section:', error)
      // Fall through to section-by-section on error
    }
  }
  */

  // Fallback: Original section-by-section optimization (when no match context or on error)
  console.log('[Optimizer] Using section-by-section optimization (no match context or fallback)')
  const changes: ChangeLog[] = []
  const optimizedResume: StructuredResume = JSON.parse(JSON.stringify(structuredResume))

  // Optimize each section
  for (let i = 0; i < optimizedResume.sections.length; i++) {
    const section = optimizedResume.sections[i]
    const sectionChanges = await optimizeSection(section, options, jobDescription)
    changes.push(...sectionChanges)
  }

  // CRITICAL: Validate and sanitize all achievement bullets
  // This prevents newlines from breaking DOCX export
  console.log('[Optimizer] Validating and sanitizing achievement bullets...')
  let sanitizedCount = 0

  for (const section of optimizedResume.sections) {
    for (const block of section.content) {
      // Check experience items
      if (block.type === 'experience_item') {
        const exp = block.content as ExperienceItem
        if (exp.achievements) {
          exp.achievements.forEach(ach => {
            if (ach.text.includes('\n') || ach.text.includes('\r')) {
              console.warn('[Optimizer] Bullet contains newline, sanitizing:', ach.text.substring(0, 50) + '...')
              ach.text = ach.text.replace(/\n+/g, ' ').replace(/\r+/g, ' ').replace(/\s+/g, ' ').trim()
              sanitizedCount++
            }
          })
        }
      }

      // Check education items
      if (block.type === 'education_item') {
        const edu = block.content as EducationItem
        if (edu.achievements) {
          edu.achievements.forEach(ach => {
            if (ach.text.includes('\n') || ach.text.includes('\r')) {
              console.warn('[Optimizer] Education bullet contains newline, sanitizing:', ach.text.substring(0, 50) + '...')
              ach.text = ach.text.replace(/\n+/g, ' ').replace(/\r+/g, ' ').replace(/\s+/g, ' ').trim()
              sanitizedCount++
            }
          })
        }
      }

      // Check bullet lists
      if (block.type === 'bullet_list') {
        const bulletList = block.content as { items: BulletItem[] }
        bulletList.items.forEach(item => {
          if (item.text.includes('\n') || item.text.includes('\r')) {
            console.warn('[Optimizer] Bullet list item contains newline, sanitizing:', item.text.substring(0, 50) + '...')
            item.text = item.text.replace(/\n+/g, ' ').replace(/\r+/g, ' ').replace(/\s+/g, ' ').trim()
            sanitizedCount++
          }
        })
      }
    }
  }

  if (sanitizedCount > 0) {
    console.log(`[Optimizer] Sanitized ${sanitizedCount} bullets containing newlines`)
  } else {
    console.log('[Optimizer] All bullets are clean (no newlines found)')
  }

  // CRITICAL: Validate content count - ensure nothing was removed
  const originalExpCount = structuredResume.sections
    .find(s => s.type === 'experience')?.content
    .filter(b => b.type === 'experience_item').length || 0

  const optimizedExpCount = optimizedResume.sections
    .find(s => s.type === 'experience')?.content
    .filter(b => b.type === 'experience_item').length || 0

  console.log(`[Optimizer] Content validation: Original has ${originalExpCount} jobs, optimized has ${optimizedExpCount} jobs`)

  if (optimizedExpCount < originalExpCount) {
    console.error(`[Optimizer] ❌ CONTENT VALIDATION FAILED: ${originalExpCount - optimizedExpCount} jobs were removed during optimization!`)
    console.error(`[Optimizer] Reverting to original resume to prevent data loss`)

    const fallbackJson = convertStructuredResumeToCleanJson(structuredResume)

    return {
      originalResume: structuredResume,
      optimizedResume: structuredResume, // Use original instead
      optimizedJson: fallbackJson,
      changes: [],
      summary: {
        totalChanges: 0,
        changesByCategory: {
          bullet_point: 0,
          keyword: 0,
          grammar: 0,
          clarity: 0,
          section_content: 0,
          formatting: 0,
        },
        keywordsAdded: [],
        estimatedImpact: 'Optimization failed - work experience was removed. No changes applied to prevent data loss.',
      },
      preview: {
        sections: [],
        highlightedChanges: [],
      },
    }
  }

  console.log('[Optimizer] ✅ Content validation passed: All jobs preserved')

  // CRITICAL: Validate structure preservation using JSON Schema
  const validation = validateStructurePreservation(structuredResume, optimizedResume)

  if (!validation.isValid) {
    console.error('CRITICAL: Structure preservation validation failed!')
    console.error('Errors:', validation.errors)

    // Log all critical errors
    validation.errors.forEach(error => {
      if (error.severity === 'critical') {
        console.error(`CRITICAL ERROR - ${error.field}: ${error.message}`)
      }
    })

    // If there are critical errors, revert to original and log
    const criticalErrors = validation.errors.filter(e => e.severity === 'critical')
    if (criticalErrors.length > 0) {
      console.error(
        `REVERTING TO ORIGINAL: ${criticalErrors.length} critical structure violations detected`
      )

      // Return original with no changes rather than corrupted structure
      const fallbackJson = convertStructuredResumeToCleanJson(structuredResume)

      return {
        originalResume: structuredResume,
        optimizedResume: structuredResume, // Use original instead
        optimizedJson: fallbackJson, // Still generate JSON for template
        changes: [], // No changes applied
        summary: {
          totalChanges: 0,
          changesByCategory: {
            bullet_point: 0,
            keyword: 0,
            grammar: 0,
            clarity: 0,
            section_content: 0,
            formatting: 0,
          },
          keywordsAdded: [],
          estimatedImpact: 'Optimization failed validation - structure would have been corrupted. No changes applied.',
        },
        preview: {
          sections: [],
          highlightedChanges: [],
        },
      }
    }
  }

  // Log any warnings
  if (validation.warnings.length > 0) {
    console.warn('Structure preservation warnings:', validation.warnings)
  }

  // Calculate summary
  const summary = generateOptimizationSummary(changes, structuredResume, optimizedResume)

  // Generate preview
  const preview = generateDiffPreview(optimizedResume, changes)

  // IMPORTANT: Always convert to clean JSON format for professional template
  // Even when not using job description optimization
  console.log('[Optimizer] Converting to clean JSON format for professional template')
  const optimizedJson = convertStructuredResumeToCleanJson(optimizedResume)

  return {
    originalResume: structuredResume,
    optimizedResume,
    optimizedJson, // Always include for professional template rendering
    changes,
    summary,
    preview,
  }
}

/**
 * Optimize a single section
 */
async function optimizeSection(
  section: ResumeSection,
  options: OptimizationOptions,
  jobDescription?: string
): Promise<ChangeLog[]> {
  const changes: ChangeLog[] = []

  // Process each content block
  for (let i = 0; i < section.content.length; i++) {
    const block = section.content[i]

    switch (block.type) {
      case 'experience_item':
        const expChanges = await optimizeExperienceItem(
          block,
          section,
          options,
          jobDescription
        )
        changes.push(...expChanges)
        break

      case 'education_item':
        const eduChanges = await optimizeEducationItem(
          block,
          section,
          options,
          jobDescription
        )
        changes.push(...eduChanges)
        break

      case 'bullet_list':
        const bulletChanges = await optimizeBulletList(
          block,
          section,
          options,
          jobDescription
        )
        changes.push(...bulletChanges)
        break

      case 'text':
        const textChanges = await optimizeTextBlock(
          block,
          section,
          options,
          jobDescription
        )
        changes.push(...textChanges)
        break

      case 'skill_group':
        const skillChanges = await optimizeSkillGroup(
          block,
          section,
          options,
          jobDescription
        )
        changes.push(...skillChanges)
        break
    }
  }

  return changes
}

/**
 * Optimize experience item
 */
async function optimizeExperienceItem(
  block: ContentBlock,
  section: ResumeSection,
  options: OptimizationOptions,
  jobDescription?: string
): Promise<ChangeLog[]> {
  const changes: ChangeLog[] = []
  const expItem = block.content as ExperienceItem

  // CRITICAL: NEVER modify these fields - they must be preserved EXACTLY as is:
  // - jobTitle (designation/position)
  // - company (company name)
  // - location
  // - startDate
  // - endDate
  // - description (position summary)
  //
  // ONLY optimize: achievement bullet points content

  // Optimize bullet points (if any exist)
  if (options.improveBulletPoints && expItem.achievements && expItem.achievements.length > 0) {
    // Extract keywords and gaps from optimization context if available
    const highValueKeywords = options.optimizationContext?.high_value_keywords || []
    const prioritizedGaps = options.optimizationContext?.prioritized_gaps || []

    const optimizedBullets = await optimizeBullets(
      expItem.achievements.map(b => b.text),
      options,
      jobDescription,
      highValueKeywords,
      prioritizedGaps
    )

    optimizedBullets.forEach((optimized, index) => {
      if (optimized.improved !== expItem.achievements[index].text) {
        // Update the bullet
        expItem.achievements[index].text = optimized.improved

        // Track change
        changes.push({
          id: uuidv4(),
          sectionId: section.id,
          sectionName: section.heading,
          contentBlockId: block.id,
          changeType: 'enhance',
          originalValue: optimized.original,
          newValue: optimized.improved,
          reason: optimized.reason,
          confidence: optimized.confidence,
          impact: optimized.impact,
          category: 'bullet_point',
        })
      }
    })
  }

  // Add keywords if needed
  if (options.addKeywords && jobDescription) {
    const keywordChanges = await addKeywordsToBullets(
      expItem.achievements,
      section,
      block.id,
      jobDescription
    )
    changes.push(...keywordChanges)
  }

  return changes
}

/**
 * Optimize education item
 */
async function optimizeEducationItem(
  block: ContentBlock,
  section: ResumeSection,
  options: OptimizationOptions,
  jobDescription?: string
): Promise<ChangeLog[]> {
  const changes: ChangeLog[] = []
  const eduItem = block.content as EducationItem

  // Optimize achievements if present
  if (options.improveBulletPoints && eduItem.achievements && eduItem.achievements.length > 0) {
    // Extract keywords and gaps from optimization context if available
    const highValueKeywords = options.optimizationContext?.high_value_keywords || []
    const prioritizedGaps = options.optimizationContext?.prioritized_gaps || []

    const optimizedBullets = await optimizeBullets(
      eduItem.achievements.map(b => b.text),
      options,
      jobDescription,
      highValueKeywords,
      prioritizedGaps
    )

    optimizedBullets.forEach((optimized, index) => {
      if (eduItem.achievements && optimized.improved !== eduItem.achievements[index].text) {
        eduItem.achievements[index].text = optimized.improved

        changes.push({
          id: uuidv4(),
          sectionId: section.id,
          sectionName: section.heading,
          contentBlockId: block.id,
          changeType: 'enhance',
          originalValue: optimized.original,
          newValue: optimized.improved,
          reason: optimized.reason,
          confidence: optimized.confidence,
          impact: optimized.impact,
          category: 'bullet_point',
        })
      }
    })
  }

  return changes
}

/**
 * Optimize bullet list
 */
async function optimizeBulletList(
  block: ContentBlock,
  section: ResumeSection,
  options: OptimizationOptions,
  jobDescription?: string
): Promise<ChangeLog[]> {
  const changes: ChangeLog[] = []
  const bulletList = block.content as { items: BulletItem[] }

  if (options.improveBulletPoints) {
    // Extract keywords and gaps from optimization context if available
    const highValueKeywords = options.optimizationContext?.high_value_keywords || []
    const prioritizedGaps = options.optimizationContext?.prioritized_gaps || []

    const optimizedBullets = await optimizeBullets(
      bulletList.items.map(b => b.text),
      options,
      jobDescription,
      highValueKeywords,
      prioritizedGaps
    )

    optimizedBullets.forEach((optimized, index) => {
      if (optimized.improved !== bulletList.items[index].text) {
        bulletList.items[index].text = optimized.improved

        changes.push({
          id: uuidv4(),
          sectionId: section.id,
          sectionName: section.heading,
          contentBlockId: block.id,
          changeType: 'enhance',
          originalValue: optimized.original,
          newValue: optimized.improved,
          reason: optimized.reason,
          confidence: optimized.confidence,
          impact: optimized.impact,
          category: 'bullet_point',
        })
      }
    })
  }

  return changes
}

/**
 * Optimize text block (summary, objective, etc.)
 */
async function optimizeTextBlock(
  block: ContentBlock,
  section: ResumeSection,
  options: OptimizationOptions,
  jobDescription?: string
): Promise<ChangeLog[]> {
  const changes: ChangeLog[] = []
  const text = block.content as string

  if (options.enhanceSections || options.fixGrammar) {
    const optimized = await optimizeText(text, section.type, options, jobDescription)

    if (optimized.improved !== text) {
      block.content = optimized.improved

      changes.push({
        id: uuidv4(),
        sectionId: section.id,
        sectionName: section.heading,
        contentBlockId: block.id,
        changeType: optimized.changeType,
        originalValue: text,
        newValue: optimized.improved,
        reason: optimized.reason,
        confidence: optimized.confidence,
        impact: optimized.impact,
        category: 'section_content',
      })
    }
  }

  return changes
}

/**
 * Optimize skill group
 */
async function optimizeSkillGroup(
  block: ContentBlock,
  section: ResumeSection,
  options: OptimizationOptions,
  jobDescription?: string
): Promise<ChangeLog[]> {
  const changes: ChangeLog[] = []
  const skillGroup = block.content as { category?: string; skills: string[] }

  if (options.addKeywords && jobDescription) {
    const newSkills = await suggestSkills(skillGroup.skills, jobDescription)

    newSkills.forEach(skill => {
      skillGroup.skills.push(skill.keyword)

      changes.push({
        id: uuidv4(),
        sectionId: section.id,
        sectionName: section.heading,
        contentBlockId: block.id,
        changeType: 'add',
        originalValue: '',
        newValue: skill.keyword,
        reason: skill.reason,
        confidence: 0.8,
        impact: 'medium',
        category: 'keyword',
      })
    })
  }

  return changes
}

/**
 * Use AI to optimize bullet points
 */
async function optimizeBullets(
  bullets: string[],
  options: OptimizationOptions,
  jobDescription?: string,
  highValueKeywords?: string[],
  prioritizedGaps?: any[]
): Promise<Array<{
  original: string
  improved: string
  reason: string
  confidence: number
  impact: 'high' | 'medium' | 'low'
}>> {
  const prompt = `You are an expert ATS (Applicant Tracking System) optimization specialist and resume writer.

CRITICAL: Optimize these bullet points to IMPROVE ATS SCORE using these exact criteria:

ATS SCORING CRITERIA (optimize for these in order of importance):
1. ATS Compatibility (30% weight) - Keep formatting simple, use standard terms, avoid special characters
2. Keywords (25% weight) - Preserve industry-specific keywords, add job-relevant skills
3. Impact (20% weight) - Quantify achievements, use strong action verbs
4. Clarity (15% weight) - Keep concise, easy to scan, clear structure
5. Completeness (10% weight) - Ensure all relevant info is present

CRITICAL STRUCTURE PRESERVATION REQUIREMENTS:
You are ONLY optimizing the CONTENT of each bullet point.
You MUST return EXACTLY ${bullets.length} bullet points in your response.
The "optimized_bullets" array MUST contain ${bullets.length} items.
DO NOT remove, change, or add bullet points.
DO NOT skip any bullets.

JSON Schema Requirements:
- Input count: ${bullets.length} bullets
- Output count: MUST be ${bullets.length} bullets (will be validated)
- Each bullet MUST have: original, improved, reason, confidence, impact
- Any deviation from ${bullets.length} items will be rejected

${jobDescription ? `Target Job Description (extract keywords from this):\n${jobDescription}\n\n` : ''}

Bullet Points to Optimize (ALL ${bullets.length} must be returned):
${bullets.map((b, i) => `${i + 1}. ${b}`).join('\n')}

OPTIMIZATION GUIDELINES (prioritize ATS score improvement):

1. ATS COMPATIBILITY (30% - HIGHEST PRIORITY):
   - Keep bullets concise and scannable (avoid overly long sentences)
   - Use standard industry terminology (don't replace technical terms)
   - Avoid special characters that confuse ATS
   - Maintain clean, simple structure

2. KEYWORDS (25% - SECOND PRIORITY):
   - PRESERVE all industry-specific keywords and technical terms
   - Add relevant keywords from job description ONLY if natural
   - Don't remove existing keywords to make room for fancy language
   - Prioritize skill names, tools, technologies, methodologies

3. IMPACT (20%):
   - Add metrics/numbers ONLY if they enhance credibility
   - Use strong action verbs (led, developed, implemented, achieved)
   - Highlight business value and results
   - Keep impact statements concise

4. CLARITY (15%):
   - Keep bullet length similar or SHORTER than original
   - Make easy to scan (avoid complex sentence structures)
   - One main idea per bullet
   - Clear, direct language

5. GRAMMAR:
   - Fix obvious grammar/spelling errors
   - Ensure consistent tense
   - Clean up awkward phrasing

CRITICAL RULES:
- If original has good keywords, KEEP them (don't replace for style)
- Make COMPREHENSIVE improvements to maximize job match and ATS score
- Integrate missing keywords naturally where they fit
- Rewrite bullets to better demonstrate qualifications and achievements
- Focus on substance over style - add metrics, impact, and relevant skills
${highValueKeywords && highValueKeywords.length > 0 ? `\nHIGH-VALUE KEYWORDS TO INTEGRATE (naturally incorporate these where relevant):\n${highValueKeywords.join(', ')}\n` : ''}
${prioritizedGaps && prioritizedGaps.length > 0 ? `\nCRITICAL GAPS TO ADDRESS (rewrite bullets to demonstrate these if applicable):\n${prioritizedGaps.slice(0, 3).map((g: any, i: number) => `${i+1}. ${g.requirement} (${g.severity})`).join('\n')}\n` : ''}

Respond with JSON only:
{
  "optimized_bullets": [
    {
      "original": "...",
      "improved": "...",
      "reason": "...",
      "confidence": 0.0-1.0,
      "impact": "high|medium|low"
    }
  ]
}`

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are an expert resume writer. Always respond with valid JSON only.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: options.aggressiveness === 'conservative' ? 0.8 : 1.0,
      max_tokens: 3000,
      response_format: { type: 'json_object' },
    })

    const responseText = completion.choices[0].message.content
    if (!responseText) {
      return bullets.map(b => ({
        original: b,
        improved: b,
        reason: 'No optimization suggested',
        confidence: 0,
        impact: 'low' as const,
      }))
    }

    const result = JSON.parse(responseText)
    const optimizedBullets = result.optimized_bullets || []

    // CRITICAL VALIDATION: Ensure we got the same number of bullets back
    if (optimizedBullets.length !== bullets.length) {
      console.error(
        `AI returned ${optimizedBullets.length} bullets but expected ${bullets.length}. Using originals.`
      )
      return bullets.map(b => ({
        original: b,
        improved: b,
        reason: 'Validation failed - bullet count mismatch',
        confidence: 0,
        impact: 'low' as const,
      }))
    }

    return optimizedBullets
  } catch (error) {
    console.error('Error optimizing bullets:', error)
    return bullets.map(b => ({
      original: b,
      improved: b,
      reason: 'Optimization failed',
      confidence: 0,
      impact: 'low',
    }))
  }
}

/**
 * Optimize text content
 */
async function optimizeText(
  text: string,
  sectionType: string,
  options: OptimizationOptions,
  jobDescription?: string
): Promise<{
  improved: string
  reason: string
  confidence: number
  impact: 'high' | 'medium' | 'low'
  changeType: ChangeType
}> {
  const prompt = `You are an expert ATS optimization specialist. Optimize the following ${sectionType} section text to IMPROVE ATS SCORE.

ATS SCORING PRIORITIES:
1. ATS Compatibility (30%) - Simple formatting, standard terms, scannable
2. Keywords (25%) - Industry-relevant terms, preserve existing keywords
3. Impact (20%) - Professional, results-oriented
4. Clarity (15%) - Concise, easy to scan
5. Completeness (10%) - All relevant info present

${jobDescription ? `Target Job Description (extract keywords):\n${jobDescription}\n\n` : ''}

Original Text:
${text}

Guidelines:
- PRESERVE existing industry keywords and technical terms
- Fix grammar/clarity issues
- Keep concise and scannable (avoid long paragraphs)
- Incorporate job-relevant keywords ONLY if natural
- Don't add unnecessary words just for style
${options.preserveLength ? '- Keep similar or shorter length' : ''}
${options.aggressiveness === 'conservative' ? '- Make MINIMAL changes, focus on grammar and keyword preservation' : ''}
${options.aggressiveness === 'aggressive' ? '- Can rewrite but MUST preserve keywords and maintain clarity' : ''}

Respond with JSON only:
{
  "improved": "...",
  "reason": "...",
  "confidence": 0.0-1.0,
  "impact": "high|medium|low",
  "changeType": "grammar|enhance|keyword"
}`

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are an expert resume writer. Always respond with valid JSON only.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: options.aggressiveness === 'conservative' ? 0.8 : 1.0,
      max_tokens: 1000,
      response_format: { type: 'json_object' },
    })

    const responseText = completion.choices[0].message.content
    if (!responseText) {
      return {
        improved: text,
        reason: 'No optimization suggested',
        confidence: 0,
        impact: 'low',
        changeType: 'enhance',
      }
    }

    return JSON.parse(responseText)
  } catch (error) {
    console.error('Error optimizing text:', error)
    return {
      improved: text,
      reason: 'Optimization failed',
      confidence: 0,
      impact: 'low',
      changeType: 'enhance',
    }
  }
}

/**
 * Suggest skills based on job description
 */
async function suggestSkills(
  existingSkills: string[],
  jobDescription: string
): Promise<Array<{ keyword: string; reason: string }>> {
  const prompt = `You are an expert resume analyzer. Based on the job description, suggest relevant skills that should be added to this resume.

Job Description:
${jobDescription}

Existing Skills:
${existingSkills.join(', ')}

Suggest skills that:
1. Are mentioned in the job description
2. Are NOT already in the existing skills
3. Are relevant and not too generic
4. Would improve ATS matching

Respond with JSON only (max 5 suggestions):
{
  "suggested_skills": [
    {
      "keyword": "...",
      "reason": "..."
    }
  ]
}`

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are an expert resume analyzer. Always respond with valid JSON only.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.5,
      max_tokens: 1000,
      response_format: { type: 'json_object' },
    })

    const responseText = completion.choices[0].message.content
    if (!responseText) return []

    const result = JSON.parse(responseText)
    return result.suggested_skills || []
  } catch (error) {
    console.error('Error suggesting skills:', error)
    return []
  }
}

/**
 * Add keywords to bullets
 */
async function addKeywordsToBullets(
  bullets: BulletItem[],
  section: ResumeSection,
  blockId: string,
  jobDescription: string
): Promise<ChangeLog[]> {
  // Implementation for adding keywords to existing bullets
  // This is a simplified version - in production, you'd use AI to naturally integrate keywords
  return []
}

/**
 * Generate optimization summary
 */
function generateOptimizationSummary(
  changes: ChangeLog[],
  originalResume: StructuredResume,
  optimizedResume: StructuredResume
): OptimizationSummary {
  const changesByCategory: Record<ChangeCategory, number> = {
    bullet_point: 0,
    keyword: 0,
    grammar: 0,
    clarity: 0,
    section_content: 0,
    formatting: 0,
  }

  const keywordsAdded: string[] = []

  changes.forEach(change => {
    changesByCategory[change.category]++
    if (change.category === 'keyword') {
      keywordsAdded.push(change.newValue)
    }
  })

  return {
    totalChanges: changes.length,
    changesByCategory,
    keywordsAdded,
    estimatedImpact: `Made ${changes.length} improvements across ${Object.keys(changesByCategory).filter(k => changesByCategory[k as ChangeCategory] > 0).length} categories.`,
  }
}

/**
 * Generate diff preview
 */
function generateDiffPreview(
  optimizedResume: StructuredResume,
  changes: ChangeLog[]
): DiffPreview {
  const sectionDiffs: SectionDiff[] = []

  // Group changes by section
  const changesBySection = new Map<string, ChangeLog[]>()
  changes.forEach(change => {
    const existing = changesBySection.get(change.sectionId) || []
    existing.push(change)
    changesBySection.set(change.sectionId, existing)
  })

  // Create section diffs
  optimizedResume.sections.forEach(section => {
    const sectionChanges = changesBySection.get(section.id) || []
    sectionDiffs.push({
      sectionId: section.id,
      sectionName: section.heading,
      hasChanges: sectionChanges.length > 0,
      changeCount: sectionChanges.length,
      changes: sectionChanges,
    })
  })

  // Create highlighted changes
  const highlightedChanges = changes.map(change => ({
    changeId: change.id,
    displayText: `${change.sectionName}: ${change.changeType}`,
    changeType: change.changeType,
    beforeText: change.originalValue,
    afterText: change.newValue,
    reason: change.reason,
    accepted: change.accepted ?? true,
  }))

  return {
    sections: sectionDiffs,
    highlightedChanges,
  }
}
