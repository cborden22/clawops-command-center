import { Car, MapPin, DollarSign, Route, Gauge, Calendar } from "lucide-react";
import { ReportCard, ReportListItem } from "./ReportCard";
import { useReportsData } from "@/hooks/useReportsData";

interface RoutesReportsProps {
  data: ReturnType<typeof useReportsData>;
}

export function RoutesReports({ data }: RoutesReportsProps) {
  const { mileageAnalysis, locations } = data;

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);

  const purposeData = Object.entries(mileageAnalysis.milesByPurpose)
    .sort((a, b) => b[1] - a[1]);

  const mostVisitedLocations = Object.entries(mileageAnalysis.locationVisits)
    .map(([id, visits]) => ({
      id,
      name: locations.find(l => l.id === id)?.name || "Unknown",
      visits,
    }))
    .sort((a, b) => b.visits - a.visits)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <ReportCard
          title="Total Miles"
          icon={Route}
          metric={`${mileageAnalysis.totalMiles.toFixed(1)} mi`}
          metricLabel={`${mileageAnalysis.tripCount} trips`}
        />
        <ReportCard
          title="Tax Deduction"
          icon={DollarSign}
          metric={formatCurrency(mileageAnalysis.taxDeduction)}
          metricLabel="IRS rate: $0.67/mi"
        />
        <ReportCard
          title="Trips"
          icon={Calendar}
          metric={mileageAnalysis.tripCount}
          metricLabel="This period"
        />
        <ReportCard
          title="Avg per Trip"
          icon={Gauge}
          metric={`${mileageAnalysis.avgMilesPerTrip.toFixed(1)} mi`}
          metricLabel="Average distance"
        />
      </div>

      {/* Detailed Reports */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Miles by Purpose */}
        <ReportCard
          title="Miles by Purpose"
          icon={Route}
        >
          {purposeData.length > 0 ? (
            <div className="space-y-1">
              {purposeData.slice(0, 5).map(([purpose, miles], idx) => (
                <ReportListItem
                  key={purpose}
                  rank={idx + 1}
                  label={purpose}
                  value={`${miles.toFixed(1)} mi`}
                  subValue={`${((miles / mileageAnalysis.totalMiles) * 100).toFixed(1)}%`}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No mileage data
            </p>
          )}
        </ReportCard>

        {/* Most Visited Locations */}
        <ReportCard
          title="Most Visited Locations"
          icon={MapPin}
        >
          {mostVisitedLocations.length > 0 ? (
            <div className="space-y-1">
              {mostVisitedLocations.map((loc, idx) => (
                <ReportListItem
                  key={loc.id}
                  rank={idx + 1}
                  label={loc.name}
                  value={`${loc.visits} visits`}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No visit data
            </p>
          )}
        </ReportCard>

        {/* Vehicle Usage */}
        <ReportCard
          title="Vehicle Usage"
          icon={Car}
        >
          {mileageAnalysis.milesByVehicle.length > 0 ? (
            <div className="space-y-1">
              {mileageAnalysis.milesByVehicle.slice(0, 5).map((vehicle, idx) => (
                <ReportListItem
                  key={vehicle.name}
                  rank={idx + 1}
                  label={vehicle.name}
                  value={`${vehicle.miles.toFixed(1)} mi`}
                  subValue={`${vehicle.trips} trips`}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No vehicle data
            </p>
          )}
        </ReportCard>

        {/* Tax Deduction Summary */}
        <ReportCard
          title="Tax Deduction Summary"
          icon={DollarSign}
          className="lg:col-span-3"
        >
          <div className="grid md:grid-cols-3 gap-6 py-4">
            <div className="text-center p-4 rounded-lg bg-primary/5 border border-primary/20">
              <p className="text-sm text-muted-foreground mb-1">Total Business Miles</p>
              <p className="text-2xl font-bold text-primary">
                {mileageAnalysis.totalMiles.toFixed(1)} mi
              </p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50 border border-border">
              <p className="text-sm text-muted-foreground mb-1">IRS Rate (2024)</p>
              <p className="text-2xl font-bold">$0.67/mi</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-green-500/5 border border-green-500/20">
              <p className="text-sm text-muted-foreground mb-1">Tax Deduction</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(mileageAnalysis.taxDeduction)}
              </p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground text-center mt-4">
            * This is an estimate based on the standard IRS mileage rate. Consult a tax professional for actual deductions.
          </p>
        </ReportCard>
      </div>
    </div>
  );
}
