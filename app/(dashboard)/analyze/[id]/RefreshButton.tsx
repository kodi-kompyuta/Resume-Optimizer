'use client'

export function RefreshButton() {
  return (
    <button
      onClick={() => window.location.reload()}
      className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
    >
      Refresh Page
    </button>
  )
}
