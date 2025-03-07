"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function DashboardContent() {
  return (
    <div className="grid gap-6">
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

