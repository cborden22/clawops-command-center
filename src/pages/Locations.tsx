import { LocationTrackerComponent } from "@/components/LocationTrackerComponent";

const Locations = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Location Tracker</h1>
          <p className="text-muted-foreground mt-2">
            Manage all your claw machine locations in one place
          </p>
        </div>
        <LocationTrackerComponent />
      </div>
    </div>
  );
};

export default Locations;
