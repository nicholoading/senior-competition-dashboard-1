import { redirect } from "next/navigation"

export default function Home() {
  // For now, we'll always redirect to the sign-in page
  // Later, you can implement logic to check if the user is authenticated
  redirect("/signin")
}

