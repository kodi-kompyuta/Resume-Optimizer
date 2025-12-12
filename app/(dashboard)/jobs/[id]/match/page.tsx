import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import JobMatchSelector from '@/app/(dashboard)/jobs/[id]/match/JobMatchSelector'

export default async function JobMatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch job description
  const { data: job, error: jobError } = await supabase
    .from('job_descriptions')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (jobError || !job) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-red-900 mb-2">Job Not Found</h2>
          <p className="text-red-700 mb-4">The job description you're looking for doesn't exist.</p>
          <Link href="/jobs" className="text-blue-600 hover:text-blue-700 font-medium">
            Back to Jobs
          </Link>
        </div>
      </div>
    )
  }

  // Fetch ALL user's resumes (job matching doesn't require analysis to be complete)
  const { data: resumes } = await supabase
    .from('resumes')
    .select('id, original_filename, created_at, ats_score, status, version_name')
    .order('created_at', { ascending: false })

  // Fetch existing matches for this job
  const { data: existingMatches } = await supabase
    .from('resume_job_matches')
    .select('id, resume_id, match_score, created_at')
    .eq('job_description_id', id)

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
        <h1 className="text-3xl font-bold text-gray-900">{job.job_title}</h1>
        {job.company_name && (
          <p className="text-xl text-gray-600 mt-1">{job.company_name}</p>
        )}
      </div>

      {/* Job Details Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">Job Description</h3>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            {job.location && (
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
                {job.location}
              </span>
            )}
            {job.salary_range && (
              <span className="flex items-center ml-4">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {job.salary_range}
              </span>
            )}
          </div>
        </div>
        <div className="prose max-w-none">
          <p className="text-gray-700 whitespace-pre-wrap">{job.job_description}</p>
        </div>

        {job.requirements && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h4 className="font-semibold text-gray-900 mb-3">Key Requirements</h4>
            <p className="text-gray-700 whitespace-pre-wrap">{job.requirements}</p>
          </div>
        )}
      </div>

      {/* Resume Selector */}
      <JobMatchSelector
        jobId={id}
        resumes={resumes || []}
        existingMatches={existingMatches || []}
      />
    </div>
  )
}