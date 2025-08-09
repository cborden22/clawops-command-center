
import { CommissionSummaryGenerator } from "@/components/CommissionSummaryGenerator"

export default function CommissionSummary() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Commission Summary</h1>
        <p className="text-muted-foreground">
          Generate professional commission reports for your partner locations
        </p>
      </div>

      <CommissionSummaryGenerator />
    </div>
  )
}
