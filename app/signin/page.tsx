"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  async function checkTeamCategory(userEmail: string) {
    console.log("Checking team for email:", userEmail);
  
    // First check if email matches teacherEmail
    let { data: teacherData, error: teacherError } = await supabase
      .from("teams")
      .select("teamName, category")
      .eq("teacherEmail", userEmail)
      .single();
  
    if (teacherData) {
      console.log("Found as teacher:", teacherData);
      return teacherData;
    }
  
    if (teacherError && teacherError.code !== "PGRST116") {
      console.error("Teacher query error:", teacherError);
      return null;
    }
  
    // If not a teacher, check parentEmail in teamMembers
    console.log("Not found as teacher, checking teamMembers...");
    const { data: memberData, error: memberError } = await supabase
      .from("teams")
      .select("teamName, category")
      .contains("teamMembers", JSON.stringify([{ parentEmail: userEmail }])) // Stringify the array
      .single();
  
    if (memberData) {
      console.log("Found as team member:", memberData);
      return memberData;
    }
  
    if (memberError && memberError.code !== "PGRST116") {
      console.error("Team members query error:", memberError);
    } else {
      console.log("No team found for this email in teamMembers");
    }
  
    return null;
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setIsLoading(true);

    // First authenticate the user
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setIsLoading(false);
      toast({ 
        title: "Login Failed", 
        description: authError.message, 
        variant: "destructive" 
      });
      return;
    }

    // Check team and category
    const teamInfo = await checkTeamCategory(email);

    if (!teamInfo) {
      setIsLoading(false);
      toast({ 
        title: "Login Failed", 
        description: "No team found for this email (neither as teacher nor parent)", 
        variant: "destructive" 
      });
      await supabase.auth.signOut();
      return;
    }

    if (teamInfo.category !== "Senior-Scratch") {
      setIsLoading(false);
      toast({ 
        title: "Login Failed", 
        description: "Wrong category. Only Senior-Scratch category is allowed.", 
        variant: "destructive" 
      });
      await supabase.auth.signOut();
      return;
    }

    // If everything is correct
    setIsLoading(false);
    toast({ 
      title: "Login Successful", 
      description: `Welcome ${teamInfo.teamName}! Redirecting...`, 
      duration: 3000 
    });
    router.push("/dashboard");
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center">Sign in</CardTitle>
          <CardDescription className="text-center">Enter your credentials to access your account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="m@example.com" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
              />
            </div>
            <Button className="w-full" type="submit" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}