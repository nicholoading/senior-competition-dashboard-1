"use client"

import React, { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { getUserTeamDetails } from "@/lib/teamHelpers"
import { useToast } from "@/hooks/use-toast"

const Page = () => {
  const [missionPackContent, setMissionPackContent] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const fetchMissionPackContent = async () => {
      try {
        setIsLoading(true)

        // Step 1: Get user and team details
        const { data: user, error: userError } = await supabase.auth.getUser()
        if (userError || !user?.user?.email) {
          throw new Error("User not authenticated.")
        }

        const teamData = await getUserTeamDetails(user.user.email)
        if (!teamData) {
          throw new Error("Team data not found.")
        }

        // Step 2: Fetch active grouping
        const { data: teamGroupings, error: groupingError } = await supabase
          .from("teamGroupings")
          .select("grouping")
          .eq("teamName", teamData.teamName)

        if (groupingError || !teamGroupings || teamGroupings.length === 0) {
          throw new Error("No groupings found for team.")
        }

        const groupingNames = teamGroupings.map((g) => g.grouping)
        const { data: activeGroupings, error: statusError } = await supabase
          .from("groupingStatus")
          .select("grouping")
          .in("grouping", groupingNames)
          .eq("status", "active")

        if (statusError || !activeGroupings || activeGroupings.length === 0) {
          throw new Error("No active grouping found.")
        }

        const activeGroup = activeGroupings[0]?.grouping || null
        if (!activeGroup) {
          throw new Error("Active grouping is null.")
        }

        // Step 3: Fetch stageId from stages table
        const { data: stageData, error: stageError } = await supabase
          .from("stages")
          .select("stageId")
          .eq("stageName", activeGroup)
          .single()

        if (stageError || !stageData) {
          throw new Error("Stage not found for grouping: " + activeGroup)
        }

        const stageId = stageData.stageId

        // Step 4: Fetch mission pack content from missionPacks table with category filter
        const { data: missionPackData, error: missionPackError } = await supabase
          .from("missionPacks")
          .select("content")
          .eq("stageId", stageId)
          .eq("category", "Senior-Scratch")
          .single()

        if (missionPackError || !missionPackData) {
          throw new Error("Mission pack not found or not in Senior-Scratch category.")
        }

        setMissionPackContent(missionPackData.content)
      } catch (error: any) {
        console.error("Error fetching mission pack:", error.message)
        toast({
          title: "Error",
          description: error.message || "Failed to load mission pack.",
          variant: "destructive",
        })
        setMissionPackContent(null)
      } finally {
        setIsLoading(false)
      }
    }

    fetchMissionPackContent()
  }, [toast])

  if (isLoading) {
    return <p>Loading mission pack...</p>
  }

  if (!missionPackContent) {
    return <p>No mission pack available for the current stage in Senior-Scratch category.</p>
  }

  return <div dangerouslySetInnerHTML={{ __html: missionPackContent }} />
}

export default Page