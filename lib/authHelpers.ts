import { supabase } from "@/lib/supabase";

export async function getAuthenticatedUser() {
  console.log("🔍 Checking authenticated user...");
  const { data: user, error } = await supabase.auth.getUser();

  if (error || !user?.user?.email) {
    console.warn("⚠️ No authenticated user found.");
    return null;
  }

  console.log("✅ User email:", user.user.email);
  return user.user.email;
}

export async function getUserTeam(email: string) {
  console.log("🛠️ Searching for user's team...");

  // 1️⃣ First, check if the user is a TEACHER
  const { data: teacherTeam } = await supabase
    .from("teams")
    .select("teamName")
    .eq("teacherEmail", email)
    .maybeSingle();

  if (teacherTeam) {
    console.log("✅ User is a TEACHER in team:", teacherTeam.teamName);
    return teacherTeam.teamName;
  }

  // 2️⃣ Check if the user is a TEAM MEMBER (parent email inside JSONB)
  const { data: parentTeam } = await supabase
    .from("teams")
    .select("teamName")
    .filter("teamMembers", "cs", `[{"parentEmail": "${email}"}]`)
    .maybeSingle();

  if (parentTeam) {
    console.log("✅ User is a TEAM MEMBER in team:", parentTeam.teamName);
    return parentTeam.teamName;
  }

  console.warn("⚠️ No team found for user.");
  return null;
}

export async function fetchUserTeamData(setUserEmail: any, setTeamName: any, setUserName: any) {
  console.log("🔍 Fetching logged-in user...");

  const { data: user, error } = await supabase.auth.getUser();

  console.log("📊 Raw user data:", user);

  if (error || !user?.user?.email) {
    console.warn("⚠️ No authenticated user found.");
    return;
  }

  const email = user.user.email;
  setUserEmail(email);
  console.log("✅ User email retrieved:", email);

  console.log("🛠️ Fetching team data from Supabase...");
  const { data: teams, error: teamError } = await supabase
    .from("teams")
    .select("teamName, teacherEmail, teacherName, teamMembers");

  if (teamError) {
    console.error("❌ Error fetching team data:", teamError);
    return;
  }

  console.log("📊 Teams Data:", teams);

  for (const team of teams) {
    console.log("🔎 Checking team:", team.teamName);

    if (team.teacherEmail === email) {
      console.log("✅ User is a TEACHER in team:", team.teamName);
      setTeamName(team.teamName);
      setUserName(team.teacherName);
      return;
    }

    // Check if the user is a team member (by parentEmail)
    const foundMember = team.teamMembers.find(
      (member: any) => member.parentEmail === email
    );
    if (foundMember) {
      console.log("✅ User is a TEAM MEMBER in team:", team.teamName);
      setTeamName(team.teamName);
      setUserName(foundMember.name);
      return;
    }
  }

  console.warn("⚠️ No matching team found for user:", email);
}
