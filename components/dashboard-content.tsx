"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/supabase"
import { getUserTeamDetails } from "@/lib/teamHelpers"
import { useToast } from "@/hooks/use-toast"

export function DashboardContent() {
  const [updates, setUpdates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const fetchUpdates = async () => {
      // 1. Get current user
      const { data: user, error: userError } = await supabase.auth.getUser()
      if (userError || !user?.user?.email) {
        console.warn("⚠️ No authenticated user found.")
        toast({
          title: "Error",
          description: "User not authenticated.",
          variant: "destructive",
        })
        return
      }

      // 2. Get user's team details
      const teamData = await getUserTeamDetails(user.user.email)
      if (!teamData) {
        console.warn("No team data found.")
        toast({
          title: "Error",
          description: "Team data not found.",
          variant: "destructive",
        })
        return
      }

      // 3. Get all team groupings
      const { data: teamGroupings, error: groupingError } = await supabase
        .from("teamGroupings")
        .select("grouping")
        .eq("teamName", teamData.teamName)

      if (groupingError || !teamGroupings || teamGroupings.length === 0) {
        console.warn("No groupings found for team:", groupingError?.message)
        toast({
          title: "Error",
          description: "No groupings found for team.",
          variant: "destructive",
        })
        return
      }

      const groupingNames = teamGroupings.map((g) => g.grouping)

      // 4. Get stages for all groupings
      const { data: stageData, error: stageError } = await supabase
        .from("stages")
        .select("stageId, stageName")
        .in("stageName", groupingNames)

      if (stageError || !stageData || stageData.length === 0) {
        console.warn("Stages not found for groupings:", stageError?.message)
        toast({
          title: "Error",
          description: "Stages not found.",
          variant: "destructive",
        })
        return
      }

      const stageIds = stageData.map((stage) => stage.stageId)

      const possibleCategories = ["Senior-Scratch"]

      const { data: updatesData, error: updatesError } = await supabase
        .from("update")
        .select("stageId, content, description, category")
        .in("stageId", stageIds)
        .in("category", possibleCategories)

      if (updatesError || !updatesData) {
        console.warn("Updates not found:", updatesError?.message)
        toast({
          title: "Error",
          description: "No updates found.",
          variant: "destructive",
        })
        return
      }

      // 6. Map stageIds back to stageNames for display
      const updatesWithStageNames = updatesData.map((update) => ({
        ...update,
        stageName:
          stageData.find((stage) => stage.stageId === update.stageId)?.stageName || "Unknown",
      }))

      setUpdates(updatesWithStageNames)
      setLoading(false)
    }

    fetchUpdates()
  }, [toast])

  if (loading) {
    return <div>Loading updates...</div>
  }

  return (
    <div className="grid gap-6">
      {updates.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold">No Updates</CardTitle>
          </CardHeader>
          <CardContent>
            <p>No updates available for your team at this time.</p>
          </CardContent>
        </Card>
      ) : (
        updates.map((update, index) => (
          <Card key={index}>
            <CardHeader>
              <CardTitle className="text-xl font-semibold">{update.description}</CardTitle>
            </CardHeader>
            <CardContent>
              <div dangerouslySetInnerHTML={{ __html: update.content }} />
            </CardContent>
          </Card>
        ))
      )}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Need Help?</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Contact support</p>
          <p className="text-sm text-muted-foreground mt-2">
            If you have any questions, our support team is here to help.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}