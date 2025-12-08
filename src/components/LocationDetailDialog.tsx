import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  MapPin,
  User,
  Phone,
  Mail,
  Sparkles,
  FileText,
  DollarSign,
  Calendar,
  Building2,
} from "lucide-react";
import { Location } from "@/hooks/useLocations";

interface LocationDetailDialogProps {
  location: Location | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LocationDetailDialog({
  location,
  open,
  onOpenChange,
}: LocationDetailDialogProps) {
  if (!location) return null;

  const agreementCount = location.agreements?.length || 0;
  const commissionCount = location.commissionSummaries?.length || 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <MapPin className="h-5 w-5 text-primary" />
            </div>
            <div>
              <span>{location.name}</span>
              <Badge
                variant={location.isActive ? "default" : "secondary"}
                className="ml-3"
              >
                {location.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="details" className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Details
            </TabsTrigger>
            <TabsTrigger value="agreements" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Agreements
              {agreementCount > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                  {agreementCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="commissions" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Commissions
              {commissionCount > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                  {commissionCount}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 mt-4">
            {/* Details Tab */}
            <TabsContent value="details" className="mt-0 space-y-4">
              <Card>
                <CardContent className="pt-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> Address
                      </p>
                      <p className="font-medium">{location.address || "—"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <User className="h-3 w-3" /> Contact Person
                      </p>
                      <p className="font-medium">{location.contactPerson || "—"}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Phone className="h-3 w-3" /> Phone
                      </p>
                      <p className="font-medium">{location.contactPhone || "—"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Mail className="h-3 w-3" /> Email
                      </p>
                      <p className="font-medium">{location.contactEmail || "—"}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Sparkles className="h-3 w-3" /> Machines
                      </p>
                      <p className="font-medium">{location.machineCount}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Commission Rate</p>
                      <p className="font-medium">
                        {location.commissionRate > 0
                          ? `${location.commissionRate}%`
                          : "—"}
                      </p>
                    </div>
                  </div>

                  {location.notes && (
                    <div>
                      <p className="text-sm text-muted-foreground">Notes</p>
                      <p className="font-medium">{location.notes}</p>
                    </div>
                  )}

                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground">
                      Created: {format(new Date(location.createdAt), "MMM d, yyyy")}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Agreements Tab */}
            <TabsContent value="agreements" className="mt-0 space-y-3">
              {agreementCount === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-3">
                    <FileText className="h-8 w-8 text-muted-foreground/50" />
                  </div>
                  <p className="text-muted-foreground font-medium">No agreements yet</p>
                  <p className="text-sm text-muted-foreground/70 mt-1">
                    Generate an agreement from the Documents page
                  </p>
                </div>
              ) : (
                location.agreements.map((agreement) => (
                  <Card key={agreement.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-medium">{agreement.providerName}</p>
                          <p className="text-sm text-muted-foreground">
                            {agreement.providerAddress}
                          </p>
                        </div>
                        <Badge variant="outline">
                          {agreement.paymentType === "percentage"
                            ? `${agreement.revenueSharePercentage}% Share`
                            : `$${agreement.flatFeeAmount?.toFixed(2)} Flat`}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-3 gap-3 text-sm">
                        <div>
                          <p className="text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" /> Agreement Date
                          </p>
                          <p className="font-medium">
                            {format(new Date(agreement.agreementDate), "MMM d, yyyy")}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Start Date</p>
                          <p className="font-medium">
                            {format(new Date(agreement.startDate), "MMM d, yyyy")}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">End Date</p>
                          <p className="font-medium">
                            {format(new Date(agreement.endDate), "MMM d, yyyy")}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 pt-3 border-t flex justify-between text-xs text-muted-foreground">
                        <span>Payment: {agreement.paymentMethod}</span>
                        <span>Notice: {agreement.noticePeriod}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            {/* Commission Summaries Tab */}
            <TabsContent value="commissions" className="mt-0 space-y-3">
              {commissionCount === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-3">
                    <DollarSign className="h-8 w-8 text-muted-foreground/50" />
                  </div>
                  <p className="text-muted-foreground font-medium">
                    No commission summaries yet
                  </p>
                  <p className="text-sm text-muted-foreground/70 mt-1">
                    Generate a summary from the Commission Summary page
                  </p>
                </div>
              ) : (
                location.commissionSummaries.map((summary) => (
                  <Card key={summary.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-medium flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            {format(new Date(summary.startDate), "MMM d")} -{" "}
                            {format(new Date(summary.endDate), "MMM d, yyyy")}
                          </p>
                        </div>
                        <Badge className="bg-primary/20 text-primary hover:bg-primary/30">
                          ${summary.commissionAmount.toFixed(2)}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-3 gap-3 text-sm">
                        <div>
                          <p className="text-muted-foreground">Total Revenue</p>
                          <p className="font-medium text-lg">
                            ${summary.totalRevenue.toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Commission</p>
                          <p className="font-medium">
                            {summary.commissionPercentage}%
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Machines</p>
                          <p className="font-medium">{summary.machineCount}</p>
                        </div>
                      </div>

                      {summary.notes && (
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-xs text-muted-foreground">
                            Notes: {summary.notes}
                          </p>
                        </div>
                      )}

                      <p className="text-xs text-muted-foreground mt-2">
                        Generated:{" "}
                        {format(new Date(summary.createdAt), "MMM d, yyyy 'at' h:mm a")}
                      </p>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
