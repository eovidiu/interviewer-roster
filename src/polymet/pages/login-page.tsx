import { useAuth } from "@/polymet/data/auth-context";
import { GoogleSignInButton } from "@/polymet/components/google-sign-in-button";
import { Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CalendarIcon } from "lucide-react";

export function LoginPage() {
  const { user, isLoading } = useAuth();

  // If already logged in, show a message with link to dashboard
  if (user && !isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-primary rounded-lg flex items-center justify-center">
                <CalendarIcon className="w-8 h-8 text-primary-foreground" />
              </div>
            </div>
            <div>
              <CardTitle className="text-2xl">Already Signed In</CardTitle>
              <CardDescription className="mt-2">
                You are already signed in as {user.name}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link
              to="/"
              className="inline-flex items-center justify-center w-full h-10 px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Go to Dashboard
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-primary rounded-lg flex items-center justify-center">
              <CalendarIcon className="w-8 h-8 text-primary-foreground" />
            </div>
          </div>
          <div>
            <CardTitle className="text-2xl">Interview Roster</CardTitle>
            <CardDescription className="mt-2">
              Sign in to manage your interview scheduling and roster
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <GoogleSignInButton />

          <div className="text-center text-xs text-muted-foreground">
            By signing in, you agree to our Terms of Service and Privacy Policy
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
