import { supabase } from "@/lib/supabase";

export async function getTeamGroupings(teamName: string) {
  console.log("📊 Fetching all groupings for team:", teamName);

  const { data: teamGroupings, error } = await supabase
    .from("teamGroupings")
    .select("grouping")
    .eq("teamName", teamName);

  if (error || !teamGroupings || teamGroupings.length === 0) {
    console.warn("⚠️ No team groupings found.");
    return [];
  }

  const groupNames = teamGroupings.map(g => g.grouping);
  console.log("🏆 Team belongs to groupings:", groupNames);
  return groupNames; // Return an array of group names
}

export async function isAnyGroupingActive(teamGroupings: string[]) {
  console.log("📊 Checking if any of these groupings are active:", teamGroupings);

  const { data: activeGroupings, error } = await supabase
    .from("groupingStatus")
    .select("grouping")
    .eq("status", "active");

  if (error || !activeGroupings || activeGroupings.length === 0) {
    console.warn("❌ No active groupings found.");
    return false;
  }

  const activeGroupingNames = activeGroupings.map(g => g.grouping);
  console.log("🔥 Currently active groupings:", activeGroupingNames);

  // Check if ANY of the user's groupings match an active grouping
  const isAllowed = teamGroupings.some(group => activeGroupingNames.includes(group));

  if (isAllowed) {
    console.log("✅ Team is in an active grouping. Access granted.");
    return true;
  } else {
    console.warn("❌ Team is NOT in an active grouping. Access denied.");
    return false;
  }
}
