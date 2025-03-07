"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { getUserTeamDetails } from "@/lib/teamHelpers";
import { useToast } from "@/hooks/use-toast";

const Page = () => {
  const [missionPackLink, setMissionPackLink] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchMissionPackLink = async () => {
      try {
        setIsLoading(true);

        // Step 1: Get user and team details
        const { data: user, error: userError } = await supabase.auth.getUser();
        if (userError || !user?.user?.email) {
          throw new Error("User not authenticated.");
        }

        const teamData = await getUserTeamDetails(user.user.email);
        if (!teamData) {
          throw new Error("Team data not found.");
        }

        // Step 2: Fetch active grouping
        const { data: teamGroupings, error: groupingError } = await supabase
          .from("teamGroupings")
          .select("grouping")
          .eq("teamName", teamData.teamName);

        if (groupingError || !teamGroupings || teamGroupings.length === 0) {
          throw new Error("No groupings found for team.");
        }

        const groupingNames = teamGroupings.map((g) => g.grouping);
        const { data: activeGroupings, error: statusError } = await supabase
          .from("groupingStatus")
          .select("grouping")
          .in("grouping", groupingNames)
          .eq("status", "active");

        if (statusError || !activeGroupings || activeGroupings.length === 0) {
          throw new Error("No active grouping found.");
        }

        const activeGroup = activeGroupings[0]?.grouping || null;
        if (!activeGroup) {
          throw new Error("Active grouping is null.");
        }

        // Step 3: Fetch stageId from stages table
        const { data: stageData, error: stageError } = await supabase
          .from("stages")
          .select("stageId")
          .eq("stageName", activeGroup)
          .single();

        if (stageError || !stageData) {
          throw new Error("Stage not found for grouping: " + activeGroup);
        }

        const stageId = stageData.stageId;

        // Step 4: Fetch mission pack link from missionPacks table with category filter
        const { data: missionPackData, error: missionPackError } = await supabase
          .from("missionPacks")
          .select("link")
          .eq("stageId", stageId)
          .eq("category", "Senior-Scratch") // Added category filter
          .single();

        if (missionPackError || !missionPackData) {
          throw new Error("Mission pack not found or not in Senior-Scratch category.");
        }

        setMissionPackLink(missionPackData.link);
      } catch (error: any) {
        console.error("Error fetching mission pack:", error.message);
        toast({
          title: "Error",
          description: error.message || "Failed to load mission pack.",
          variant: "destructive",
        });
        // Fallback to a default link or null
        setMissionPackLink(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMissionPackLink();
  }, [toast]);

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <div className="w-full h-full max-w-5xl p-4 bg-white rounded-lg shadow-lg">
        <h1 className="text-xl font-bold text-center mb-4">Mission Pack</h1>
        {isLoading ? (
          <div className="flex items-center justify-center h-[600px]">
            <p>Loading mission pack...</p>
          </div>
        ) : missionPackLink ? (
          <iframe
            src={missionPackLink}
            width="100%"
            height="600px"
            style={{ border: "none" }}
            allowFullScreen
          ></iframe>
        ) : (
          <div className="flex items-center justify-center h-[600px]">
            <p>No mission pack available for the current stage in Senior-HTML category.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Page;