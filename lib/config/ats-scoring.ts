/**
 * ATS Scoring Configuration
 *
 * This defines the scoring criteria used for evaluating resumes against job descriptions.
 * The scoring simulates an ATS system and focuses on exact keyword matching, phrasing overlap,
 * and technical alignment rather than just semantic similarity.
 */

export const ATS_SCORING_CRITERIA = {
  /**
   * Work Experience Match (20%)
   * Does the resume show required years + relevant experience?
   */
  workExperience: {
    weight: 20,
    description: 'Required years of experience and relevant work history',
    evaluation: [
      'Years of experience alignment',
      'Relevant job functions and responsibilities',
      'Similar role types',
      'Role progression and seniority level'
    ]
  },

  /**
   * Education Match (10%)
   * Is the required degree or equivalent clearly stated?
   */
  education: {
    weight: 10,
    description: 'Required degree, certifications, or educational equivalents',
    evaluation: [
      'Degree level match (Bachelor\'s, Master\'s, PhD)',
      'Field of study relevance',
      'Certifications mentioned',
      'Educational institution (if specified)'
    ]
  },

  /**
   * Core Technical Skills Match (30%)
   * Are all tools, platforms, and technical terms from the job description
   * found exactly in the resume?
   */
  technicalSkills: {
    weight: 30,
    description: 'Exact match of tools, platforms, and technical terms',
    evaluation: [
      'Exact keyword match for tools and platforms mentioned in job description',
      'Technical skills (exact names as stated)',
      'Software and systems (exact product/brand names)',
      'Industry-specific tools and technologies',
      'Equipment, machinery, or specialized tools',
      'Relevant certifications or licenses'
    ],
    matching: 'EXACT' // Must be exact matches, not semantic
  },

  /**
   * Methodology & Process (15%)
   * Are specific frameworks, methodologies, or processes named explicitly?
   */
  methodologyProcess: {
    weight: 15,
    description: 'Process frameworks, methodologies, and standards explicitly mentioned',
    evaluation: [
      'Work methodologies mentioned in job description',
      'Industry-standard frameworks',
      'Process improvement methodologies',
      'Quality standards and certifications',
      'Regulatory compliance frameworks',
      'Best practices and protocols'
    ],
    matching: 'EXACT' // Must use exact terminology
  },

  /**
   * Soft Skill/Collaboration Keywords (10%)
   * Are terms like "stakeholder engagement," "cross-functional teams,"
   * "global collaboration" explicitly mentioned?
   */
  softSkillsCollaboration: {
    weight: 10,
    description: 'Collaboration, communication, and interpersonal skill keywords',
    evaluation: [
      'Stakeholder engagement/management',
      'Cross-functional team collaboration',
      'Global/international collaboration',
      'Leadership and mentoring',
      'Client/customer interaction',
      'Communication and presentation skills'
    ],
    matching: 'PHRASE' // Look for exact phrases
  },

  /**
   * Project Delivery (10%)
   * Are there keywords like "on-time," "within budget," "delivered,"
   * "implemented," "launched"?
   */
  projectDelivery: {
    weight: 10,
    description: 'Project delivery, execution, and results keywords',
    evaluation: [
      'On-time delivery',
      'Within budget',
      'Successfully delivered/implemented/launched',
      'Project completion metrics',
      'Measurable outcomes',
      'ROI and business impact'
    ],
    matching: 'PHRASE'
  },

  /**
   * Additional Quality Factors (5%)
   * Bonus points for quantified achievements, clear formatting, etc.
   */
  quality: {
    weight: 5,
    description: 'Overall quality and presentation',
    evaluation: [
      'Quantified achievements (numbers, percentages)',
      'Clear and consistent formatting',
      'ATS-friendly structure',
      'Action verb usage'
    ]
  }
}

/**
 * Detailed scoring instructions for the AI
 */
export const SCORING_INSTRUCTIONS = `
You are simulating an ATS (Applicant Tracking System). Evaluate how well a resume matches a job description based on EXACT keyword and phrase alignment, NOT just semantic similarity.

**CRITICAL: This is keyword-based scoring, not conceptual matching.**
- Only exact matches count (e.g., "JavaScript" ≠ "JS", "Microsoft 365" ≠ "Office Suite")
- Synonyms and related terms do NOT count unless commonly accepted variations
- Look for EXACT terms and phrases from the job description
- This applies to ALL industries: tech, healthcare, finance, manufacturing, retail, etc.

**Score Breakdown (Total: 100 points)**

1. **Work Experience Match (20 points)**
   - Required years of experience clearly stated and met
   - Relevant domains/industries explicitly mentioned
   - Role level matches (Senior, Lead, Manager, etc.)
   - Career progression demonstrated

2. **Education Match (10 points)**
   - Required degree level explicitly stated (Bachelor's, Master's, PhD)
   - Field of study matches or is relevant
   - Certifications from job description are listed
   - Educational requirements clearly met

3. **Core Technical Skills Match (30 points) - HIGHEST WEIGHT**
   - **EXACT MATCH REQUIRED** - Check if every tool, platform, skill, or technology from the job description appears in the resume using the EXACT same name
   - Count: (Matching keywords / Total required keywords) × 30
   - Examples of exact matching logic:
     * Exact match: "Tool X" = "Tool X" ✓
     * Not a match: "Tool X" ≠ "similar tool" ✗
     * Acceptable variation: "Amazon Web Services" = "AWS" ✓
     * Exact match: "CAD Software" = "CAD Software" ✓
     * Not a match: "design experience" ≠ "CAD Software" ✗

4. **Methodology & Process (15 points)**
   - Frameworks, methodologies, and processes named EXACTLY as stated in job description
   - Industry standards and protocols explicitly mentioned
   - Quality systems or compliance frameworks
   - Count exact matches only

5. **Soft Skill/Collaboration Keywords (10 points)**
   - Look for EXACT phrases:
     * "stakeholder engagement" or "stakeholder management"
     * "cross-functional teams" or "cross-functional collaboration"
     * "global collaboration" or "international teams"
   - Award points only for explicit mentions

6. **Project Delivery (10 points)**
   - Keywords like:
     * "on-time" or "on time"
     * "within budget" or "under budget"
     * "delivered," "implemented," "launched"
     * "completed," "shipped," "deployed"
   - Quantified delivery metrics (e.g., "delivered 15 projects")

7. **Quality Factors (5 points)**
   - Quantified achievements with numbers/percentages
   - Clear, ATS-friendly formatting
   - Strong action verbs
   - Professional presentation

**Scoring Rules:**
- Be strict: Only award points for explicit, exact matches
- Partial credit: If 50% of required technical skills are present, award 15/30 points
- No points for synonyms or related concepts unless explicitly acceptable (like AWS = Amazon Web Services)
- Document which keywords were found and which are missing
- Lower scores (30-50) are NORMAL for partial matches
- 70+ indicates strong alignment
- 90+ indicates exceptional match with nearly all keywords present
`

/**
 * Get the total weight to verify it equals 100
 */
export function getTotalWeight(): number {
  return Object.values(ATS_SCORING_CRITERIA).reduce((sum, criteria) => sum + criteria.weight, 0)
}

/**
 * Validate scoring criteria weights sum to 100
 */
export function validateScoringWeights(): boolean {
  const total = getTotalWeight()
  if (total !== 100) {
    console.warn(`Warning: Scoring weights sum to ${total}, expected 100`)
    return false
  }
  return true
}
