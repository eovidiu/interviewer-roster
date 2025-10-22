/**
 * OAuth Callback Page (Issue #55)
 * Handles Google OAuth redirect after successful authentication
 */

import { useEffect, useState, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/polymet/data/auth-context'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircleIcon } from 'lucide-react'

export function AuthCallbackPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { signInWithToken } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const hasProcessed = useRef(false)

  useEffect(() => {
    // Prevent multiple executions
    if (hasProcessed.current) return
    hasProcessed.current = true

    const token = searchParams.get('token')
    const returnUrl = searchParams.get('returnUrl')
    const errorParam = searchParams.get('error')

    if (errorParam) {
      // Handle OAuth errors
      const errorMessages: Record<string, string> = {
        'access_denied': 'You denied access to your Google account.',
        'no_code': 'No authorization code received from Google.',
        'auth_failed': 'Authentication failed. Please try again.',
      }
      setError(errorMessages[errorParam] || 'An unknown error occurred during authentication.')
      return
    }

    if (!token) {
      setError('No authentication token received.')
      return
    }

    try {
      // Sign in with the JWT token from backend
      signInWithToken(token)

      // Redirect to the original destination or dashboard
      navigate(returnUrl || '/', { replace: true })
    } catch (err) {
      console.error('Failed to process OAuth callback:', err)
      setError('Failed to complete authentication. Please try again.')
    }
  }, [searchParams, navigate, signInWithToken])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-md">
          <Alert variant="destructive">
            <AlertCircleIcon className="h-4 w-4" />
            <AlertTitle>Authentication Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <div className="mt-4 text-center">
            <a
              href="/login"
              className="text-primary hover:underline"
            >
              Return to login
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center" role="status" aria-live="polite">
        <div
          className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"
          aria-hidden="true"
        ></div>
        <p className="text-muted-foreground">Completing authentication...</p>
      </div>
    </div>
  )
}
