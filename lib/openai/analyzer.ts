import OpenAI from 'openai';
import { AnalysisData } from '@/types';
import { ATS_SCORING_CRITERIA } from '@/lib/config/ats-scoring';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

const RESUME_ANALYSIS_PROMPT = `You are an expert resume analyzer and ATS (Applicant Tracking System) specialist.

Analyze the following resume and provide detailed feedback on its ATS compatibility and overall quality.

IMPORTANT: This is a general resume analysis (no specific job description provided).
Focus on:
- ATS-friendly formatting and structure
- Keyword richness and specificity
- Quantified achievements and impact
- Professional presentation
- Completeness of information

RESUME TEXT:
{resume_text}

Provide your analysis in the following JSON format ONLY (no markdown, no code blocks, just pure JSON):

{
  "ats_score": <number 0-100>,
  "score_breakdown": {
    "ats_compatibility": <0-30>,
    "keywords": <0-25>,
    "impact": <0-20>,
    "clarity": <0-15>,
    "completeness": <0-10>
  },
  "overall_assessment": "<brief summary of resume quality>",
  "strengths": [
    "<strength 1>",
    "<strength 2>"
  ],
  "weaknesses": [
    {
      "issue": "<description>",
      "severity": "high|medium|low",
      "suggestion": "<how to fix>"
    }
  ],
  "keyword_suggestions": [
    {
      "keyword": "<keyword or skill>",
      "reason": "<why it's important>",
      "where_to_add": "<which section>"
    }
  ],
  "bullet_point_analysis": [
    {
      "original": "<original bullet point>",
      "improved": "<improved version>",
      "reason": "<why this is better>"
    }
  ],
  "formatting_issues": [
    "<issue 1>",
    "<issue 2>"
  ],
  "action_items": [
    {
      "priority": "high|medium|low",
      "action": "<what to do>",
      "impact": "<expected result>"
    }
  ]
}

**Scoring Criteria:**
- **ATS Compatibility (30%)**: Standard formatting, parseable content, clear section headers, no images/graphics
- **Keywords (25%)**: Specific technical terms, tools, methodologies (use exact names), certifications
- **Impact (20%)**: Quantified achievements (numbers, percentages, metrics), strong action verbs
- **Clarity (15%)**: Clear structure, easy to scan, consistent formatting, proper hierarchy
- **Completeness (10%)**: All relevant sections present (summary, experience, education, skills)

Be specific and actionable in your feedback. Use exact terminology when suggesting keywords.`;

export async function analyzeResume(resumeText: string): Promise<AnalysisData> {
  try {
    console.log('[Analyzer] Starting resume analysis...');
    const prompt = RESUME_ANALYSIS_PROMPT.replace('{resume_text}', resumeText);

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o', // GPT-4 Turbo - good balance of cost and quality
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
      temperature: 0.0, // CRITICAL: 0.0 for deterministic scoring (same resume = same score)
      max_tokens: 4000,
      response_format: { type: 'json_object' }, // Forces JSON response
    });

    const responseText = completion.choices[0].message.content;

    if (!responseText) {
      console.error('[Analyzer] No response text from OpenAI');
      throw new Error('No response from OpenAI');
    }

    console.log('[Analyzer] Received response from OpenAI, parsing JSON...');
    const analysisData: AnalysisData = JSON.parse(responseText);

    // Validate that ats_score exists and is a number
    if (typeof analysisData.ats_score !== 'number') {
      console.error('[Analyzer] Missing or invalid ats_score in response:', analysisData);
      console.error('[Analyzer] Full response:', responseText.substring(0, 500));

      // Try to extract ats_score from different possible locations
      const score = (analysisData as any).ats_score
        || (analysisData as any).score
        || (analysisData as any).overall_score
        || 0;

      analysisData.ats_score = typeof score === 'number' ? score : 0;
      console.warn('[Analyzer] Set fallback ats_score to:', analysisData.ats_score);
    } else {
      console.log('[Analyzer] Successfully parsed ats_score:', analysisData.ats_score);
    }

    // Ensure all required fields exist with defaults
    if (!analysisData.score_breakdown) {
      console.warn('[Analyzer] Missing score_breakdown, using defaults');
      analysisData.score_breakdown = {
        ats_compatibility: 0,
        keywords: 0,
        impact: 0,
        clarity: 0,
        completeness: 0
      };
    }

    if (!analysisData.strengths) {
      analysisData.strengths = [];
    }

    if (!analysisData.weaknesses) {
      analysisData.weaknesses = [];
    }

    return analysisData;
  } catch (error) {
    console.error('[Analyzer] Error analyzing resume:', error);
    if (error instanceof Error) {
      console.error('[Analyzer] Error message:', error.message);
      console.error('[Analyzer] Error stack:', error.stack);
    }
    throw new Error('Failed to analyze resume');
  }
}

export async function testOpenAIConnection(): Promise<boolean> {
  try {
    await openai.models.list();
    return true;
  } catch (error) {
    console.error('OpenAI connection failed:', error);
    return false;
  }
}