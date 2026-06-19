import { Component, type ReactNode } from 'react'

interface State {
  error: Error | null
}

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex flex-col items-center justify-center h-screen bg-[#F2F2F7]">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-sm border border-black/[0.09] text-center">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M12 8v4m0 4h.01" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
                <circle cx="12" cy="12" r="10" stroke="#ef4444" strokeWidth="2" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-[#1C1C1E] mb-2">Something went wrong</h2>
            <p className="text-sm text-[#8E8E93] mb-6">{this.state.error.message}</p>
            <button
              className="px-4 py-2 bg-[#007AFF] text-white rounded-lg text-sm font-medium hover:bg-[#0062CC] transition-colors"
              onClick={() => window.location.reload()}
            >
              Reload App
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
