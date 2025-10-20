import { useAuth } from "@/polymet/data/auth-context";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RoleBadge } from "@/polymet/components/role-badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CalendarIcon, UserIcon, AlertCircleIcon } from "lucide-react";
import { useState } from "react";

type UserRole = "admin" | "talent" | "viewer";

interface DemoUser {
  email: string;
  name: string;
  role: UserRole;
  description: string;
}

const demoUsers: DemoUser[] = [
  {
    email: "eovidiu@gmail.com",
    name: "Ovidiu E",
    role: "admin",
    description: "Full access to all features including Database, Audit Logs, and Settings",
  },
  {
    email: "talent@example.com",
    name: "TA User",
    role: "talent",
    description: "Can mark interviews, manage interviewers, and view Schedule & Events",
  },
  {
    email: "viewer@example.com",
    name: "Viewer User",
    role: "viewer",
    description: "Read-only access to Dashboard only",
  },
];

export function LoginPage() {
  const { user, isLoading, signIn } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const from =
    (location.state as { from?: { pathname: string } } | undefined)?.from
      ?.pathname || "/";

  const handleSignIn = async (demoUser: DemoUser) => {
    try {
      setSigningIn(true);
      setError(null); // Clear any previous errors
      await signIn(demoUser.email, demoUser.name);
      navigate(from, { replace: true });
    } catch (error) {
      console.error("Sign in error:", error);
      setError("Login failed. Please try again.");
      setSigningIn(false);
    }
  };

  if (user && !isLoading) {
    return <Navigate to={from} replace />;
  }

  if (isLoading || signingIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">
            {signingIn ? "Signing in..." : "Loading..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-primary rounded-lg flex items-center justify-center">
              <CalendarIcon className="w-8 h-8 text-primary-foreground" />
            </div>
          </div>
          <div>
            <CardTitle className="text-2xl">Interview Roster</CardTitle>
            <CardDescription className="mt-2">
              Select a user to sign in (Demo Mode)
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircleIcon className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-3">
            {demoUsers.map((demoUser) => (
              <Button
                key={demoUser.email}
                onClick={() => handleSignIn(demoUser)}
                variant="outline"
                className="w-full h-auto p-4 flex flex-col items-start gap-2 hover:bg-muted"
                disabled={signingIn}
              >
                <div className="flex items-center gap-3 w-full">
                  <UserIcon className="h-5 w-5 text-muted-foreground" />
                  <div className="flex-1 text-left">
                    <div className="font-medium">{demoUser.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {demoUser.email}
                    </div>
                  </div>
                  <RoleBadge role={demoUser.role} />
                </div>
                <div className="text-xs text-muted-foreground text-left pl-8">
                  {demoUser.description}
                </div>
              </Button>
            ))}
          </div>

          <div className="text-center text-xs text-muted-foreground pt-4 border-t">
            In production, this would use Google OAuth. For demo purposes, select a
            user above.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
