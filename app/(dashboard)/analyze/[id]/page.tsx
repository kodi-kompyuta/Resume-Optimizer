import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { AnalysisData } from '@/types'
import { RefreshButton } from './RefreshButton'

export default async function AnalyzePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch resume data
  const { data: resume, error } = await supabase
    .from('resumes')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error || !resume) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-red-900 mb-2">Resume Not Found</h2>
          <p className="text-red-700 mb-4">The resume you're looking for doesn't exist or you don't have access to it.</p>
          <Link href="/dashboard" className="text-blue-600 hover:text-blue-700 font-medium">
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  const analysisData = (resume.analysis_data && typeof resume.analysis_data === 'object')
    ? resume.analysis_data as AnalysisData
    : null

  // Processing state
  if (resume.status === 'processing') {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="mb-6">
            <svg className="animate-spin h-16 w-16 text-blue-600 mx-auto" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Analyzing Your Resume...</h2>
          <p className="text-gray-600 mb-6">
            Our AI is analyzing "{resume.original_filename}". This usually takes 10-30 seconds.
          </p>
          <p className="text-sm text-gray-500">
            You can refresh this page or wait for the analysis to complete.
          </p>
          <div className="mt-6">
            <RefreshButton />
          </div>
        </div>
      </div>
    )
  }

  // Failed state
  if (resume.status === 'failed') {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-red-900 mb-2">Analysis Failed</h2>
          <p className="text-red-700 mb-4">
            We encountered an error while analyzing your resume. Please try uploading again.
          </p>
          <Link
            href="/upload"
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
          >
            Upload New Resume
          </Link>
        </div>
      </div>
    )
  }

  // Completed state - show results
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreRating = (score: number) => {
    if (score >= 80) return 'Excellent'
    if (score >= 60) return 'Good'
    if (score >= 40) return 'Needs Improvement'
    return 'Poor'
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/dashboard"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-2"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">{resume.original_filename}</h1>
          <p className="text-sm text-gray-500 mt-1">
            Analyzed on {new Date(resume.analyzed_at || resume.created_at).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        </div>
        <Link
          href="/upload"
          className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
        >
          Upload New Resume
        </Link>
      </div>

      {/* ATS Score Card */}
      <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl shadow-lg p-8 text-white">
        <h2 className="text-2xl font-bold mb-6">ATS Compatibility Score</h2>
        <div className="flex items-center justify-between">
          <div className="flex items-baseline">
            <div className="text-7xl font-bold">{resume.ats_score}</div>
            <div className="text-3xl text-blue-100 ml-2">/100</div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-semibold mb-2">{getScoreRating(resume.ats_score || 0)}</div>
            <div className="bg-white bg-opacity-20 rounded-full h-4 w-64">
              <div
                className="bg-white rounded-full h-4 transition-all"
                style={{ width: `${resume.ats_score}%` }}
              />
            </div>
          </div>
        </div>
        {analysisData?.overall_assessment && (
          <p className="mt-6 text-blue-50 text-lg">{analysisData.overall_assessment}</p>
        )}
      </div>

      {/* Strengths */}
      {analysisData?.strengths && analysisData.strengths.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <span className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </span>
            Strengths
          </h3>
          <ul className="space-y-2">
            {analysisData.strengths.map((strength, index) => (
              <li key={index} className="flex items-start">
                <span className="text-green-600 mr-3 mt-1">✓</span>
                <span className="text-gray-700">{strength}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Weaknesses / Areas for Improvement */}
      {analysisData?.weaknesses && analysisData.weaknesses.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <span className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center mr-3">
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>
            Areas for Improvement
          </h3>
          <div className="space-y-4">
            {analysisData.weaknesses.map((weakness, index) => (
              <div key={index} className="border-l-4 border-red-300 pl-4 py-2">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-gray-900">{weakness.issue}</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    weakness.severity === 'high' ? 'bg-red-100 text-red-700' :
                    weakness.severity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {weakness.severity}
                  </span>
                </div>
                <p className="text-sm text-gray-600">💡 {weakness.suggestion}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Keyword Suggestions */}
      {analysisData?.keyword_suggestions && analysisData.keyword_suggestions.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <span className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
              </svg>
            </span>
            Keyword Suggestions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {analysisData.keyword_suggestions.map((kw, index) => (
              <div key={index} className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="font-semibold text-blue-900 mb-1">{kw.keyword}</div>
                <div className="text-sm text-blue-700 mb-2">{kw.reason}</div>
                <div className="text-xs text-blue-600">Add to: {kw.where_to_add}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bullet Point Improvements */}
      {analysisData?.bullet_point_analysis && analysisData.bullet_point_analysis.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <span className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </span>
            Bullet Point Improvements
          </h3>
          <div className="space-y-6">
            {analysisData.bullet_point_analysis.map((bp, index) => (
              <div key={index} className="space-y-3">
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="text-xs font-semibold text-red-600 mb-1">BEFORE:</div>
                  <div className="text-gray-700">{bp.original}</div>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="text-xs font-semibold text-green-600 mb-1">IMPROVED:</div>
                  <div className="text-gray-700">{bp.improved}</div>
                </div>
                <div className="text-sm text-gray-600 italic pl-3">💡 {bp.reason}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Formatting Issues */}
      {analysisData?.formatting_issues && analysisData.formatting_issues.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <span className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center mr-3">
              <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
            </span>
            Formatting Issues
          </h3>
          <ul className="space-y-2">
            {analysisData.formatting_issues.map((issue, index) => (
              <li key={index} className="flex items-start">
                <span className="text-yellow-600 mr-3 mt-1">⚠</span>
                <span className="text-gray-700">{issue}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Action Items */}
      {analysisData?.action_items && analysisData.action_items.length > 0 && (
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl shadow-lg p-6 text-white">
          <h3 className="text-xl font-bold mb-4 flex items-center">
            <span className="w-8 h-8 bg-white bg-opacity-20 rounded-lg flex items-center justify-center mr-3">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </span>
            Action Items (Priority Order)
          </h3>
          <div className="space-y-3">
            {analysisData.action_items
              .sort((a, b) => {
                const priorityOrder: Record<'high' | 'medium' | 'low', number> = { high: 0, medium: 1, low: 2 }
                return priorityOrder[a.priority] - priorityOrder[b.priority]
              })
              .map((item, index) => (
                <div key={index} className="bg-white bg-opacity-10 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      item.priority === 'high' ? 'bg-red-500' :
                      item.priority === 'medium' ? 'bg-yellow-500' :
                      'bg-blue-500'
                    }`}>
                      {item.priority.toUpperCase()}
                    </span>
                    <span className="font-semibold">{item.action}</span>
                  </div>
                  <p className="text-sm text-gray-300">Expected impact: {item.impact}</p>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Bottom Actions */}
      <div className="flex gap-4 justify-center pb-8">
        <Link
          href="/upload"
          className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-lg"
        >
          Analyze Another Resume
        </Link>
        <Link
          href="/dashboard"
          className="px-8 py-3 bg-white border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  )
}