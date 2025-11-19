'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function NewJobPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const jobData = {
      job_title: formData.get('job_title') as string,
      company_name: formData.get('company_name') as string,
      job_description: formData.get('job_description') as string,
      requirements: formData.get('requirements') as string,
      location: formData.get('location') as string,
      salary_range: formData.get('salary_range') as string,
      is_active: true
    }

    // Validate required fields
    if (!jobData.job_title || !jobData.job_description) {
      setError('Job title and description are required')
      setLoading(false)
      return
    }

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setError('You must be logged in')
        setLoading(false)
        return
      }

      const { data, error: dbError } = await supabase
        .from('job_descriptions')
        .insert([{
          ...jobData,
          user_id: user.id
        }])
        .select()
        .single()

      if (dbError) {
        throw dbError
      }

      // Redirect to match page
      router.push(`/jobs/${data.id}/match`)
    } catch (err) {
      console.error('Error saving job description:', err)
      setError(err instanceof Error ? err.message : 'Failed to save job description')
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/jobs"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Jobs
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Add Job Description</h1>
        <p className="text-gray-600">
          Save a job description to match it against your resumes and generate tailored cover letters
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 space-y-6">
          {/* Job Title */}
          <div>
            <label htmlFor="job_title" className="block text-sm font-semibold text-gray-900 mb-2">
              Job Title <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              id="job_title"
              name="job_title"
              required
              placeholder="e.g., Senior Software Engineer"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            />
          </div>

          {/* Company Name */}
          <div>
            <label htmlFor="company_name" className="block text-sm font-semibold text-gray-900 mb-2">
              Company Name
            </label>
            <input
              type="text"
              id="company_name"
              name="company_name"
              placeholder="e.g., Google, Microsoft, etc."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            />
          </div>

          {/* Location and Salary Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="location" className="block text-sm font-semibold text-gray-900 mb-2">
                Location
              </label>
              <input
                type="text"
                id="location"
                name="location"
                placeholder="e.g., Remote, San Francisco, CA"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              />
            </div>

            <div>
              <label htmlFor="salary_range" className="block text-sm font-semibold text-gray-900 mb-2">
                Salary Range
              </label>
              <input
                type="text"
                id="salary_range"
                name="salary_range"
                placeholder="e.g., $120k - $180k"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              />
            </div>
          </div>

          {/* Job Description */}
          <div>
            <label htmlFor="job_description" className="block text-sm font-semibold text-gray-900 mb-2">
              Job Description <span className="text-red-600">*</span>
            </label>
            <p className="text-xs text-gray-500 mb-2">
              Paste the full job description including responsibilities, qualifications, and company info
            </p>
            <textarea
              id="job_description"
              name="job_description"
              required
              rows={12}
              placeholder="Paste the job description here..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-mono text-sm"
            />
          </div>

          {/* Requirements (Optional) */}
          <div>
            <label htmlFor="requirements" className="block text-sm font-semibold text-gray-900 mb-2">
              Key Requirements
              <span className="text-gray-500 font-normal ml-2">(Optional)</span>
            </label>
            <p className="text-xs text-gray-500 mb-2">
              Extract and list the most important requirements if you want to highlight them
            </p>
            <textarea
              id="requirements"
              name="requirements"
              rows={6}
              placeholder="- 5+ years of experience in software development&#10;- Proficiency in React, Node.js, TypeScript&#10;- Experience with cloud platforms (AWS/GCP)&#10;- etc."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-mono text-sm"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-3">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p>{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className={`flex-1 px-8 py-4 rounded-lg font-semibold text-white transition-all ${
                loading
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl'
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </span>
              ) : (
                'Save & Match Against Resumes'
              )}
            </button>

            <Link
              href="/jobs"
              className="px-6 py-4 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </Link>
          </div>
        </div>
      </form>

      {/* Tips */}
      <div className="mt-8 bg-blue-50 border border-blue-100 rounded-xl p-6">
        <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
          <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          Tips for Better Results
        </h3>
        <ul className="text-sm text-gray-600 space-y-2">
          <li className="flex items-start">
            <span className="text-blue-600 mr-2">•</span>
            <span>Include the entire job posting - the more detail, the better the analysis</span>
          </li>
          <li className="flex items-start">
            <span className="text-blue-600 mr-2">•</span>
            <span>Make sure to include required skills, qualifications, and responsibilities</span>
          </li>
          <li className="flex items-start">
            <span className="text-blue-600 mr-2">•</span>
            <span>Add location and salary info to keep track of different opportunities</span>
          </li>
          <li className="flex items-start">
            <span className="text-blue-600 mr-2">•</span>
            <span>You can save multiple job descriptions and compare which resume works best for each</span>
          </li>
        </ul>
      </div>
    </div>
  )
}