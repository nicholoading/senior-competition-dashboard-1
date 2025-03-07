import { BugSubmission } from "@/components/bug-submission"

export default function BugPage({ params }: { params: { id: string } }) {
  const bugNumber = Number.parseInt(params.id, 10)

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Bug #{bugNumber}</h1>
      <BugSubmission bugNumber={bugNumber} />
    </div>
  )
}

