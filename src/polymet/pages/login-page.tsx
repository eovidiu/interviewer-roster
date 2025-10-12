import { useAuth } from "@/polymet/data/auth-context";
import { GoogleSignInButton } from "@/polymet/components/google-sign-in-button";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
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
  const location = useLocation();
  const navigate = useNavigate();
  const from =
    (location.state as { from?: { pathname: string } } | undefined)?.from
      ?.pathname || "/";

  const handleSignInSuccess = () => {
    navigate(from, { replace: true });
  };

  if (user && !isLoading) {
    return <Navigate to={from} replace />;
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
          <GoogleSignInButton onSuccess={handleSignInSuccess} />

          <div className="text-center text-xs text-muted-foreground">
            By signing in, you agree to our Terms of Service and Privacy Policy
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
