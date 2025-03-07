"use client";

import type React from "react";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { getUserTeamDetails } from "@/lib/teamHelpers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Icons } from "@/components/ui/icons";

export function ProjectSubmission() {
  const [scratchFile, setScratchFile] = useState<File | null>(null);
  const [activeGrouping, setActiveGrouping] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [teamDetails, setTeamDetails] = useState<{ teamId: string; teamName: string; authorName: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const { toast } = useToast();

  const STORAGE_BASE_URL = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/`;

  useEffect(() => {
    const fetchUserDataAndGrouping = async () => {
      const { data: user, error } = await supabase.auth.getUser();
      if (error || !user?.user?.email) {
        console.warn("⚠️ No authenticated user found:", error?.message);
        toast({
          title: "Error",
          description: "User not authenticated.",
          variant: "destructive",
        });
        return;
      }
      console.log("Authenticated user:", user.user.email, "JWT:", user.user.aud);

      const teamData = await getUserTeamDetails(user.user.email);
      if (!teamData) {
        console.warn("No team data found for user:", user.user.email);
        toast({
          title: "Error",
          description: "Team data not found.",
          variant: "destructive",
        });
        return;
      }
      console.log("Team details:", teamData);
      setTeamDetails(teamData);

      const { data: teamGroupings, error: groupingError } = await supabase
        .from("teamGroupings")
        .select("grouping")
        .eq("teamName", teamData.teamName);

      if (groupingError || !teamGroupings || teamGroupings.length === 0) {
        console.warn("No groupings found for team:", groupingError?.message);
        toast({
          title: "Error",
          description: "No groupings found for team.",
          variant: "destructive",
        });
        return;
      }

      const groupingNames = teamGroupings.map((g) => g.grouping);
      const { data: activeGroupings, error: statusError } = await supabase
        .from("groupingStatus")
        .select("grouping")
        .in("grouping", groupingNames)
        .eq("status", "active");

      if (statusError || !activeGroupings || activeGroupings.length === 0) {
        console.warn("No active groupings found:", statusError?.message);
        toast({
          title: "Error",
          description: "No active grouping found.",
          variant: "destructive",
        });
        return;
      }

      const activeGroup = activeGroupings[0]?.grouping || null;
      console.log("Active grouping:", activeGroup);
      setActiveGrouping(activeGroup);
    };

    fetchUserDataAndGrouping();
  }, [toast]);

  const resetForm = () => {
    setScratchFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (formRef.current) formRef.current.reset();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file && file.name.endsWith(".sb3")) {
      setScratchFile(file);
    } else {
      toast({
        title: "Invalid File",
        description: "Please upload a valid .sb3 file.",
        variant: "destructive",
      });
      setScratchFile(null);
    }
  };

  const uploadScratchFile = async () => {
    if (!teamDetails || !scratchFile) {
      console.warn("No team details or file to upload:", { teamDetails, scratchFile });
      return null;
    }

    const filePath = `${teamDetails.teamId}/${scratchFile.name}`;
    console.log("Uploading file to:", `scratch-files/${filePath}`);
    const { data, error } = await supabase.storage
      .from("scratch-files")
      .upload(filePath, scratchFile, {
        upsert: true,
      });

    if (error) {
      console.error("Storage upload error:", error);
      toast({
        title: "Upload Error",
        description: `Failed to upload ${scratchFile.name}: ${error.message}`,
        variant: "destructive",
      });
      return null;
    }

    const publicUrl = `${STORAGE_BASE_URL}scratch-files/${filePath}`;
    console.log("File uploaded, public URL:", publicUrl);
    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!teamDetails) {
      toast({
        title: "Submission Failed",
        description: "No team information found.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    if (!scratchFile) {
      toast({
        title: "Submission Failed",
        description: "Please select a .sb3 file to upload.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    try {
      const projectLink = await uploadScratchFile();
      if (!projectLink) {
        throw new Error("File upload failed.");
      }

      console.log("Inserting into projects table:", {
        teamId: teamDetails.teamId,
        authorName: teamDetails.authorName,
        projectLink,
        stage: activeGrouping,
        createdAt: new Date().toISOString(),
      });

      const { data, error } = await supabase.from("projects").insert([
        {
          teamId: teamDetails.teamId,
          authorName: teamDetails.authorName,
          projectLink,
          stage: activeGrouping,
          createdAt: new Date().toISOString(),
        },
      ]);

      if (error) {
        console.error("Database insert error:", error);
        throw error;
      }

      console.log("Insert successful:", data);
      toast({
        title: "Project Submitted",
        description: "Your Scratch project has been submitted successfully.",
      });

      resetForm();
    } catch (error: any) {
      console.error("Submission error:", error);
      toast({
        title: "Submission Failed",
        description: error.message || "An error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Submit Scratch Project</CardTitle>
      </CardHeader>
      <CardContent>
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="scratchFile">Scratch Project File (.sb3)</Label>
            <Input
              id="scratchFile"
              type="file"
              accept=".sb3"
              onChange={handleFileChange}
              ref={fileInputRef}
              required
            />
            {scratchFile && (
              <p className="text-sm text-gray-500">Selected file: {scratchFile.name}</p>
            )}
          </div>
          <Button type="submit" className="w-full" disabled={isLoading || !scratchFile}>
            {isLoading ? <Icons.spinner className="mr-2 h-4 w-4 animate-spin" /> : "Submit Project"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}