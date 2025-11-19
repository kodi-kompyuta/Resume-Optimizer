import { createClient } from '@/lib/supabase/server'

import Link from 'next/link'



export default async function DashboardPage() {

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

 

  // Fetch user's resumes

  const { data: resumes } = await supabase

    .from('resumes')

    .select('*')

    .order('created_at', { ascending: false })

 

  // Calculate stats

  const totalResumes = resumes?.length || 0

  const completedResumes = resumes?.filter(r => r.status === 'completed').length || 0

  const averageScore = resumes && resumes.length > 0

    ? Math.round(resumes.filter(r => r.ats_score).reduce((sum, r) => sum + (r.ats_score || 0), 0) / resumes.filter(r => r.ats_score).length)

    : 0

 

  return (

    <div className="space-y-8">

      {/* Welcome Section */}

      <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-100">

        <h2 className="text-3xl font-bold text-gray-900 mb-2">

          Welcome back! 👋

        </h2>

        <p className="text-gray-600">

          Ready to optimize your resume and land more interviews?

        </p>

      </div>

 

      {/* Stats Cards */}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Total Resumes */}

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">

          <div className="flex items-center justify-between">

            <div>

              <p className="text-sm font-medium text-gray-600">Total Resumes</p>

              <p className="text-3xl font-bold text-gray-900 mt-1">{totalResumes}</p>

            </div>

            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">

              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">

                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />

              </svg>

            </div>

          </div>

        </div>

 

        {/* Completed Analyses */}

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">

          <div className="flex items-center justify-between">

            <div>

              <p className="text-sm font-medium text-gray-600">Completed</p>

              <p className="text-3xl font-bold text-gray-900 mt-1">{completedResumes}</p>

            </div>

            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">

              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">

                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />

              </svg>

            </div>

          </div>

        </div>

 

        {/* Average Score */}

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">

          <div className="flex items-center justify-between">

            <div>

              <p className="text-sm font-medium text-gray-600">Average Score</p>

              <p className="text-3xl font-bold text-gray-900 mt-1">

                {averageScore > 0 ? `${averageScore}/100` : 'N/A'}

              </p>

            </div>

            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">

              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">

                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />

              </svg>

            </div>

          </div>

        </div>

      </div>

 

      {/* Upload New Resume Section */}

      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg p-8 text-white">

        <div className="flex items-center justify-between">

          <div>

            <h3 className="text-2xl font-bold mb-2">Optimize a New Resume</h3>

            <p className="text-blue-100 mb-4">

              Upload your resume to get instant AI-powered feedback and ATS compatibility score

            </p>

            <Link

              href="/upload"

              className="inline-flex items-center px-6 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition-colors shadow-lg"

            >

              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">

                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />

              </svg>

              Upload Resume

            </Link>

          </div>

          <div className="hidden md:block">

            <svg className="w-32 h-32 text-white opacity-20" fill="currentColor" viewBox="0 0 24 24">

              <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />

            </svg>

          </div>

        </div>

      </div>

 

      {/* Recent Resumes */}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">

        <div className="p-6 border-b border-gray-100">

          <h3 className="text-xl font-bold text-gray-900">Your Resumes</h3>

          <p className="text-sm text-gray-600 mt-1">View and manage your uploaded resumes</p>

        </div>

 

        <div className="p-6">

          {!resumes || resumes.length === 0 ? (

            <div className="text-center py-12">

              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">

                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />

              </svg>

              <p className="text-gray-500 mb-4">No resumes uploaded yet</p>

              <Link

                href="/upload"

                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"

              >

                Upload Your First Resume

              </Link>

            </div>

          ) : (

            <div className="space-y-4">

              {resumes.map((resume) => (

                <Link

                  key={resume.id}

                  href={`/analyze/${resume.id}`}

                  className="block p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all"

                >

                  <div className="flex items-center justify-between">

                    <div className="flex-1">

                      <div className="flex items-center gap-3">

                        <h4 className="font-semibold text-gray-900">{resume.original_filename}</h4>

                        {resume.status === 'completed' && (

                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">

                            ✓ Completed

                          </span>

                        )}

                        {resume.status === 'processing' && (

                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">

                            ⏳ Processing

                          </span>

                        )}

                        {resume.status === 'failed' && (

                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">

                            ✗ Failed

                          </span>

                        )}

                      </div>

                      <p className="text-sm text-gray-500 mt-1">

                        Uploaded {new Date(resume.created_at).toLocaleDateString('en-US', {

                          month: 'short',

                          day: 'numeric',

                          year: 'numeric'

                        })}

                      </p>

                    </div>



                    {resume.ats_score && (

                      <div className="ml-4">

                        <div className="flex items-center gap-2">

                          <span className="text-sm text-gray-600">ATS Score:</span>

                          <span className={`text-2xl font-bold ${

                            resume.ats_score >= 80 ? 'text-green-600' :

                            resume.ats_score >= 60 ? 'text-yellow-600' :

                            'text-red-600'

                          }`}>

                            {resume.ats_score}

                          </span>

                        </div>

                      </div>

                    )}



                    <svg className="w-5 h-5 text-gray-400 ml-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">

                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />

                    </svg>

                  </div>

                </Link>

              ))}

            </div>

          )}

        </div>

      </div>

 

      {/* Help Section */}

      <div className="bg-blue-50 border border-blue-100 rounded-xl p-6">

        <div className="flex items-start gap-4">

          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">

            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">

              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />

            </svg>

          </div>

          <div>

            <h4 className="font-semibold text-gray-900 mb-1">How it works</h4>

            <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">

              <li>Upload your resume (PDF, DOCX, or TXT format)</li>

              <li>Our AI analyzes it for ATS compatibility and quality</li>

              <li>Get instant feedback with actionable suggestions</li>

              <li>Download your optimized resume and apply with confidence!</li>

            </ol>

          </div>

        </div>

      </div>

    </div>

  )

}