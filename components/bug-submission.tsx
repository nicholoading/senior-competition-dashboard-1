"use client";

import type React from "react";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { getUserTeamDetails } from "@/lib/teamHelpers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { Icons } from "@/components/ui/icons";

export function BugSubmission({ bugNumber }: { bugNumber: number }) {
  const [screenshots, setScreenshots] = useState<File[]>([]);
  const [method, setMethod] = useState("");
  const [activeGrouping, setActiveGrouping] = useState<string | null>(null);
  const [bugDetails, setBugDetails] = useState<{
    description: string;
    expectedBehaviorImg: string;
    bugImageImg: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [teamDetails, setTeamDetails] = useState<{ teamId: string; teamName: string; authorName: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const { toast } = useToast();

  const STORAGE_BASE_URL = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/`;

  useEffect(() => {
    const fetchData = async () => {
      const { data: user, error: userError } = await supabase.auth.getUser();
      if (userError || !user?.user?.email) {
        console.warn("⚠️ No authenticated user found.");
        toast({ title: "Error", description: "User not authenticated.", variant: "destructive" });
        return;
      }

      const teamData = await getUserTeamDetails(user.user.email);
      if (!teamData) {
        console.warn("No team data found.");
        toast({ title: "Error", description: "Team data not found.", variant: "destructive" });
        return;
      }
      setTeamDetails(teamData);

      const { data: teamGroupings, error: groupingError } = await supabase
        .from("teamGroupings")
        .select("grouping")
        .eq("teamName", teamData.teamName);

      if (groupingError || !teamGroupings || teamGroupings.length === 0) {
        console.warn("No groupings found for team:", groupingError?.message);
        toast({ title: "Error", description: "No groupings found for team.", variant: "destructive" });
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
        toast({ title: "Error", description: "No active grouping found.", variant: "destructive" });
        return;
      }

      const activeGroup = activeGroupings[0]?.grouping || null;
      setActiveGrouping(activeGroup);

      if (!activeGroup) return;

      const { data: stageData, error: stageError } = await supabase
        .from("stages")
        .select("stageId")
        .eq("stageName", activeGroup)
        .single();

      if (stageError || !stageData) {
        console.warn("Stage not found for grouping:", activeGroup, stageError?.message);
        toast({ title: "Error", description: "Stage not found.", variant: "destructive" });
        return;
      }

      const stageId = stageData.stageId;

      const { data: bugData, error: bugError } = await supabase
        .from("bugs")
        .select("description, expectedBehaviorImg, bugImageImg")
        .eq("stageId", stageId)
        .eq("bugNumber", bugNumber)
        .eq("category", "Junior-Scratch")
        .single();

      if (bugError || !bugData) {
        console.warn("Bug not found or not in Junior-Scratch category:", bugError?.message);
        toast({
          title: "Error",
          description: "Bug not found or does not belong to Junior-Scratch category.",
          variant: "destructive",
        });
        return;
      }

      setBugDetails({
        description: bugData.description,
        expectedBehaviorImg: `${STORAGE_BASE_URL}${bugData.expectedBehaviorImg}`,
        bugImageImg: `${STORAGE_BASE_URL}${bugData.bugImageImg}`,
      });
    };

    fetchData();
  }, [bugNumber, toast]);

  const resetForm = () => {
    setScreenshots([]);
    setMethod("");
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (formRef.current) formRef.current.reset();
  };

  const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setScreenshots((prevScreenshots) => [...prevScreenshots, ...files]);
  };

  const removeScreenshot = (index: number) => {
    setScreenshots((prevScreenshots) => prevScreenshots.filter((_, i) => i !== index));
  };

  const uploadScreenshots = async () => {
    if (!teamDetails) return null;
    const uploadedUrls: string[] = [];

    for (const file of screenshots) {
      const filePath = `bugs/${teamDetails.teamId}/${bugNumber}/${Date.now()}-${file.name}`;
      const { data, error } = await supabase.storage.from("bugScreenshots").upload(filePath, file);

      if (error) {
        toast({
          title: "Upload Error",
          description: `Failed to upload ${file.name}.`,
          variant: "destructive",
        });
        return null;
      }

      const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/bugScreenshots/${filePath}`;
      uploadedUrls.push(url);
    }

    return uploadedUrls;
  };

  const checkGroupingStatus = async () => {
    if (!teamDetails) return false;

    const { data: teamGroupings, error: groupingError } = await supabase
      .from("teamGroupings")
      .select("grouping")
      .eq("teamName", teamDetails.teamName);

    if (groupingError || !teamGroupings || teamGroupings.length === 0) {
      console.warn("No groupings found for team:", groupingError?.message);
      return false;
    }

    const groupingNames = teamGroupings.map((g) => g.grouping);
    const { data: activeGroupings, error: statusError } = await supabase
      .from("groupingStatus")
      .select("grouping")
      .in("grouping", groupingNames)
      .eq("status", "active");

    if (statusError || !activeGroupings || activeGroupings.length === 0) {
      console.warn("No active groupings found:", statusError?.message);
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const isGroupingActive = await checkGroupingStatus();
    if (!isGroupingActive) {
      toast({
        title: "Submission Blocked",
        description: "The grouping is no longer active. Reloading the page...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.reload();
      }, 1500);
      return;
    }

    if (!teamDetails) {
      toast({
        title: "Submission Failed",
        description: "No team information found.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    try {
      const screenshotUrls = await uploadScreenshots();
      if (!screenshotUrls) {
        throw new Error("Screenshot upload failed.");
      }

      const { error } = await supabase.from("bugSubmissions").insert([
        {
          teamId: teamDetails.teamId,
          authorName: teamDetails.authorName,
          bugNumber,
          screenshots: screenshotUrls,
          description: method,
          stage: activeGrouping,
          createdAt: new Date().toISOString(),
        },
      ]);

      if (error) {
        throw error;
      }

      toast({
        title: "Submission Successful",
        description: "Your bug fix has been submitted for review.",
      });

      resetForm();
    } catch (error: any) {
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
    <div className="grid md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Bug #{bugNumber} Description</CardTitle>
          <CardDescription>Review the bug details before submitting your fix</CardDescription>
        </CardHeader>
        <CardContent>
          {bugDetails ? (
            <div className="space-y-4">
              <p>{bugDetails.description}</p>
              <div className="space-y-2">
                <p className="font-medium">Bug Screenshot:</p>
                <Image
                  src={bugDetails.bugImageImg}
                  alt={`Bug ${bugNumber} screenshot`}
                  width={400}
                  height={300}
                  className="rounded-md"
                />
              </div>
              <div className="space-y-2">
                <p className="font-medium">Expected Behavior:</p>
                <Image
                  src={bugDetails.expectedBehaviorImg}
                  alt="Expected behavior screenshot"
                  width={400}
                  height={300}
                  className="rounded-md"
                />
              </div>
            </div>
          ) : (
            <p>Loading bug details...</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Submit Your Fix</CardTitle>
          <CardDescription>Upload your code and describe your method</CardDescription>
        </CardHeader>
        <CardContent>
          <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="screenshot">Code Screenshot(s)</Label>
              <Input
                id="screenshot"
                type="file"
                accept="image/*"
                onChange={handleScreenshotChange}
                ref={fileInputRef}
                multiple
                required
              />
              {screenshots.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm text-gray-500">Selected files:</p>
                  <ul className="list-disc pl-5">
                    {screenshots.map((file, index) => (
                      <li key={index} className="text-sm flex items-center justify-between">
                        <span>{file.name}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeScreenshot(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          Remove
                        </Button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="method">Fix Method Description</Label>
              <Textarea
                id="method"
                placeholder="Describe how you fixed the bug..."
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <Icons.spinner className="mr-2 h-4 w-4 animate-spin" /> : "Submit Fix"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}