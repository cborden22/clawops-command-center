
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, Calculator, Users, DollarSign } from "lucide-react"
import { Link } from "react-router-dom"

export default function Dashboard() {
  const stats = [
    {
      title: "Total Machines",
      value: "24",
      icon: Users,
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

  const recentActivity = [
    { action: "New lead added", time: "2 hours ago" },
    { action: "Document created", time: "5 hours ago" },
    { action: "Machine installed", time: "1 day ago" }
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

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm">{activity.action}</span>
                <span className="text-xs text-muted-foreground">{activity.time}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
