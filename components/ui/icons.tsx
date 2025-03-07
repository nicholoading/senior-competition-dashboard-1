import { Loader2, User, Users, Github, ChromeIcon as Google } from "lucide-react"

export const Icons = {
  spinner: Loader2,
  teacher: Users,
  student: User,
  gitHub: Github,
  google: Google,
}

export type Icon = keyof typeof Icons

