import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, Calculator, Users, TrendingUp, Target, DollarSign } from "lucide-react"
import { Link } from "react-router-dom"

export default function Dashboard() {
  const stats = [
    {
      title: "Total Machines",
      value: "24",
      description: "Active locations",
      icon: Target,
      trend: "+2 this month"
    },
    {
      title: "Monthly Revenue",
      value: "$7,200",
      description: "Average per machine: $300",
      icon: DollarSign,
      trend: "+15% from last month"
    },
    {
      title: "Active Leads",
      value: "12",
      description: "Pending follow-ups",
      icon: Users,
      trend: "3 closing this week"
    },
    {
      title: "Documents",
      value: "48",
      description: "Templates & contracts",
      icon: FileText,
      trend: "5 created this week"
    }
  ]

  const quickActions = [
    {
      title: "Create Document",
      description: "Generate contracts and agreements",
      icon: FileText,
      href: "/documents",
      color: "bg-blue-500"
    },
    {
      title: "Calculate Machines",
      description: "Plan your machine requirements",
      icon: Calculator,
      href: "/calculator",
      color: "bg-green-500"
    },
    {
      title: "Add Lead",
      description: "Track new business opportunities",
      icon: Users,
      href: "/leads",
      color: "bg-purple-500"
    }
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Welcome back! Here's what's happening with your claw machine business.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="shadow-card hover:shadow-hover transition-smooth">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stat.description}
              </p>
              <p className="text-xs text-primary mt-2 font-medium">
                {stat.trend}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-4">Quick Actions</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {quickActions.map((action) => (
            <Link key={action.title} to={action.href}>
              <Card className="group cursor-pointer hover:shadow-hover transition-smooth h-full">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg ${action.color} flex items-center justify-center`}>
                      <action.icon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{action.title}</CardTitle>
                      <CardDescription className="text-sm">
                        {action.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Recent Activity
          </CardTitle>
          <CardDescription>
            Latest updates across your business operations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { action: "New lead added", detail: "Downtown Arcade - contacted", time: "2 hours ago", type: "lead" },
              { action: "Document created", detail: "Location Agreement Template v2", time: "5 hours ago", type: "document" },
              { action: "Machine installed", detail: "Pizza Palace location", time: "1 day ago", type: "machine" },
              { action: "Follow-up completed", detail: "Bowlero - contract signed", time: "2 days ago", type: "lead" }
            ].map((activity, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b last:border-0">
                <div>
                  <p className="font-medium text-foreground">{activity.action}</p>
                  <p className="text-sm text-muted-foreground">{activity.detail}</p>
                </div>
                <span className="text-xs text-muted-foreground">{activity.time}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}