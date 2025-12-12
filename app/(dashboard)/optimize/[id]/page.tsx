'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  OptimizationResult,
  OptimizationOptions,
  ChangeLog,
  HighlightedChange,
} from '@/types'

export default function OptimizePage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const resumeId = params.id as string
  const jobId = searchParams.get('jobId')

  const [loading, setLoading] = useState(false)
  const [optimizing, setOptimizing] = useState(false)
  const [applying, setApplying] = useState(false)
  const [result, setResult] = useState<OptimizationResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [jobDescription, setJobDescription] = useState<string>('')
  const [jobTitle, setJobTitle] = useState<string>('')

  // Optimization options
  const [options, setOptions] = useState<OptimizationOptions>({
    improveBulletPoints: true,
    addKeywords: true,
    fixGrammar: true,
    enhanceSections: true,
    preserveLength: false,
    aggressiveness: 'moderate',
  })

  // Track which changes are accepted
  const [acceptedChanges, setAcceptedChanges] = useState<Set<string>>(new Set())

  // Fetch job description if jobId is provided
  useEffect(() => {
    const fetchJobDescription = async () => {
      if (!jobId) return

      setLoading(true)
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('job_descriptions')
          .select('job_title, job_description')
          .eq('id', jobId)
          .single()

        if (error) throw error

        if (data) {
          setJobDescription(data.job_description)
          setJobTitle(data.job_title)
        }
      } catch (err: any) {
        console.error('Error fetching job description:', err)
        setError('Failed to load job description')
      } finally {
        setLoading(false)
      }
    }

    fetchJobDescription()
  }, [jobId])

  const handleOptimize = async () => {
    setOptimizing(true)
    setError(null)

    try {
      console.log('[Optimize] Sending optimization request...', { resumeId, jobId })
      const response = await fetch('/api/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Ensure cookies are sent
        body: JSON.stringify({
          resumeId,
          options,
          jobDescriptionId: jobId || undefined,
        }),
      })

      console.log('[Optimize] Response status:', response.status)

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Optimization failed')
      }

      setResult(data.result)

      // Accept all changes by default
      const allChangeIds = new Set<string>(data.result.changes.map((c: ChangeLog) => c.id))
      setAcceptedChanges(allChangeIds)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setOptimizing(false)
    }
  }

  const toggleChange = (changeId: string) => {
    setAcceptedChanges(prev => {
      const next = new Set(prev)
      if (next.has(changeId)) {
        next.delete(changeId)
      } else {
        next.add(changeId)
      }
      return next
    })
  }

  const handleApply = async (createNewVersion: boolean) => {
    if (!result) return

    setApplying(true)
    setError(null)

    try {
      const acceptedChangesList = result.changes.filter(c =>
        acceptedChanges.has(c.id)
      )

      const response = await fetch('/api/optimize/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeId,
          optimizedResume: result.optimizedResume,
          acceptedChanges: acceptedChangesList,
          createNewVersion,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to apply changes')
      }

      // Redirect to the download page
      const downloadUrl = jobId
        ? `/download/${data.resumeId}?jobId=${jobId}`
        : `/download/${data.resumeId}`
      router.push(downloadUrl)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setApplying(false)
    }
  }

  const acceptedCount = acceptedChanges.size
  const totalCount = result?.changes.length || 0

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Resume Optimization</h1>
          <p className="text-gray-600 mt-2">
            AI-powered optimization while preserving your resume structure
          </p>
          {jobTitle && (
            <div className="mt-4 bg-purple-50 border border-purple-200 rounded-lg p-4 flex items-start gap-3">
              <svg className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <div>
                <p className="text-sm font-semibold text-purple-900">Optimizing for specific job:</p>
                <p className="text-lg font-bold text-purple-700">{jobTitle}</p>
              </div>
            </div>
          )}
        </div>

        {!result ? (
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-xl font-semibold mb-6">Optimization Options</h2>

            <div className="space-y-4 mb-8">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={options.improveBulletPoints}
                  onChange={e =>
                    setOptions({ ...options, improveBulletPoints: e.target.checked })
                  }
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-gray-700">Improve bullet points</span>
              </label>

              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={options.addKeywords}
                  onChange={e =>
                    setOptions({ ...options, addKeywords: e.target.checked })
                  }
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-gray-700">Add missing keywords</span>
              </label>

              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={options.fixGrammar}
                  onChange={e =>
                    setOptions({ ...options, fixGrammar: e.target.checked })
                  }
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-gray-700">Fix grammar and clarity</span>
              </label>

              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={options.enhanceSections}
                  onChange={e =>
                    setOptions({ ...options, enhanceSections: e.target.checked })
                  }
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-gray-700">Enhance section content</span>
              </label>

              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={options.preserveLength}
                  onChange={e =>
                    setOptions({ ...options, preserveLength: e.target.checked })
                  }
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-gray-700">Preserve similar length</span>
              </label>

              <div className="pt-4">
                <label className="block text-gray-700 mb-2">Aggressiveness</label>
                <select
                  value={options.aggressiveness}
                  onChange={e =>
                    setOptions({
                      ...options,
                      aggressiveness: e.target.value as
                        | 'conservative'
                        | 'moderate'
                        | 'aggressive',
                    })
                  }
                  className="w-full p-2 border rounded"
                >
                  <option value="conservative">Conservative (minimal changes)</option>
                  <option value="moderate">Moderate (balanced approach)</option>
                  <option value="aggressive">Aggressive (significant rewrite)</option>
                </select>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded text-red-700">
                {error}
              </div>
            )}

            <button
              onClick={handleOptimize}
              disabled={optimizing}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {optimizing ? 'Optimizing...' : 'Start Optimization'}
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Summary */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Optimization Summary</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-600">Total Changes</p>
                  <p className="text-2xl font-bold text-gray-900">{totalCount}</p>
                </div>
                <div>
                  <p className="text-gray-600">Changes Selected</p>
                  <p className="text-2xl font-bold text-blue-600">{acceptedCount}</p>
                </div>
              </div>
              <p className="mt-4 text-gray-700">{result.summary.estimatedImpact}</p>
            </div>

            {/* Changes by Section */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Changes by Section</h2>
              <div className="space-y-4">
                {result.preview.sections
                  .filter(s => s.hasChanges)
                  .map(section => (
                    <div key={section.sectionId} className="border-b pb-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-gray-900">
                          {section.sectionName}
                        </h3>
                        <span className="text-sm text-gray-500">
                          {section.changeCount} changes
                        </span>
                      </div>

                      <div className="space-y-3">
                        {section.changes.map(change => (
                          <div
                            key={change.id}
                            className={`p-4 rounded border-2 ${
                              acceptedChanges.has(change.id)
                                ? 'border-green-200 bg-green-50'
                                : 'border-gray-200 bg-gray-50'
                            }`}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  checked={acceptedChanges.has(change.id)}
                                  onChange={() => toggleChange(change.id)}
                                  className="mt-1"
                                />
                                <span className="text-xs font-semibold px-2 py-1 rounded bg-blue-100 text-blue-700">
                                  {change.changeType}
                                </span>
                                <span
                                  className={`text-xs font-semibold px-2 py-1 rounded ${
                                    change.impact === 'high'
                                      ? 'bg-red-100 text-red-700'
                                      : change.impact === 'medium'
                                      ? 'bg-yellow-100 text-yellow-700'
                                      : 'bg-gray-100 text-gray-700'
                                  }`}
                                >
                                  {change.impact} impact
                                </span>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <div className="bg-red-50 p-2 rounded border border-red-200">
                                <p className="text-xs text-red-600 font-semibold mb-1">
                                  Before:
                                </p>
                                <p className="text-sm text-gray-900 line-through">
                                  {change.originalValue}
                                </p>
                              </div>

                              <div className="bg-green-50 p-2 rounded border border-green-200">
                                <p className="text-xs text-green-600 font-semibold mb-1">
                                  After:
                                </p>
                                <p className="text-sm text-gray-900">
                                  {change.newValue}
                                </p>
                              </div>

                              <p className="text-sm text-gray-600 italic">
                                {change.reason}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Action buttons */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded text-red-700">
                {error}
              </div>
            )}

            <div className="flex space-x-4">
              <button
                onClick={() => handleApply(true)}
                disabled={applying || acceptedCount === 0}
                className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {applying
                  ? 'Applying...'
                  : `Create New Version (${acceptedCount} changes)`}
              </button>

              <button
                onClick={() => handleApply(false)}
                disabled={applying || acceptedCount === 0}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {applying
                  ? 'Applying...'
                  : `Update Original (${acceptedCount} changes)`}
              </button>

              <button
                onClick={() => setResult(null)}
                disabled={applying}
                className="px-6 bg-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-400 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
