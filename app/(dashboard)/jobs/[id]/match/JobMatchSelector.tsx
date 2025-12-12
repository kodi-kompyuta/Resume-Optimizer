'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Resume {
  id: string
  original_filename: string
  created_at: string
  ats_score?: number
  version_name?: string
  status: string
}

interface ExistingMatch {
  id: string
  resume_id: string
  match_score?: number
  created_at: string
}

interface Props {
  jobId: string
  resumes: Resume[]
  existingMatches: ExistingMatch[]
}

export default function JobMatchSelector({ jobId, resumes, existingMatches }: Props) {
  const [selectedResume, setSelectedResume] = useState<string | null>(null)
  const [matching, setMatching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  // Auto-refresh when there are processing resumes
  useEffect(() => {
    const hasProcessingResumes = resumes.some(r => r.status === 'processing')
    if (!hasProcessingResumes) return

    console.log('[JobMatchSelector] Found processing resumes, starting auto-refresh')

    const intervalId = setInterval(() => {
      console.log('[JobMatchSelector] Refreshing to check resume status...')
      router.refresh()
    }, 3000) // Check every 3 seconds

    return () => {
      console.log('[JobMatchSelector] Cleanup - stopped auto-refresh')
      clearInterval(intervalId)
    }
  }, [resumes, router])

  const getMatchForResume = (resumeId: string) => {
    return existingMatches.find(m => m.resume_id === resumeId)
  }

  const handleMatch = async () => {
    if (!selectedResume) {
      setError('Please select a resume')
      return
    }

    setMatching(true)
    setError(null)

    try {
      const response = await fetch('/api/match', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resume_id: selectedResume,
          job_description_id: jobId,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Match analysis failed')
      }

      // Redirect to match results
      router.push(`/match/${data.matchId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze match')
      setMatching(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Resume Selection */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900">Select a Resume to Match</h3>
          {resumes && resumes.length > 0 && (
            <Link
              href={`/upload?jobId=${jobId}`}
              className="inline-flex items-center px-3 py-2 text-sm bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Upload Resume
            </Link>
          )}
        </div>

        {!resumes || resumes.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-500 mb-4">You don't have any resumes yet</p>
            <Link
              href={`/upload?jobId=${jobId}`}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              Upload a Resume
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {resumes.map((resume) => {
              const existingMatch = getMatchForResume(resume.id)
              const isSelected = selectedResume === resume.id

              return (
                <div
                  key={resume.id}
                  onClick={() => setSelectedResume(resume.id)}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      {/* Radio Button */}
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        isSelected ? 'border-blue-600' : 'border-gray-300'
                      }`}>
                        {isSelected && (
                          <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                        )}
                      </div>

                      {/* Resume Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-gray-900">
                            {resume.version_name || resume.original_filename}
                          </h4>
                          {resume.status === 'processing' && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              <svg className="w-3 h-3 mr-1 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Analyzing
                            </span>
                          )}
                          {existingMatch && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Previously Matched
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">
                          Uploaded {new Date(resume.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </p>
                      </div>

                      {/* Scores */}
                      <div className="flex items-center gap-6">
                        {resume.status === 'completed' && resume.ats_score ? (
                          <div className="text-center">
                            <div className="text-xs text-gray-600 mb-1">ATS Score</div>
                            <div className={`text-lg font-bold ${
                              resume.ats_score >= 80 ? 'text-green-600' :
                              resume.ats_score >= 60 ? 'text-yellow-600' :
                              'text-red-600'
                            }`}>
                              {resume.ats_score}
                            </div>
                          </div>
                        ) : resume.status === 'processing' ? (
                          <div className="text-center">
                            <div className="text-xs text-gray-600 mb-1">ATS Score</div>
                            <div className="text-sm text-gray-400">
                              Pending
                            </div>
                          </div>
                        ) : null}

                        {existingMatch?.match_score !== undefined && (
                          <div className="text-center">
                            <div className="text-xs text-gray-600 mb-1">Job Match</div>
                            <div className={`text-lg font-bold ${
                              existingMatch.match_score >= 80 ? 'text-green-600' :
                              existingMatch.match_score >= 60 ? 'text-yellow-600' :
                              'text-red-600'
                            }`}>
                              {existingMatch.match_score}%
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* View Previous Match */}
                    {existingMatch && (
                      <Link
                        href={`/match/${existingMatch.id}`}
                        className="ml-4 text-sm text-blue-600 hover:text-blue-700 font-medium"
                        onClick={(e) => e.stopPropagation()}
                      >
                        View Match →
                      </Link>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-3">
            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <p>{error}</p>
          </div>
        )}

        {/* Action Button */}
        {resumes && resumes.length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={handleMatch}
              disabled={!selectedResume || matching}
              className={`w-full px-8 py-4 rounded-lg font-semibold text-white transition-all ${
                !selectedResume || matching
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl'
              }`}
            >
              {matching ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Analyzing Match...
                </span>
              ) : (
                'Analyze Job Match'
              )}
            </button>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="bg-purple-50 border border-purple-100 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900 mb-1">What You'll Get</h4>
            <ul className="text-sm text-gray-600 space-y-1 mb-3">
              <li>• <strong>Match Score</strong> - Overall compatibility percentage</li>
              <li>• <strong>Missing Keywords</strong> - Important terms to add to your resume</li>
              <li>• <strong>Skills Gap Analysis</strong> - What the job requires vs what you have</li>
              <li>• <strong>Tailored Suggestions</strong> - Specific improvements for this job</li>
            </ul>
            <p className="text-xs text-purple-700 bg-purple-100 rounded px-3 py-2">
              💡 <strong>Tip:</strong> You can match any uploaded resume immediately. General ATS analysis (shown in scores above) runs in the background and isn't required for job matching.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}