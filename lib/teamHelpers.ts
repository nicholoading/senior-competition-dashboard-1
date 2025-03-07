import { supabase } from "@/lib/supabase";

/**
 * Fetches team details for a logged-in user.
 */
export const getUserTeamDetails = async (userEmail: string) => {
  console.log("🔍 Fetching team details for:", userEmail);

  // First, check if the user is a teacher
  const { data: teacherTeam, error: teacherError } = await supabase
    .from("teams")
    .select("id, teamName, teacherEmail, teacherName, teamMembers")
    .eq("teacherEmail", userEmail)
    .single();

  if (teacherError && teacherError.code !== "PGRST116") {
    console.error("❌ Error fetching teacher team details:", teacherError);
    return null;
  }

  if (teacherTeam) {
    console.log("✅ User is a TEACHER in team:", teacherTeam.teamName);
    return {
      teamId: teacherTeam.id,
      teamName: teacherTeam.teamName,
      authorName: teacherTeam.teacherName, // Use teacher name
    };
  }

  // 🔥 FIXED: Query teamMembers JSONB correctly!
  const { data: studentTeams, error: studentError } = await supabase
    .from("teams")
    .select("id, teamName, teamMembers")
    .filter("teamMembers", "cs", JSON.stringify([{ parentEmail: userEmail }])); // ✅ JSON stringified

  if (studentError) {
    console.error("❌ Error fetching student team details:", studentError);
    return null;
  }

  if (!studentTeams || studentTeams.length === 0) {
    console.warn("⚠️ No matching team found for user:", userEmail);
    return null;
  }

  // Find the student in `teamMembers`
  const team = studentTeams[0];
  const foundMember = team.teamMembers.find((member: any) => member.parentEmail === userEmail);
  
  if (!foundMember) {
    console.warn("⚠️ No matching team member found in JSONB.");
    return null;
  }

  console.log("✅ User is a TEAM MEMBER in team:", team.teamName);
  return {
    teamId: team.id,
    teamName: team.teamName,
    authorName: foundMember.name, // Use student name
  };
};
