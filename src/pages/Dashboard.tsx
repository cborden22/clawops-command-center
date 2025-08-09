
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, Calculator, Users, DollarSign } from "lucide-react"
import { Link } from "react-router-dom"
import { CommissionSummaryGenerator } from "@/components/CommissionSummaryGenerator"

export default function Dashboard() {
  const stats = [
    {
      title: "Total Machines",
      value: "24",
      icon: DollarSign,
      trend: "+2 this month"
    },
    {
      title: "Monthly Revenue",
      value: "$7,200",
      icon: DollarSign,
      trend: "+15% from last month"
    }
  ]

  const quickActions = [
    {
      title: "Documents",
      href: "/documents",
      icon: FileText
    },
    {
      title: "Calculator",
      href: "/calculator",
      icon: Calculator
    },
    {
      title: "Leads",
      href: "/leads",
      icon: Users
    }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">
          Your claw machine business overview
        </p>
      </div>

      {/* Essential Stats */}
      <div className="grid gap-4 md:grid-cols-2">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{stat.trend}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            {quickActions.map((action) => (
              <Link key={action.title} to={action.href}>
                <Button variant="outline" className="flex items-center gap-2">
                  <action.icon className="h-4 w-4" />
                  {action.title}
                </Button>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Commission Summary Generator */}
      <CommissionSummaryGenerator />
    </div>
  )
}
