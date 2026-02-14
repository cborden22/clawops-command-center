 import { useState, useEffect } from "react";
 import { useNavigate } from "react-router-dom";
 import { useAuth } from "@/contexts/AuthContext";
 import { supabase } from "@/integrations/supabase/client";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { Label } from "@/components/ui/label";
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
 import { Sparkles, Lock, Eye, EyeOff, CheckCircle2 } from "lucide-react";
 import { toast } from "@/hooks/use-toast";
import { z } from "zod";
import PasswordRequirements from "@/components/shared/PasswordRequirements";

const passwordSchema = z.string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Must contain an uppercase letter")
  .regex(/[a-z]/, "Must contain a lowercase letter")
  .regex(/[0-9]/, "Must contain a number")
  .regex(/[^A-Za-z0-9]/, "Must contain a special character");
 
 export default function ResetPassword() {
   const navigate = useNavigate();
   const { updatePassword } = useAuth();
   const [isLoading, setIsLoading] = useState(false);
   const [isValidSession, setIsValidSession] = useState(false);
   const [isCheckingSession, setIsCheckingSession] = useState(true);
   const [isSuccess, setIsSuccess] = useState(false);
 
   const [newPassword, setNewPassword] = useState("");
   const [confirmPassword, setConfirmPassword] = useState("");
   const [showNewPassword, setShowNewPassword] = useState(false);
   const [showConfirmPassword, setShowConfirmPassword] = useState(false);
 
   useEffect(() => {
     // Check if we have a valid recovery session
     const checkSession = async () => {
       const { data: { session } } = await supabase.auth.getSession();
       
       // Listen for the PASSWORD_RECOVERY event
       const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
         if (event === "PASSWORD_RECOVERY") {
           setIsValidSession(true);
           setIsCheckingSession(false);
         } else if (session) {
           // User has a valid session (from clicking the reset link)
           setIsValidSession(true);
           setIsCheckingSession(false);
         }
       });
 
       // If we already have a session, assume it's valid for password reset
       if (session) {
         setIsValidSession(true);
       }
       setIsCheckingSession(false);
 
       return () => subscription.unsubscribe();
     };
 
     checkSession();
   }, []);
 
   const handleResetPassword = async (e: React.FormEvent) => {
     e.preventDefault();
 
     try {
       passwordSchema.parse(newPassword);
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
 
     if (newPassword !== confirmPassword) {
       toast({
         title: "Password Mismatch",
         description: "Passwords do not match. Please try again.",
         variant: "destructive",
       });
       return;
     }
 
     setIsLoading(true);
     const { error } = await updatePassword(newPassword);
     setIsLoading(false);
 
     if (error) {
       toast({
         title: "Reset Failed",
         description: "Unable to update password. Please try again.",
         variant: "destructive",
       });
     } else {
       setIsSuccess(true);
       toast({
         title: "Password Updated",
         description: "Your password has been successfully reset.",
       });
     }
   };
 
   if (isCheckingSession) {
     return (
       <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted p-4">
         <div className="animate-pulse text-muted-foreground">Verifying reset link...</div>
       </div>
     );
   }
 
   if (!isValidSession) {
     return (
       <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted p-4">
         <div className="w-full max-w-md">
           <Card className="glass-card border-border/50">
             <CardHeader className="text-center">
               <CardTitle className="text-xl text-destructive">Invalid or Expired Link</CardTitle>
               <CardDescription>
                 This password reset link is invalid or has expired. Please request a new one.
               </CardDescription>
             </CardHeader>
             <CardContent>
               <Button 
                 onClick={() => navigate("/auth")} 
                 className="w-full"
               >
                 Back to Login
               </Button>
             </CardContent>
           </Card>
         </div>
       </div>
     );
   }
 
   if (isSuccess) {
     return (
       <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted p-4">
         <div className="w-full max-w-md">
           <Card className="glass-card border-border/50">
             <CardHeader className="text-center">
               <div className="mx-auto mb-4 w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                 <CheckCircle2 className="h-6 w-6 text-primary" />
               </div>
               <CardTitle className="text-xl">Password Reset Successful</CardTitle>
               <CardDescription>
                 Your password has been updated. You can now log in with your new password.
               </CardDescription>
             </CardHeader>
             <CardContent>
               <Button 
                 onClick={() => navigate("/")} 
                 className="w-full premium-button"
               >
                 Go to Dashboard
               </Button>
             </CardContent>
           </Card>
         </div>
       </div>
     );
   }
 
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
             <CardTitle className="text-xl">Reset Your Password</CardTitle>
             <CardDescription>
               Enter your new password below
             </CardDescription>
           </CardHeader>
           <CardContent>
             <form onSubmit={handleResetPassword} className="space-y-4">
               <div className="space-y-2">
                 <Label htmlFor="new-password">New Password</Label>
                 <div className="relative">
                   <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                   <Input
                     id="new-password"
                     type={showNewPassword ? "text" : "password"}
                     placeholder="••••••••"
                     value={newPassword}
                     onChange={(e) => setNewPassword(e.target.value)}
                     className="pl-10 pr-10"
                     required
                   />
                   <button
                     type="button"
                     onClick={() => setShowNewPassword(!showNewPassword)}
                     className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                     aria-label={showNewPassword ? "Hide password" : "Show password"}
                   >
                     {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                   </button>
                  </div>
                </div>
                <PasswordRequirements password={newPassword} />

                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                 <div className="relative">
                   <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                   <Input
                     id="confirm-password"
                     type={showConfirmPassword ? "text" : "password"}
                     placeholder="••••••••"
                     value={confirmPassword}
                     onChange={(e) => setConfirmPassword(e.target.value)}
                     className="pl-10 pr-10"
                     required
                   />
                   <button
                     type="button"
                     onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                     className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                     aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                   >
                     {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                   </button>
                 </div>
               </div>
 
               <Button type="submit" className="w-full premium-button" disabled={isLoading}>
                 {isLoading ? "Updating..." : "Reset Password"}
               </Button>
             </form>
           </CardContent>
         </Card>
       </div>
     </div>
   );
 }