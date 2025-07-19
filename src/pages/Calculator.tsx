import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Calculator as CalcIcon, Plus, Trash2, Download, Target, Save } from "lucide-react"

interface Expense {
  id: string
  name: string
  amount: number
}

interface SavedScenario {
  id: string
  name: string
  profitPerMachine: number
  expenses: Expense[]
  createdAt: string
}

export default function Calculator() {
  const { toast } = useToast()
  const [profitPerMachine, setProfitPerMachine] = useState(300)
  const [expenses, setExpenses] = useState<Expense[]>([
    { id: "1", name: "Rent", amount: 1200 },
    { id: "2", name: "Car Payment", amount: 450 },
    { id: "3", name: "Insurance", amount: 200 }
  ])
  const [savedScenarios, setSavedScenarios] = useState<SavedScenario[]>([])
  const [scenarioName, setScenarioName] = useState("")

  const addExpense = () => {
    const newExpense: Expense = {
      id: Date.now().toString(),
      name: "",
      amount: 0
    }
    setExpenses([...expenses, newExpense])
  }

  const updateExpense = (id: string, field: keyof Expense, value: string | number) => {
    setExpenses(expenses.map(expense => 
      expense.id === id ? { ...expense, [field]: value } : expense
    ))
  }

  const removeExpense = (id: string) => {
    setExpenses(expenses.filter(expense => expense.id !== id))
  }

  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0)
  const machinesNeeded = Math.ceil(totalExpenses / profitPerMachine)
  const totalRevenue = machinesNeeded * profitPerMachine
  const surplus = totalRevenue - totalExpenses

  const handleExportReport = () => {
    const reportContent = `
ClawOps Machine Calculator Report
================================

Profit per Machine: $${profitPerMachine}

Monthly Expenses:
${expenses.map(expense => `- ${expense.name}: $${expense.amount}`).join('\n')}

Total Monthly Expenses: $${totalExpenses.toFixed(2)}
Machines Needed: ${machinesNeeded}
Projected Revenue: $${totalRevenue.toFixed(2)}
Monthly Surplus: $${surplus.toFixed(2)}

Generated on: ${new Date().toLocaleDateString()}
ClawOps Calculator
    `.trim()

    const blob = new Blob([reportContent], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ClawOps_Calculator_Report_${new Date().toISOString().split('T')[0]}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast({
      title: "Report Exported",
      description: "Calculator report has been downloaded successfully.",
    })
  }

  const handleSaveScenario = () => {
    if (!scenarioName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a scenario name.",
        variant: "destructive"
      })
      return
    }

    const newScenario: SavedScenario = {
      id: Date.now().toString(),
      name: scenarioName,
      profitPerMachine,
      expenses: [...expenses],
      createdAt: new Date().toISOString().split('T')[0]
    }

    setSavedScenarios(prev => [newScenario, ...prev])
    setScenarioName("")
    
    toast({
      title: "Scenario Saved",
      description: `"${scenarioName}" has been saved successfully.`,
    })
  }

  const loadScenario = (scenario: SavedScenario) => {
    setProfitPerMachine(scenario.profitPerMachine)
    setExpenses(scenario.expenses)
    
    toast({
      title: "Scenario Loaded",
      description: `"${scenario.name}" has been loaded.`,
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Machine Calculator</h1>
        <p className="text-muted-foreground mt-2">
          Calculate how many machines you need to cover your monthly expenses
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Input Section */}
        <div className="space-y-6">
          {/* Profit Per Machine */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Profit Per Machine
              </CardTitle>
              <CardDescription>
                Average monthly profit expected per machine
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="profit">Monthly Profit ($)</Label>
                <Input
                  id="profit"
                  type="number"
                  value={profitPerMachine}
                  onChange={(e) => setProfitPerMachine(Number(e.target.value) || 0)}
                  className="text-lg font-semibold"
                />
              </div>
            </CardContent>
          </Card>

          {/* Monthly Expenses */}
          <Card className="shadow-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Monthly Expenses</CardTitle>
                  <CardDescription>
                    List all your recurring monthly bills
                  </CardDescription>
                </div>
                <Button 
                  onClick={addExpense}
                  variant="outline"
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {expenses.map((expense) => (
                  <div key={expense.id} className="flex gap-2">
                    <div className="flex-1">
                      <Input
                        placeholder="Expense name"
                        value={expense.name}
                        onChange={(e) => updateExpense(expense.id, 'name', e.target.value)}
                      />
                    </div>
                    <div className="w-32">
                      <Input
                        type="number"
                        placeholder="Amount"
                        value={expense.amount || ''}
                        onChange={(e) => updateExpense(expense.id, 'amount', Number(e.target.value) || 0)}
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeExpense(expense.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                
                {expenses.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <CalcIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Add your monthly expenses to calculate machine requirements</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Results Section */}
        <div className="space-y-6">
          {/* Calculation Results */}
          <Card className="shadow-card bg-gradient-card">
            <CardHeader>
              <CardTitle className="text-center">Calculation Results</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Total Expenses */}
              <div className="text-center p-4 rounded-lg bg-card/80">
                <p className="text-sm text-muted-foreground">Total Monthly Expenses</p>
                <p className="text-2xl font-bold text-foreground">${totalExpenses.toFixed(2)}</p>
              </div>

              {/* Machines Needed */}
              <div className="text-center p-6 rounded-lg bg-primary/10 border-2 border-primary/20">
                <p className="text-sm text-muted-foreground mb-2">Machines Needed</p>
                <p className="text-4xl font-bold text-primary">{machinesNeeded}</p>
                <p className="text-sm text-muted-foreground mt-2">
                  to cover ${totalExpenses.toFixed(2)} in expenses
                </p>
              </div>

              {/* Revenue & Surplus */}
              <div className="space-y-3">
                <div className="flex justify-between p-3 rounded-lg bg-card/80">
                  <span className="text-muted-foreground">Projected Revenue</span>
                  <span className="font-semibold">${totalRevenue.toFixed(2)}</span>
                </div>
                <div className="flex justify-between p-3 rounded-lg bg-green-50 text-green-700">
                  <span>Monthly Surplus</span>
                  <span className="font-semibold">+${surplus.toFixed(2)}</span>
                </div>
              </div>

              {/* Save Scenario */}
              <div className="space-y-2">
                <Label htmlFor="scenario-name">Scenario Name</Label>
                <Input
                  id="scenario-name"
                  placeholder="Enter scenario name..."
                  value={scenarioName}
                  onChange={(e) => setScenarioName(e.target.value)}
                />
              </div>

              {/* Actions */}
              <div className="space-y-2">
                <Button 
                  className="w-full bg-gradient-primary hover:bg-primary/90"
                  onClick={handleExportReport}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Report
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={handleSaveScenario}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Scenario
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-base">Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Revenue per machine</span>
                <span className="font-medium">${profitPerMachine}/month</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Break-even point</span>
                <span className="font-medium">{Math.ceil(totalExpenses / profitPerMachine)} machines</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Expense coverage</span>
                <span className="font-medium">{((totalRevenue / totalExpenses) * 100).toFixed(0)}%</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Saved Scenarios */}
      {savedScenarios.length > 0 && (
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Saved Scenarios</CardTitle>
            <CardDescription>
              Your previously saved calculation scenarios
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {savedScenarios.map((scenario) => (
                <div key={scenario.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-smooth">
                  <div>
                    <p className="font-medium">{scenario.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {scenario.expenses.length} expenses • $${scenario.profitPerMachine}/machine • {scenario.createdAt}
                    </p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => loadScenario(scenario)}
                  >
                    Load
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}