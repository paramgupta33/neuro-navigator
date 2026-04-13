import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-[#0f0a06] p-6 text-center text-[#fef3c7]">
          <div className="mb-6 text-6xl">🌿</div>
          <h1 className="font-heading text-3xl font-bold text-[#fbbf24]">Something went wrong</h1>
          <p className="mt-4 max-w-md text-white/60">
            {this.state.error?.message || "An unexpected error occurred while loading the application."}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="cozy-pixel-btn cozy-pixel-btn-wheat mt-8"
          >
            Reload Application
          </button>
          {this.state.error?.message?.includes('Supabase') && (
            <p className="mt-6 text-xs text-wheat/40">
              Tip: Check if VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in the Secrets panel.
            </p>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
