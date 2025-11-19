import OpenAI from 'openai';
import { AnalysisData } from '@/types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

const RESUME_ANALYSIS_PROMPT = `You are an expert resume analyzer and ATS (Applicant Tracking System) specialist.

Analyze the following resume and provide detailed feedback.

RESUME TEXT:
{resume_text}

Provide your analysis in the following JSON format ONLY (no markdown, no code blocks, just pure JSON):

{
  "ats_score": <number 0-100>,
  "overall_assessment": "<brief summary>",
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
      "keyword": "<keyword>",
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

Scoring criteria:
- ATS Compatibility (30%): Standard formatting, parseable content
- Keywords (25%): Industry-relevant terms, job-specific skills
- Impact (20%): Quantified achievements, strong action verbs
- Clarity (15%): Clear structure, easy to scan
- Completeness (10%): All relevant sections present

Be specific and actionable in your feedback.`;

export async function analyzeResume(resumeText: string): Promise<AnalysisData> {
  try {
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
      temperature: 0.7,
      max_tokens: 4000,
      response_format: { type: 'json_object' }, // Forces JSON response
    });

    const responseText = completion.choices[0].message.content;
    
    if (!responseText) {
      throw new Error('No response from OpenAI');
    }

    const analysisData: AnalysisData = JSON.parse(responseText);
    
    return analysisData;
  } catch (error) {
    console.error('Error analyzing resume:', error);
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