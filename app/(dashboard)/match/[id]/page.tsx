import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

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
      resume:resumes(id, original_filename),
      job:job_descriptions(id, job_title, company_name)
    `)
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error || !match) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-red-900 mb-2">Match Not Found</h2>
          <p className="text-red-700 mb-4">The match results you're looking for don't exist.</p>
          <Link href="/dashboard" className="text-blue-600 hover:text-blue-700 font-medium">
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreRating = (score: number) => {
    if (score >= 80) return 'Excellent Match'
    if (score >= 60) return 'Good Match'
    if (score >= 40) return 'Fair Match'
    return 'Needs Improvement'
  }

  const matchAnalysis = match.match_analysis as any

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/jobs"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-2"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Jobs
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Match Results</h1>
          <p className="text-gray-600 mt-1">
            {match.resume?.original_filename} vs {match.job?.job_title}
            {match.job?.company_name && ` at ${match.job.company_name}`}
          </p>
        </div>
      </div>

      {/* Match Score Card */}
      <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl shadow-lg p-8 text-white">
        <h2 className="text-2xl font-bold mb-6">Match Score</h2>
        <div className="flex items-center justify-between">
          <div className="flex items-baseline">
            <div className="text-7xl font-bold">{match.match_score}</div>
            <div className="text-3xl text-blue-100 ml-2">%</div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-semibold mb-2">{getScoreRating(match.match_score || 0)}</div>
            <div className="bg-white bg-opacity-20 rounded-full h-4 w-64">
              <div
                className="bg-white rounded-full h-4 transition-all"
                style={{ width: `${match.match_score}%` }}
              />
            </div>
          </div>
        </div>
        {matchAnalysis?.summary && (
          <p className="mt-6 text-blue-50 text-lg">{matchAnalysis.summary}</p>
        )}
      </div>

      {/* Key Strengths */}
      {match.strengths && match.strengths.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <span className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </span>
            Key Strengths
          </h3>
          <ul className="space-y-2">
            {match.strengths.map((strength: any, index: number) => {
              // Handle both string and object formats
              const strengthText = typeof strength === 'string' ? strength : (strength.strength || strength.description || JSON.stringify(strength))
              return (
                <li key={index} className="flex items-start">
                  <span className="text-green-600 mr-3 mt-1">✓</span>
                  <span className="text-gray-700">{strengthText}</span>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {/* Gaps / Missing Skills */}
      {match.gaps && match.gaps.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <span className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center mr-3">
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>
            Gaps & Missing Skills
          </h3>
          <div className="space-y-3">
            {match.gaps.map((gap: any, index: number) => {
              // Handle both string and object formats
              if (typeof gap === 'string') {
                return (
                  <div key={index} className="flex items-start">
                    <span className="text-red-600 mr-3 mt-1">⚠</span>
                    <span className="text-gray-700">{gap}</span>
                  </div>
                )
              }
              // Handle object format with requirement, severity, suggestion
              return (
                <div key={index} className="border-l-4 border-red-300 pl-4 py-2">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-gray-900">{gap.requirement}</span>
                    {gap.severity && (
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        gap.severity === 'high' ? 'bg-red-100 text-red-700' :
                        gap.severity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {gap.severity}
                      </span>
                    )}
                  </div>
                  {gap.suggestion && (
                    <p className="text-sm text-gray-600">💡 {gap.suggestion}</p>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Missing Keywords */}
      {match.missing_keywords && match.missing_keywords.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <span className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center mr-3">
              <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
              </svg>
            </span>
            Missing Keywords
          </h3>
          <div className="flex flex-wrap gap-2">
            {match.missing_keywords.map((keyword: any, index: number) => {
              // Handle both string and object formats
              const keywordText = typeof keyword === 'string' ? keyword : (keyword.keyword || keyword.term || JSON.stringify(keyword))
              return (
                <span
                  key={index}
                  className="px-3 py-1 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-full text-sm"
                >
                  {keywordText}
                </span>
              )
            })}
          </div>
        </div>
      )}

      {/* Recommended Additions */}
      {match.recommended_additions && match.recommended_additions.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <span className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </span>
            Recommended Additions
          </h3>
          <div className="space-y-3">
            {match.recommended_additions.map((addition: any, index: number) => {
              // Handle both string and object formats
              if (typeof addition === 'string') {
                return (
                  <div key={index} className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="text-blue-900">{addition}</div>
                  </div>
                )
              }
              // Handle object format
              const content = addition.content || addition.suggestion || addition.description
              const reason = addition.reason
              const section = addition.section
              const priority = addition.priority

              return (
                <div key={index} className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="font-semibold text-blue-900 flex-1">{content}</div>
                    {priority && (
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        priority === 'high' ? 'bg-red-100 text-red-700' :
                        priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {priority}
                      </span>
                    )}
                  </div>
                  {reason && (
                    <div className="text-sm text-blue-700 mb-1">💡 {reason}</div>
                  )}
                  {section && (
                    <div className="text-xs text-blue-600">Add to: {section}</div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Bottom Actions */}
      <div className="flex gap-4 justify-center pb-8">
        <Link
          href={`/analyze/${match.resume_id}`}
          className="px-8 py-3 bg-white border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
        >
          View Resume Analysis
        </Link>
        <Link
          href="/jobs"
          className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-lg"
        >
          Back to Jobs
        </Link>
      </div>
    </div>
  )
}
