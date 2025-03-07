import Link from "next/link"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Lightbulb, Map, Video, Send, Bug } from "lucide-react"

export default function SubmissionPage() {
  const submissionTypes = [
    {
      href: "/dashboard/submission/bugs",
      icon: Bug,
      title: "Bugs",
      description: "Submit bug fixes",
    },
    {
      href: "/dashboard/submission/enhancement",
      icon: Lightbulb,
      title: "Enhancement",
      description: "Submit enhancement suggestions",
    },
    {
      href: "/dashboard/submission/brainstorm-map",
      icon: Map,
      title: "Brainstorm Map",
      description: "Upload your brainstorm map",
    },
    {
      href: "/dashboard/submission/presentation",
      icon: Video,
      title: "Presentation",
      description: "Submit your presentation video",
    },
    { href: "/dashboard/submission/project", icon: Send, title: "Project", description: "Submit your final project" },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Submissions</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {submissionTypes.map((type) => (
          <Card key={type.href}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <type.icon className="h-5 w-5" />
                {type.title}
              </CardTitle>
              <CardDescription>{type.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href={type.href}>
                <Button className="w-full">Go to {type.title}</Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

