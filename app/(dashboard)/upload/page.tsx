'use client'

 

import { useState } from 'react'

import { useRouter } from 'next/navigation'

import Link from 'next/link'

 

export default function UploadPage() {

  const [file, setFile] = useState<File | null>(null)

  const [uploading, setUploading] = useState(false)

  const [error, setError] = useState<string | null>(null)

  const [dragActive, setDragActive] = useState(false)

  const router = useRouter()

 

  const handleDrag = (e: React.DragEvent) => {

    e.preventDefault()

    e.stopPropagation()

    if (e.type === 'dragenter' || e.type === 'dragover') {

      setDragActive(true)

    } else if (e.type === 'dragleave') {

      setDragActive(false)

    }

  }

 

  const handleDrop = (e: React.DragEvent) => {

    e.preventDefault()

    e.stopPropagation()

    setDragActive(false)

 

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {

      handleFile(e.dataTransfer.files[0])

    }

  }

 

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {

    e.preventDefault()

    if (e.target.files && e.target.files[0]) {

      handleFile(e.target.files[0])

    }

  }

 

  const handleFile = (selectedFile: File) => {

    setError(null)

 

    // Validate file type

    const allowedTypes = [

      'application/pdf',

      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',

      'application/msword',

      'text/plain'

    ]

 

    if (!allowedTypes.includes(selectedFile.type)) {

      setError('Please upload a PDF, DOCX, or TXT file')

      return

    }

 

    // Validate file size (max 5MB)

    const maxSize = 5 * 1024 * 1024 // 5MB

    if (selectedFile.size > maxSize) {

      setError('File size must be less than 5MB')

      return

    }

 

    setFile(selectedFile)

  }

 

  const handleUpload = async (e: React.FormEvent) => {

    e.preventDefault()

 

    if (!file) {

      setError('Please select a file')

      return

    }

 

    setUploading(true)

    setError(null)

 

    try {

      const formData = new FormData()

      formData.append('file', file)

 

      const response = await fetch('/api/upload', {

        method: 'POST',

        body: formData,

      })

 

      const data = await response.json()

 

      if (!response.ok) {

        throw new Error(data.error || 'Upload failed')

      }

 

      // Redirect to analysis page

      router.push(`/analyze/${data.resumeId}`)

    } catch (err) {

      setError(err instanceof Error ? err.message : 'Upload failed. Please try again.')

      setUploading(false)

    }

  }

 

  const formatFileSize = (bytes: number) => {

    if (bytes === 0) return '0 Bytes'

    const k = 1024

    const sizes = ['Bytes', 'KB', 'MB']

    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]

  }

 

  return (

    <div className="max-w-3xl mx-auto">

      {/* Header */}

      <div className="mb-8">

        <Link

          href="/dashboard"

          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"

        >

          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">

            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />

          </svg>

          Back to Dashboard

        </Link>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">Upload Your Resume</h1>

        <p className="text-gray-600">

          Upload your resume to get instant AI-powered analysis and optimization suggestions

        </p>

      </div>

 

      {/* Upload Form */}

      <form onSubmit={handleUpload} className="space-y-6">

        {/* Drag & Drop Area */}

        <div

          className={`border-2 border-dashed rounded-xl p-12 text-center transition-all ${

            dragActive

              ? 'border-blue-500 bg-blue-50'

              : 'border-gray-300 bg-white hover:border-gray-400'

          }`}

          onDragEnter={handleDrag}

          onDragLeave={handleDrag}

          onDragOver={handleDrag}

          onDrop={handleDrop}

        >

          {!file ? (

            <>

              <svg

                className="mx-auto h-16 w-16 text-gray-400 mb-4"

                fill="none"

                stroke="currentColor"

                viewBox="0 0 24 24"

              >

                <path

                  strokeLinecap="round"

                  strokeLinejoin="round"

                  strokeWidth={2}

                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"

                />

              </svg>

              <p className="text-lg font-medium text-gray-900 mb-2">

                Drag and drop your resume here

              </p>

              <p className="text-sm text-gray-500 mb-4">or</p>

              <label

                htmlFor="file-upload"

                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"

              >

                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">

                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />

                </svg>

                Choose File

              </label>

              <input

                id="file-upload"

                type="file"

                className="hidden"

                accept=".pdf,.docx,.doc,.txt"

                onChange={handleChange}

              />

              <p className="text-xs text-gray-500 mt-4">

                Supported formats: PDF, DOCX, TXT (max 5MB)

              </p>

            </>

          ) : (

            <div className="space-y-4">

              {/* File Preview */}

              <div className="inline-flex items-center gap-3 bg-green-50 border border-green-200 rounded-lg px-6 py-4">

                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">

                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />

                </svg>

                <div className="text-left">

                  <p className="font-medium text-gray-900">{file.name}</p>

                  <p className="text-sm text-gray-500">{formatFileSize(file.size)}</p>

                </div>

              </div>

 

              {/* Change File Button */}

              <div>

                <label

                  htmlFor="file-change"

                  className="inline-flex items-center px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"

                >

                  Change File

                </label>

                <input

                  id="file-change"

                  type="file"

                  className="hidden"

                  accept=".pdf,.docx,.doc,.txt"

                  onChange={handleChange}

                />

              </div>

            </div>

          )}

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

 

        {/* Submit Button */}

        <div className="flex items-center gap-4">

          <button

            type="submit"

            disabled={!file || uploading}

            className={`flex-1 px-8 py-4 rounded-lg font-semibold text-white transition-all ${

              !file || uploading

                ? 'bg-gray-300 cursor-not-allowed'

                : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl'

            }`}

          >

            {uploading ? (

              <span className="flex items-center justify-center">

                <svg className="animate-spin h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24">

                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>

                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>

                </svg>

                Analyzing Resume...

              </span>

            ) : (

              'Analyze Resume'

            )}

          </button>

 

          <Link

            href="/dashboard"

            className="px-6 py-4 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"

          >

            Cancel

          </Link>

        </div>

      </form>

 

      {/* Info Cards */}

      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">

        <div className="bg-white border border-gray-200 rounded-lg p-6">

          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-4">

            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">

              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />

            </svg>

          </div>

          <h3 className="font-semibold text-gray-900 mb-2">Instant Analysis</h3>

          <p className="text-sm text-gray-600">

            Get your ATS compatibility score and detailed feedback in seconds

          </p>

        </div>

 

        <div className="bg-white border border-gray-200 rounded-lg p-6">

          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-4">

            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">

              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />

              </svg>

          </div>

          <h3 className="font-semibold text-gray-900 mb-2">100% Secure</h3>

          <p className="text-sm text-gray-600">

            Your resume is encrypted and never shared with third parties

          </p>

        </div>

 

        <div className="bg-white border border-gray-200 rounded-lg p-6">

          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-4">

            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">

              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />

            </svg>

          </div>

          <h3 className="font-semibold text-gray-900 mb-2">AI-Powered</h3>

          <p className="text-sm text-gray-600">

            Advanced AI analyzes every aspect of your resume for maximum impact

          </p>

        </div>

      </div>

    </div>

  )

}

 