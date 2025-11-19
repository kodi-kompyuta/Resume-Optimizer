import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'

import { logout } from '@/lib/actions/auth'

import Link from 'next/link'

 

export default async function DashboardLayout({

  children,

}: {

  children: React.ReactNode

}) {

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

 

  if (!user) {

    redirect('/login')

  }

 

  return (

    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">

      {/* Navigation Header */}

      <nav className="bg-white border-b border-gray-200 shadow-sm">

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="flex justify-between items-center h-16">

            {/* Logo */}

            <Link href="/dashboard">

              <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent cursor-pointer">

                Resume Optimizer

              </h1>

            </Link>

 

            {/* Desktop Navigation */}

            <div className="hidden md:flex items-center gap-6">

              <Link

                href="/dashboard"

                className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"

              >

                Dashboard

              </Link>

              <Link

                href="/jobs"

                className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"

              >

                Job Matching

              </Link>

              <Link

                href="/upload"

                className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"

              >

                Upload Resume

              </Link>

            </div>

 

            {/* User Menu */}

            <div className="flex items-center gap-2 sm:gap-4">

              <div className="text-xs sm:text-sm text-gray-700 hidden sm:block">

                {user.email}

              </div>

              <form action={logout}>

                <button

                  type="submit"

                  className="text-xs sm:text-sm text-gray-600 hover:text-gray-900 font-medium"

                >

                  Logout

                </button>

              </form>

            </div>

          </div>

 

          {/* Mobile Navigation */}

          <div className="md:hidden pb-4 pt-2 flex items-center gap-4 overflow-x-auto">

            <Link

              href="/dashboard"

              className="whitespace-nowrap text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors px-3 py-2 rounded-lg hover:bg-blue-50"

            >

              Dashboard

            </Link>

            <Link

              href="/jobs"

              className="whitespace-nowrap text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors px-3 py-2 rounded-lg hover:bg-blue-50"

            >

              Job Matching

            </Link>

            <Link

              href="/upload"

              className="whitespace-nowrap text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors px-3 py-2 rounded-lg hover:bg-blue-50"

            >

              Upload Resume

            </Link>

          </div>

        </div>

      </nav>

 

      {/* Main Content */}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {children}

      </main>

 

      {/* Footer */}

      <footer className="mt-12 pb-8 text-center text-sm text-gray-500">

        <p>&copy; 2025 Resume Optimizer. All rights reserved.</p>

      </footer>

    </div>

  )

}

 