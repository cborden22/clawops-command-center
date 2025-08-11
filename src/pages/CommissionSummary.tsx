
import { CommissionSummaryGenerator } from "@/components/CommissionSummaryGenerator"
import { Receipt, TrendingUp, DollarSign, Target } from "lucide-react"

export default function CommissionSummary() {
  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-gold-500/10 to-gold-600/5 rounded-2xl blur-xl" />
        <div className="relative glass-card p-8 rounded-2xl">
          <div className="flex items-center gap-4 mb-4">
            <div className="relative">
              <div className="p-3 bg-gradient-to-br from-gold-500 to-gold-600 rounded-xl shadow-lg">
                <Receipt className="h-8 w-8 text-primary-foreground" />
              </div>
              <div className="absolute -inset-1 bg-gradient-to-br from-gold-500 to-gold-600 rounded-xl opacity-20 blur animate-glow" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gold-500 to-gold-600 bg-clip-text text-transparent">
                Commission Summary
              </h1>
              <p className="text-muted-foreground text-lg mt-2">
                Generate professional commission reports for your partner locations
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-6 mt-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingUp className="h-4 w-4 text-gold-500" />
              <span>Performance Analytics</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <DollarSign className="h-4 w-4 text-gold-500" />
              <span>Revenue Tracking</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Target className="h-4 w-4 text-gold-500" />
              <span>Goal Management</span>
            </div>
          </div>
        </div>
      </div>

      <div className="glass-card rounded-2xl border-white/10 accent-glow">
        <CommissionSummaryGenerator />
      </div>
    </div>
  )
}
