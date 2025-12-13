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
      resume:resumes(id, original_filename, version_name),
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

  // Fetch all matches for this job to show comparison
  const { data: allJobMatches } = await supabase
    .from('resume_job_matches')
    .select(`
      id,
      match_score,
      created_at,
      resume:resumes(id, original_filename, version_name)
    `)
    .eq('job_description_id', match.job_description_id)
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })

  // Find previous match (before current one)
  const currentMatchIndex = allJobMatches?.findIndex(m => m.id === id) ?? -1
  const previousMatch = currentMatchIndex > 0 ? allJobMatches?.[currentMatchIndex - 1] : null
  const improvement = previousMatch && match.match_score !== null && previousMatch.match_score !== null
    ? match.match_score - previousMatch.match_score
    : null

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
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Job Match Score</h2>
          {matchAnalysis?.match_level && (
            <span className="px-4 py-2 bg-white bg-opacity-20 rounded-full text-sm font-semibold uppercase tracking-wide">
              {matchAnalysis.match_level.replace('_', ' ')}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-baseline">
            <div className="text-7xl font-bold">{match.match_score ?? 0}</div>
            <div className="text-3xl text-blue-100 ml-2">%</div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-semibold mb-2">{getScoreRating(match.match_score || 0)}</div>
            <div className="bg-white bg-opacity-20 rounded-full h-4 w-64">
              <div
                className="bg-white rounded-full h-4 transition-all"
                style={{ width: `${match.match_score || 0}%` }}
              />
            </div>
          </div>
        </div>
        {matchAnalysis?.summary && (
          <p className="mt-6 text-blue-50 text-lg">{matchAnalysis.summary}</p>
        )}
        {matchAnalysis?.interview_recommendation && (
          <div className={`mt-6 rounded-lg p-4 ${
            matchAnalysis.interview_recommendation === 'strongly_recommend' ? 'bg-green-500 bg-opacity-20 border border-green-300' :
            matchAnalysis.interview_recommendation === 'recommend' ? 'bg-blue-500 bg-opacity-20 border border-blue-300' :
            matchAnalysis.interview_recommendation === 'consider' ? 'bg-yellow-500 bg-opacity-20 border border-yellow-300' :
            'bg-red-500 bg-opacity-20 border border-red-300'
          }`}>
            <p className="text-white font-semibold">
              {matchAnalysis.interview_recommendation === 'strongly_recommend' ? '🎯 Excellent Fit - Strong Candidate' :
               matchAnalysis.interview_recommendation === 'recommend' ? '👍 Good Fit - Solid Candidate' :
               matchAnalysis.interview_recommendation === 'consider' ? '🤔 Possible Fit - Some Gaps to Address' :
               '⚠️ Needs Improvement - Significant Gaps'}
            </p>
          </div>
        )}
        {(!match.match_score || match.match_score === 0) && (
          <div className="mt-6 bg-yellow-500 bg-opacity-20 border border-yellow-300 rounded-lg p-4">
            <p className="text-yellow-100 font-semibold">
              ⚠️ Match score was not generated properly. Please check the server logs for details or try matching again.
            </p>
          </div>
        )}
      </div>

      {/* Improvement Comparison Card */}
      {previousMatch && improvement !== null && (
        <div className={`rounded-xl shadow-lg p-6 ${
          improvement > 0
            ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200'
            : improvement < 0
            ? 'bg-gradient-to-br from-red-50 to-orange-50 border-2 border-red-200'
            : 'bg-gradient-to-br from-gray-50 to-slate-50 border-2 border-gray-200'
        }`}>
          <div className="flex items-center gap-3 mb-4">
            {improvement > 0 ? (
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
              </div>
            ) : improvement < 0 ? (
              <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </div>
            ) : (
              <div className="w-12 h-12 bg-gray-400 rounded-full flex items-center justify-center">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 12h14" />
                </svg>
              </div>
            )}
            <div>
              <h3 className={`text-2xl font-bold ${
                improvement > 0 ? 'text-green-900' : improvement < 0 ? 'text-red-900' : 'text-gray-900'
              }`}>
                {improvement > 0 ? 'Great Improvement!' : improvement < 0 ? 'Score Decreased' : 'No Change'}
              </h3>
              <p className={`text-sm ${
                improvement > 0 ? 'text-green-700' : improvement < 0 ? 'text-red-700' : 'text-gray-700'
              }`}>
                Compared to previous attempt
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white bg-opacity-60 rounded-lg p-4">
              <p className="text-xs text-gray-600 mb-1">Previous Resume</p>
              <p className="text-sm font-medium text-gray-900 mb-2 truncate">
                {(previousMatch.resume as any)?.version_name || (previousMatch.resume as any)?.original_filename}
              </p>
              <p className="text-3xl font-bold text-gray-700">{previousMatch.match_score}%</p>
            </div>

            <div className="flex items-center justify-center">
              <div className={`text-4xl font-bold ${
                improvement > 0 ? 'text-green-600' : improvement < 0 ? 'text-red-600' : 'text-gray-600'
              }`}>
                {improvement > 0 ? '+' : ''}{improvement}%
              </div>
            </div>

            <div className="bg-white bg-opacity-60 rounded-lg p-4">
              <p className="text-xs text-gray-600 mb-1">Current Resume</p>
              <p className="text-sm font-medium text-gray-900 mb-2 truncate">
                {(match.resume as any)?.version_name || (match.resume as any)?.original_filename}
              </p>
              <p className={`text-3xl font-bold ${
                improvement > 0 ? 'text-green-600' : improvement < 0 ? 'text-red-600' : 'text-gray-700'
              }`}>
                {match.match_score}%
              </p>
            </div>
          </div>

          {improvement > 0 && (
            <div className="mt-4 bg-green-100 border border-green-300 rounded-lg p-3">
              <p className="text-sm text-green-900">
                🎉 <strong>Nice work!</strong> Your optimizations resulted in a {improvement}% improvement in job match score. Keep refining your resume to get even closer to your target role!
              </p>
            </div>
          )}

          {improvement < 0 && (
            <div className="mt-4 bg-orange-100 border border-orange-300 rounded-lg p-3">
              <p className="text-sm text-orange-900">
                💡 <strong>Tip:</strong> The score decreased by {Math.abs(improvement)}%. Review the missing keywords and gaps sections below to understand what the job requires. Consider using the optimization feature to better align your resume with this role.
              </p>
            </div>
          )}

          {allJobMatches && allJobMatches.length > 1 && (
            <div className="mt-4 pt-4 border-t border-gray-300">
              <p className="text-xs text-gray-600 mb-2">Match History for this Job ({allJobMatches.length} attempts)</p>
              <div className="flex gap-2 overflow-x-auto">
                {allJobMatches.map((m: any, idx: number) => (
                  <Link
                    key={m.id}
                    href={`/match/${m.id}`}
                    className={`flex-shrink-0 px-3 py-2 rounded-lg text-sm ${
                      m.id === id
                        ? 'bg-blue-600 text-white font-semibold'
                        : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                    }`}
                  >
                    <div className="text-xs opacity-80">Attempt {idx + 1}</div>
                    <div className="font-bold">{m.match_score}%</div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Interview Focus Areas */}
      {matchAnalysis?.interview_focus_areas && matchAnalysis.interview_focus_areas.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <span className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>
            Interview Preparation Areas
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Be prepared to discuss these areas in your interview to demonstrate your fit for this role:
          </p>
          <ul className="space-y-2">
            {matchAnalysis.interview_focus_areas.map((area, index) => (
              <li key={index} className="flex items-start">
                <span className="text-purple-600 mr-3 mt-1">•</span>
                <span className="text-gray-700">{area}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Experience Level Match */}
      {matchAnalysis?.experience_level_match && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <span className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center mr-3">
              <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </span>
            Experience Level Match
          </h3>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs text-gray-600 mb-1">Job Level</p>
              <p className="text-lg font-semibold text-gray-900 capitalize">
                {matchAnalysis.experience_level_match.job_level}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs text-gray-600 mb-1">Your Level</p>
              <p className="text-lg font-semibold text-gray-900 capitalize">
                {matchAnalysis.experience_level_match.your_level || matchAnalysis.experience_level_match.candidate_level}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs text-gray-600 mb-1">Level Match</p>
              <p className={`text-lg font-semibold capitalize ${
                matchAnalysis.experience_level_match.match === 'perfect' ? 'text-green-600' :
                matchAnalysis.experience_level_match.match === 'close' ? 'text-yellow-600' :
                'text-red-600'
              }`}>
                {matchAnalysis.experience_level_match.match}
              </p>
            </div>
          </div>
          <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-4">
            {matchAnalysis.experience_level_match.notes}
          </p>
        </div>
      )}

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

      {/* Optimize CTA */}
      {match.match_score < 90 && (
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl shadow-lg p-8 text-white">
          <div className="flex items-start justify-between gap-6">
            <div className="flex-1">
              <h3 className="text-2xl font-bold mb-2">Ready to improve your match score?</h3>
              <p className="text-blue-100 text-lg mb-4">
                Optimize your resume specifically for this job to increase your chances of getting an interview.
              </p>
              <ul className="text-blue-50 space-y-2 mb-6">
                <li className="flex items-start">
                  <svg className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Automatically add missing keywords from the job description</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Enhance bullet points to highlight relevant experience</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Improve ATS compatibility and readability</span>
                </li>
              </ul>
              <Link
                href={`/optimize/${match.resume_id}?jobId=${match.job_description_id}`}
                className="inline-flex items-center px-8 py-4 bg-white text-purple-600 font-bold rounded-lg hover:bg-gray-100 transition-all shadow-lg hover:shadow-xl"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Optimize Resume for This Job
              </Link>
            </div>
            <div className="hidden lg:block">
              <svg className="w-32 h-32 text-blue-400 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
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
