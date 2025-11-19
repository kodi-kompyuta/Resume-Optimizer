import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { MatchAnalysis, RecommendedAddition, Gap } from '@/types'

export default async function MatchResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch match data with related resume and job
  const { data: match, error } = await supabase
    .from('resume_job_matches')
    .select(`
      *,
      resumes!resume_job_matches_resume_id_fkey (
        id,
        original_filename,
        version_name,
        ats_score
      ),
      job_descriptions!resume_job_matches_job_description_id_fkey (
        id,
        job_title,
        company_name,
        location
      )
    `)
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error || !match) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-red-900 mb-2">Match Not Found</h2>
          <p className="text-red-700 mb-4">The match analysis you're looking for doesn't exist.</p>
          <Link href="/jobs" className="text-blue-600 hover:text-blue-700 font-medium">
            Back to Jobs
          </Link>
        </div>
      </div>
    )
  }

  const matchAnalysis = match.match_analysis as MatchAnalysis
  const recommendedAdditions = match.recommended_additions as RecommendedAddition[]
  const gaps = match.gaps as Gap[]
  const missingKeywords = match.missing_keywords as string[]
  const strengths = match.strengths as string[]

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-100'
    if (score >= 60) return 'bg-yellow-100'
    return 'bg-red-100'
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/jobs"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Jobs
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{match.job_descriptions.job_title}</h1>
            {match.job_descriptions.company_name && (
              <p className="text-xl text-gray-600 mt-1">{match.job_descriptions.company_name}</p>
            )}
            <p className="text-sm text-gray-500 mt-2">
              Resume: {match.resumes.version_name || match.resumes.original_filename}
            </p>
          </div>
          <Link
            href={`/cover-letter/new?resume=${match.resume_id}&job=${match.job_description_id}`}
            className="px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors"
          >
            Generate Cover Letter
          </Link>
        </div>
      </div>

      {/* Overall Match Score */}
      <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl shadow-lg p-8 text-white">
        <h2 className="text-2xl font-bold mb-6">Job Match Score</h2>
        <div className="flex items-center justify-between">
          <div className="flex items-baseline">
            <div className="text-7xl font-bold">{matchAnalysis.match_score}</div>
            <div className="text-3xl text-blue-100 ml-2">%</div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-semibold mb-2">
              {matchAnalysis.match_score >= 80 ? 'Excellent Match' :
               matchAnalysis.match_score >= 60 ? 'Good Match' :
               matchAnalysis.match_score >= 40 ? 'Fair Match' : 'Poor Match'}
            </div>
            <div className="bg-white bg-opacity-20 rounded-full h-4 w-64">
              <div
                className="bg-white rounded-full h-4 transition-all"
                style={{ width: `${matchAnalysis.match_score}%` }}
              />
            </div>
          </div>
        </div>
        {matchAnalysis.overall_fit && (
          <p className="mt-6 text-blue-50 text-lg">{matchAnalysis.overall_fit}</p>
        )}
      </div>

      {/* Detailed Score Breakdown */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-6">Match Breakdown</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Technical Match */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Technical Skills</span>
              <span className={`text-2xl font-bold ${getScoreColor(matchAnalysis.technical_match)}`}>
                {matchAnalysis.technical_match}%
              </span>
            </div>
            <div className="bg-gray-200 rounded-full h-3">
              <div
                className={`${getScoreBg(matchAnalysis.technical_match)} h-3 rounded-full transition-all`}
                style={{ width: `${matchAnalysis.technical_match}%` }}
              />
            </div>
          </div>

          {/* Experience Match */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Experience Level</span>
              <span className={`text-2xl font-bold ${getScoreColor(matchAnalysis.experience_match)}`}>
                {matchAnalysis.experience_match}%
              </span>
            </div>
            <div className="bg-gray-200 rounded-full h-3">
              <div
                className={`${getScoreBg(matchAnalysis.experience_match)} h-3 rounded-full transition-all`}
                style={{ width: `${matchAnalysis.experience_match}%` }}
              />
            </div>
          </div>

          {/* Education Match */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Education</span>
              <span className={`text-2xl font-bold ${getScoreColor(matchAnalysis.education_match)}`}>
                {matchAnalysis.education_match}%
              </span>
            </div>
            <div className="bg-gray-200 rounded-full h-3">
              <div
                className={`${getScoreBg(matchAnalysis.education_match)} h-3 rounded-full transition-all`}
                style={{ width: `${matchAnalysis.education_match}%` }}
              />
            </div>
          </div>

          {/* Skills Match */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Listed Skills</span>
              <span className={`text-2xl font-bold ${getScoreColor(matchAnalysis.skills_match)}`}>
                {matchAnalysis.skills_match}%
              </span>
            </div>
            <div className="bg-gray-200 rounded-full h-3">
              <div
                className={`${getScoreBg(matchAnalysis.skills_match)} h-3 rounded-full transition-all`}
                style={{ width: `${matchAnalysis.skills_match}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Key Strengths */}
      {strengths && strengths.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <span className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>
            Key Strengths (What Makes You a Great Fit)
          </h3>
          <ul className="space-y-2">
            {strengths.map((strength, index) => (
              <li key={index} className="flex items-start">
                <span className="text-green-600 mr-3 mt-1">✓</span>
                <span className="text-gray-700">{strength}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Missing Keywords */}
      {missingKeywords && missingKeywords.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <span className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
              <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
              </svg>
            </span>
            Missing Keywords
          </h3>
          <p className="text-sm text-gray-600 mb-4">Add these keywords to improve your match score</p>
          <div className="flex flex-wrap gap-2">
            {missingKeywords.map((keyword, index) => (
              <span
                key={index}
                className="px-4 py-2 bg-orange-50 border border-orange-200 text-orange-900 rounded-lg font-medium"
              >
                {keyword}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Critical Gaps */}
      {gaps && gaps.filter(g => g.severity === 'critical').length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <span className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center mr-3">
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </span>
            Critical Gaps
          </h3>
          <div className="space-y-4">
            {gaps.filter(g => g.severity === 'critical').map((gap, index) => (
              <div key={index} className="border-l-4 border-red-500 pl-4 py-2">
                <div className="font-semibold text-red-900 mb-1">{gap.requirement}</div>
                <p className="text-sm text-gray-600">💡 {gap.suggestion}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommended Additions */}
      {recommendedAdditions && recommendedAdditions.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <span className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </span>
            Recommended Additions
          </h3>
          <div className="space-y-6">
            {recommendedAdditions
              .sort((a, b) => {
                const priorityOrder = { high: 0, medium: 1, low: 2 }
                return priorityOrder[a.priority] - priorityOrder[b.priority]
              })
              .map((addition, index) => (
                <div key={index} className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      addition.priority === 'high' ? 'bg-red-500 text-white' :
                      addition.priority === 'medium' ? 'bg-yellow-500 text-white' :
                      'bg-blue-500 text-white'
                    }`}>
                      {addition.priority.toUpperCase()}
                    </span>
                    <span className="text-xs font-medium text-blue-900 uppercase">{addition.section}</span>
                  </div>
                  <div className="font-semibold text-gray-900 mb-1">{addition.content}</div>
                  <p className="text-sm text-gray-600">{addition.reason}</p>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Dealbreakers (if any) */}
      {matchAnalysis.dealbreakers && matchAnalysis.dealbreakers.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <h3 className="text-xl font-bold text-red-900 mb-4 flex items-center">
            <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Potential Dealbreakers
          </h3>
          <ul className="space-y-2">
            {matchAnalysis.dealbreakers.map((dealbreaker, index) => (
              <li key={index} className="flex items-start">
                <span className="text-red-600 mr-3 mt-1">⚠</span>
                <span className="text-red-900">{dealbreaker}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-4 justify-center pb-8">
        <Link
          href={`/cover-letter/new?resume=${match.resume_id}&job=${match.job_description_id}`}
          className="px-8 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors shadow-lg"
        >
          Generate Cover Letter
        </Link>
        <Link
          href={`/analyze/${match.resume_id}`}
          className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-lg"
        >
          View Resume Analysis
        </Link>
        <Link
          href="/jobs"
          className="px-8 py-3 bg-white border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
        >
          Back to Jobs
        </Link>
      </div>
    </div>
  )
}