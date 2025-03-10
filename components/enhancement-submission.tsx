"use client";

import type React from "react";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { getUserTeamDetails } from "@/lib/teamHelpers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Icons } from "@/components/ui/icons";

type EnhancementType = "advanced" | "basic";

export function EnhancementSubmission() {
  const [enhancementType, setEnhancementType] = useState<EnhancementType>("basic");
  const [screenshots, setScreenshots] = useState<File[]>([]);
  const [activeGrouping, setActiveGrouping] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [description, setDescription] = useState("");
  const [justification, setJustification] = useState("");
  const [teamDetails, setTeamDetails] = useState<{
    teamId: string;
    teamName: string;
    authorName: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchUserDataAndGrouping = async () => {
      const { data: user, error } = await supabase.auth.getUser();
      if (error || !user?.user?.email) {
        console.warn("⚠️ No authenticated user found.");
        return;
      }

      const teamData = await getUserTeamDetails(user.user.email);
      if (teamData) {
        setTeamDetails(teamData);

        const { data: teamGroupings, error: groupingError } = await supabase
          .from("teamGroupings")
          .select("grouping")
          .eq("teamName", teamData.teamName);

        if (groupingError || !teamGroupings || teamGroupings.length === 0) {
          console.warn("No groupings found for team:", groupingError?.message);
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
          return;
        }

        const activeGroup = activeGroupings[0]?.grouping || null;
        setActiveGrouping(activeGroup);
      }
    };

    fetchUserDataAndGrouping();
  }, []);

  const resetForm = () => {
    setEnhancementType("basic");
    setScreenshots([]);
    setDescription("");
    setJustification("");
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
      const filePath = `enhancements/${teamDetails.teamId}/${Date.now()}-${file.name}`;
      const { data, error } = await supabase.storage
        .from("enhancementScreenshots")
        .upload(filePath, file);

      if (error) {
        toast({
          title: "Upload Error",
          description: `Failed to upload ${file.name}.`,
          variant: "destructive",
        });
        return null;
      }

      const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/enhancementScreenshots/${filePath}`;
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

      const { error } = await supabase.from("enhancements").insert([
        {
          teamId: teamDetails.teamId,
          authorName: teamDetails.authorName,
          enhancementType,
          screenshots: screenshotUrls,
          description,
          justification,
          stage: activeGrouping,
          createdAt: new Date().toISOString(),
        },
      ]);

      if (error) {
        throw error;
      }

      toast({
        title: "Enhancement Submitted",
        description: `Your ${enhancementType} enhancement has been submitted successfully.`,
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
    <Card>
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Submit Enhancement</CardTitle>
      </CardHeader>
      <CardContent>
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="enhancementType">Enhancement Type</Label>
            <Select value={enhancementType} onValueChange={setEnhancementType}>
              <SelectTrigger>
                <SelectValue placeholder="Select enhancement type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="basic">Medium</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>
          </div>
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
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your enhancement..."
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="justification">Justification</Label>
            <Textarea
              id="justification"
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              placeholder="Justify why this enhancement is necessary..."
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? <Icons.spinner className="mr-2 h-4 w-4 animate-spin" /> : "Submit Enhancement"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}