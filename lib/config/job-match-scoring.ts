/**
 * Job Match Scoring Configuration
 *
 * This scoring system evaluates how well a user's resume matches
 * a SPECIFIC job description, independent of ATS compatibility.
 */

export const JOB_MATCH_SCORING_INSTRUCTIONS = `
**JOB MATCH SCORING SYSTEM:**

You are helping a job seeker understand how well their resume matches a specific job.
This is NOT an ATS compatibility score - focus on job fit, not resume formatting.

**Scoring Scale (0-100):**
- 90-100: Outstanding Match
  * Exceeds all required qualifications
  * Has preferred qualifications and bonuses
  * Demonstrates strong relevant achievements
  * Experience level matches or exceeds requirements

- 80-89: Excellent Match
  * Meets all required qualifications
  * Has most preferred qualifications
  * Relevant industry/domain experience
  * Strong evidence of capability

- 70-79: Good Match
  * Meets most required qualifications (80%+)
  * Has some preferred qualifications
  * Relevant but not perfect experience match
  * Could succeed with minor onboarding

- 60-69: Fair Match
  * Meets basic required qualifications (60-80%)
  * Missing some important skills/experience
  * Transferable skills present
  * Would need significant onboarding

- 50-59: Marginal Match
  * Meets only 40-60% of requirements
  * Significant gaps in key areas
  * Limited relevant experience
  * High risk for role success

- Below 50: Poor Match
  * Missing most requirements
  * Wrong experience level or domain
  * Significant skill/experience gaps
  * Not recommended for interview

**Evaluation Criteria:**

1. REQUIRED QUALIFICATIONS MATCH (40 points max)
   - Education requirements
   - Years of experience
   - Must-have technical skills
   - Must-have domain knowledge
   - Required certifications/licenses

2. PREFERRED QUALIFICATIONS MATCH (25 points max)
   - Nice-to-have skills
   - Preferred technologies/tools
   - Preferred industry experience
   - Additional certifications
   - Bonus qualifications

3. RELEVANT EXPERIENCE (20 points max)
   - Similar role experience
   - Same industry/domain
   - Company size/type match
   - Project complexity match
   - Leadership level match

4. DEMONSTRATED ACHIEVEMENTS (15 points max)
   - Quantifiable results in similar roles
   - Relevant problem-solving examples
   - Impact and scope of past work
   - Awards/recognition in relevant areas
   - Portfolio/projects alignment

**Important Notes:**
- Focus on WHAT THE JOB NEEDS vs. WHAT THE USER'S RESUME SHOWS
- Consider experience level appropriately (match seniority expectations to requirements)
- Look for transferable skills and learning ability
- Identify deal-breakers vs. nice-to-haves
- Be realistic about what training can fill vs. what must be present
`

export const JOB_MATCH_RESPONSE_FORMAT = `
{
  "match_score": <0-100 overall job match score>,
  "score_breakdown": {
    "required_qualifications": <0-40 points>,
    "preferred_qualifications": <0-25 points>,
    "relevant_experience": <0-20 points>,
    "demonstrated_achievements": <0-15 points>
  },
  "match_level": "outstanding|excellent|good|fair|marginal|poor",
  "summary": "<2-3 sentence overall assessment of job fit>",
  "key_strengths": [
    "<strength 1 specific to THIS job>",
    "<strength 2 specific to THIS job>",
    ...
  ],
  "critical_gaps": [
    "<gap 1 - required qualification missing>",
    "<gap 2 - required qualification missing>",
    ...
  ],
  "nice_to_haves": [
    "<preferred qual 1 you have>",
    ...
  ],
  "missing_preferred": [
    "<preferred qual 1 you're missing>",
    ...
  ],
  "dealbreakers": [
    "<absolute requirement missing that makes you unsuitable for this role>",
    ...
  ],
  "interview_recommendation": "strongly_recommend|recommend|consider|not_recommended",
  "interview_focus_areas": [
    "<area 1 to prepare for in interviews>",
    "<area 2 to prepare for in interviews>",
    ...
  ],
  "missing_keywords": {
    "technical_skills": ["<missing skill 1>", ...],
    "methodologies": ["<missing methodology 1>", ...],
    "tools_technologies": ["<missing tool 1>", ...],
    "domain_knowledge": ["<missing domain area 1>", ...],
    "soft_skills": ["<missing soft skill 1>", ...]
  },
  "recommended_additions": [
    {
      "section": "skills|experience|summary|projects",
      "content": "<specific content to add for THIS job>",
      "reason": "<why this helps for THIS specific role>",
      "priority": "high|medium|low",
      "impact": "<expected impact on match score>"
    }
  ],
  "gaps": [
    {
      "requirement": "<specific job requirement>",
      "severity": "critical|important|nice-to-have",
      "current_level": "<what you currently have>",
      "required_level": "<what the job needs>",
      "suggestion": "<how to address this gap>"
    }
  ],
  "experience_level_match": {
    "job_level": "entry|mid|senior|lead|executive",
    "your_level": "entry|mid|senior|lead|executive",
    "match": "perfect|close|mismatch",
    "notes": "<explanation of level match/mismatch>"
  }
}
`
