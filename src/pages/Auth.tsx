import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, Mail, Lock, User, Eye, EyeOff, ArrowLeft, RefreshCw } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { z } from "zod";
import PasswordRequirements from "@/components/shared/PasswordRequirements";

const emailSchema = z.string().email("Please enter a valid email address");
const passwordSchema = z.string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Must contain an uppercase letter")
  .regex(/[a-z]/, "Must contain a lowercase letter")
  .regex(/[0-9]/, "Must contain a number")
  .regex(/[^A-Za-z0-9]/, "Must contain a special character");

export default function Auth() {
  const navigate = useNavigate();
  const { signIn, signUp, resetPasswordForEmail } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirmPassword, setSignupConfirmPassword] = useState("");
  const [signupFullName, setSignupFullName] = useState("");
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showSignupConfirmPassword, setShowSignupConfirmPassword] = useState(false);

  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  const [showResendVerification, setShowResendVerification] = useState(false);
  const [resendEmail, setResendEmail] = useState("");
  const [isResendingVerification, setIsResendingVerification] = useState(false);

  const handleResendVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      emailSchema.parse(resendEmail);
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast({
          title: "Validation Error",
          description: err.errors[0].message,
          variant: "destructive",
        });
        return;
      }
    }

    setIsResendingVerification(true);
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: resendEmail,
    });
    setIsResendingVerification(false);

    if (error) {
      toast({
        title: "Failed to Resend",
        description: "Unable to resend verification email. Please try again.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Verification Email Sent",
        description: "Check your email for a new verification link.",
      });
      setShowResendVerification(false);
      setResendEmail("");
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      emailSchema.parse(loginEmail);
      passwordSchema.parse(loginPassword);
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast({
          title: "Validation Error",
          description: err.errors[0].message,
          variant: "destructive",
        });
        return;
      }
    }

    setIsLoading(true);
    const { error } = await signIn(loginEmail, loginPassword);
    setIsLoading(false);

    if (error) {
      const message = error.message?.toLowerCase() || "";
      if (message.includes("email not confirmed")) {
        toast({
          title: "Email Not Verified",
          description: "Please check your email and click the verification link before logging in.",
          variant: "destructive",
        });
        setResendEmail(loginEmail);
        setShowResendVerification(true);
      } else {
        toast({
          title: "Login Failed",
          description: "Invalid email or password. Please try again.",
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "Welcome back!",
        description: "You've successfully logged in.",
      });
      navigate("/");
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      emailSchema.parse(signupEmail);
      passwordSchema.parse(signupPassword);
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast({
          title: "Validation Error",
          description: err.errors[0].message,
          variant: "destructive",
        });
        return;
      }
    }

    if (signupPassword !== signupConfirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords do not match. Please try again.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    const { error } = await signUp(signupEmail, signupPassword, signupFullName);
    setIsLoading(false);

    if (error) {
      const message = error.message?.toLowerCase() || "";
      if (message.includes("already registered") || message.includes("already exists")) {
        toast({
          title: "Account Exists",
          description: "An account with this email already exists. Please log in instead.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Signup Failed",
          description: "Unable to create account. Please try again.",
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "Account Created",
        description: "Check your email for a verification link. You'll need to verify before logging in.",
      });
      // Clear form but stay on page
      setSignupEmail("");
      setSignupPassword("");
      setSignupConfirmPassword("");
      setSignupFullName("");
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      emailSchema.parse(resetEmail);
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast({
          title: "Validation Error",
          description: err.errors[0].message,
          variant: "destructive",
        });
        return;
      }
    }

    setIsResettingPassword(true);
    const { error } = await resetPasswordForEmail(resetEmail);
    setIsResettingPassword(false);

    if (error) {
      toast({
        title: "Reset Failed",
        description: "Unable to send reset email. Please try again.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Reset Email Sent",
        description: "Check your email for a link to reset your password. The link expires in 1 hour.",
      });
      setShowForgotPassword(false);
      setResetEmail("");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="relative">
            <div className="w-12 h-12 bg-gradient-to-br from-gold-500 to-gold-600 rounded-xl flex items-center justify-center shadow-lg">
              <Sparkles className="h-6 w-6 text-primary-foreground" />
            </div>
            <div className="absolute -inset-1 bg-gradient-to-br from-gold-500 to-gold-600 rounded-xl opacity-20 blur animate-glow" />
          </div>
          <div>
            <h1 className="font-bold text-2xl bg-gradient-to-r from-gold-500 to-gold-600 bg-clip-text text-transparent">
              ClawOps
            </h1>
            <p className="text-xs text-muted-foreground font-medium">Professional Suite</p>
          </div>
        </div>

        <Card className="glass-card border-border/50">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-xl">Welcome</CardTitle>
            <CardDescription>
              Sign in to your account or create a new one
            </CardDescription>
          </CardHeader>
          <CardContent>
            {showResendVerification ? (
              <form onSubmit={handleResendVerification} className="space-y-4">
                <button
                  type="button"
                  onClick={() => setShowResendVerification(false)}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to login
                </button>
                
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg">Resend verification email</h3>
                  <p className="text-sm text-muted-foreground">
                    Enter your email address and we'll send you a new verification link.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="resend-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="resend-email"
                      type="email"
                      placeholder="you@example.com"
                      value={resendEmail}
                      onChange={(e) => setResendEmail(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full premium-button" disabled={isResendingVerification}>
                  <RefreshCw className={`h-4 w-4 ${isResendingVerification ? 'animate-spin' : ''}`} />
                  {isResendingVerification ? "Sending..." : "Resend Verification Email"}
                </Button>
              </form>
            ) : showForgotPassword ? (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(false)}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to login
                </button>
                
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg">Reset your password</h3>
                  <p className="text-sm text-muted-foreground">
                    Enter your email address and we'll send you a link to reset your password.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reset-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="reset-email"
                      type="email"
                      placeholder="you@example.com"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full premium-button" disabled={isResettingPassword}>
                  {isResettingPassword ? "Sending..." : "Send Reset Link"}
                </Button>
              </form>
            ) : (
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="you@example.com"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="login-password"
                         type={showLoginPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                         className="pl-10 pr-10"
                        required
                      />
                       <button
                         type="button"
                         onClick={() => setShowLoginPassword(!showLoginPassword)}
                         className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                         aria-label={showLoginPassword ? "Hide password" : "Show password"}
                       >
                         {showLoginPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                       </button>
                    </div>
                  </div>

                   <button
                     type="button"
                     onClick={() => setShowForgotPassword(true)}
                     className="text-sm text-primary hover:underline"
                   >
                     Forgot password?
                   </button>
 
                  <Button type="submit" className="w-full premium-button" disabled={isLoading}>
                    {isLoading ? "Signing in..." : "Sign In"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-name"
                        type="text"
                        placeholder="John Doe"
                        value={signupFullName}
                        onChange={(e) => setSignupFullName(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="you@example.com"
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-password"
                         type={showSignupPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                         className="pl-10 pr-10"
                        required
                      />
                       <button
                         type="button"
                         onClick={() => setShowSignupPassword(!showSignupPassword)}
                         className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                         aria-label={showSignupPassword ? "Hide password" : "Show password"}
                       >
                         {showSignupPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                       </button>
                    </div>
                  </div>
                  <PasswordRequirements password={signupPassword} />

                  <div className="space-y-2">
                    <Label htmlFor="signup-confirm-password">Confirm Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-confirm-password"
                         type={showSignupConfirmPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={signupConfirmPassword}
                        onChange={(e) => setSignupConfirmPassword(e.target.value)}
                         className="pl-10 pr-10"
                        required
                      />
                       <button
                         type="button"
                         onClick={() => setShowSignupConfirmPassword(!showSignupConfirmPassword)}
                         className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                         aria-label={showSignupConfirmPassword ? "Hide password" : "Show password"}
                       >
                         {showSignupConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                       </button>
                    </div>
                  </div>

                  <Button type="submit" className="w-full premium-button" disabled={isLoading}>
                    {isLoading ? "Creating account..." : "Create Account"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
             )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
