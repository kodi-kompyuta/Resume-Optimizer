'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import type { AnalysisData } from '@/types'
import { createClient } from '@/lib/supabase/client'
import { AutoRefresh } from './AutoRefresh'

export default function AnalyzePage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [loading, setLoading] = useState(true)
  const [resume, setResume] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [isTemporary, setIsTemporary] = useState(false)

  useEffect(() => {
    async function loadResume() {
      try {
        // Check sessionStorage for temporary resume first
        const tempDataKey = `resume_${id}`
        const tempData = sessionStorage.getItem(tempDataKey)

        if (tempData) {
          // Temporary resume (unauthenticated user)
          const data = JSON.parse(tempData)
          setResume({
            analysis_data: data.analysis,
            structured_data: data.structured,
            ats_score: data.analysis?.ats_score || 0,
            status: 'completed',
            original_filename: 'Your Resume',
            analyzed_at: new Date().toISOString(),
            isTemporary: true
          })
          setIsTemporary(true)
          setLoading(false)
          return
        }

        // Try to load from database (authenticated user)
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (user) {
          const { data: dbResume, error: dbError } = await supabase
            .from('resumes')
            .select('*')
            .eq('id', id)
            .eq('user_id', user.id)
            .single()

          if (dbError || !dbResume) {
            setError('Resume not found or you don\'t have access to it.')
            setLoading(false)
            return
          }

          setResume(dbResume)
          setIsTemporary(false)
        } else {
          setError('Resume not found.')
        }

        setLoading(false)
      } catch (err) {
        console.error('Error loading resume:', err)
        setError('Failed to load resume')
        setLoading(false)
      }
    }

    loadResume()
  }, [id])

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="mb-6">
            <svg className="animate-spin h-16 w-16 text-blue-600 mx-auto" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Loading...</h2>
        </div>
      </div>
    )
  }

  if (error || !resume) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-red-900 mb-2">Resume Not Found</h2>
          <p className="text-red-700 mb-4">{error || 'The resume you\'re looking for doesn\'t exist or you don\'t have access to it.'}</p>
          <Link href="/upload" className="text-blue-600 hover:text-blue-700 font-medium">
            Upload a Resume
          </Link>
        </div>
      </div>
    )
  }

  const analysisData = (resume.analysis_data && typeof resume.analysis_data === 'object')
    ? resume.analysis_data as AnalysisData
    : null

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
      {/* Auto-refresh for processing resumes */}
      {resume.status === 'processing' && (
        <AutoRefresh resumeId={id} status={resume.status} />
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/upload"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-2"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">{resume.original_filename}</h1>
          {resume.analyzed_at && (
            <p className="text-sm text-gray-500 mt-1">
              Analyzed on {new Date(resume.analyzed_at).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          )}
          {isTemporary && (
            <p className="text-xs text-orange-600 mt-1">
              ⚠️ Temporary analysis - Sign in to save your results
            </p>
          )}
        </div>
        <div className="flex space-x-3">
          <Link
            href={`/optimize/${id}`}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg"
          >
            Optimize Resume
          </Link>
          <Link
            href="/upload"
            className="px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
          >
            Upload New Resume
          </Link>
        </div>
      </div>

      {/* ATS Score Card */}
      <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl shadow-lg p-8 text-white">
        <h2 className="text-2xl font-bold mb-6">ATS Compatibility Score</h2>
        <div className="flex items-center justify-between">
          <div className="flex items-baseline">
            <div className="text-7xl font-bold">{resume.ats_score ?? 0}</div>
            <div className="text-3xl text-blue-100 ml-2">/100</div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-semibold mb-2">{getScoreRating(resume.ats_score ?? 0)}</div>
            <div className="bg-white bg-opacity-20 rounded-full h-4 w-64">
              <div
                className="bg-white rounded-full h-4 transition-all"
                style={{ width: `${resume.ats_score ?? 0}%` }}
              />
            </div>
          </div>
        </div>
        {resume.status === 'processing' && (
          <div className="mt-6 bg-blue-500 bg-opacity-20 border border-blue-300 rounded-lg p-4">
            <p className="text-blue-100 text-sm flex items-start gap-2">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span><strong>Analysis in progress...</strong> Your resume is being analyzed by AI. This page will automatically refresh when complete (usually takes 5-10 seconds).</span>
            </p>
          </div>
        )}
        {!resume.ats_score && resume.status === 'completed' && (
          <div className="mt-6 bg-yellow-500 bg-opacity-20 border border-yellow-300 rounded-lg p-4">
            <p className="text-yellow-100 text-sm flex items-start gap-2">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span>Analysis completed but ATS score was not generated. This may indicate an issue with the AI analysis. Please try re-uploading your resume.</span>
            </p>
          </div>
        )}
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
          href={`/optimize/${id}`}
          className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg"
        >
          Optimize This Resume
        </Link>
        <Link
          href="/upload"
          className="px-8 py-3 bg-white border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
        >
          Analyze Another Resume
        </Link>
      </div>
    </div>
  )
}
