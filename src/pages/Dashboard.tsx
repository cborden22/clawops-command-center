
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, Calculator, Users, DollarSign, Receipt } from "lucide-react"
import { Link } from "react-router-dom"

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
    },
    {
      title: "Commission Summary",
      href: "/commission-summary",
      icon: Receipt
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
          <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
            {quickActions.map((action) => (
              <Link key={action.title} to={action.href}>
                <Button variant="outline" className="w-full flex items-center gap-2 h-auto p-4 flex-col">
                  <action.icon className="h-6 w-6" />
                  <span className="text-sm">{action.title}</span>
                </Button>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Machine #12 - Downtown Mall</span>
              <span className="font-medium">+$45.50</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Machine #08 - Shopping Center</span>
              <span className="font-medium">+$32.75</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Machine #15 - Airport</span>
              <span className="font-medium">+$67.25</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
