import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Smartphone, Monitor, Box, Ruler, QrCode } from "lucide-react";
import "@google/model-viewer";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          src?: string;
          alt?: string;
          ar?: boolean;
          "ar-modes"?: string;
          "ar-scale"?: string;
          "camera-controls"?: boolean;
          "touch-action"?: string;
          "auto-rotate"?: boolean;
          "shadow-intensity"?: string;
          "environment-image"?: string;
          "ios-src"?: string;
          poster?: string;
          loading?: string;
          reveal?: string;
        },
        HTMLElement
      >;
    }
  }
}

const MACHINE_MODELS = [
  {
    id: "small",
    name: "Mini Claw",
    dimensions: '24" W × 30" D × 54" H',
    description: "Perfect for countertops and small spaces",
    // Using a public sample model — replace with real claw machine .glb files
    modelUrl: "https://modelviewer.dev/shared-assets/models/Astronaut.glb",
    scale: "0.8 0.8 0.8",
  },
  {
    id: "standard",
    name: "Standard Claw",
    dimensions: '33" W × 36" D × 72" H',
    description: "Most popular — fits most restaurant spaces",
    modelUrl: "https://modelviewer.dev/shared-assets/models/Astronaut.glb",
    scale: "1 1 1",
  },
  {
    id: "large",
    name: "Jumbo Claw",
    dimensions: '40" W × 42" D × 78" H',
    description: "High-capacity for high-traffic locations",
    modelUrl: "https://modelviewer.dev/shared-assets/models/Astronaut.glb",
    scale: "1.2 1.2 1.2",
  },
];

export default function ARPreview() {
  const [selectedModel, setSelectedModel] = useState(MACHINE_MODELS[1]);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
    check();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">AR Machine Placement</h1>
        <p className="text-muted-foreground mt-1">
          Preview claw machines in 3D and place them in any location using AR
        </p>
      </div>

      {/* Machine Selector */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {MACHINE_MODELS.map((machine) => (
          <Card
            key={machine.id}
            className={`cursor-pointer transition-all duration-200 ${
              selectedModel.id === machine.id
                ? "ring-2 ring-primary border-primary"
                : "hover:border-primary/50"
            }`}
            onClick={() => setSelectedModel(machine)}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-foreground">{machine.name}</h3>
                {selectedModel.id === machine.id && (
                  <Badge variant="default" className="text-xs">Selected</Badge>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                <Ruler className="h-3 w-3" />
                {machine.dimensions}
              </div>
              <p className="text-xs text-muted-foreground">{machine.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 3D Viewer */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Box className="h-5 w-5" />
            3D Preview — {selectedModel.name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative rounded-xl overflow-hidden bg-muted/30 border" style={{ height: "450px" }}>
            <model-viewer
              key={selectedModel.id}
              src={selectedModel.modelUrl}
              alt={`${selectedModel.name} claw machine`}
              ar
              ar-modes="webxr scene-viewer quick-look"
              ar-scale="fixed"
              camera-controls
              touch-action="pan-y"
              auto-rotate
              shadow-intensity="1"
              environment-image="neutral"
              loading="eager"
              style={{ width: "100%", height: "100%", outline: "none" } as React.CSSProperties}
            >
              <button
                slot="ar-button"
                className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-6 py-3 rounded-full font-semibold shadow-lg flex items-center gap-2 hover:opacity-90 transition-opacity"
              >
                <Smartphone className="h-4 w-4" />
                View in AR
              </button>
            </model-viewer>
          </div>

          <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Ruler className="h-4 w-4" />
              <span>Real-world size: {selectedModel.dimensions}</span>
            </div>
            {!isMobile && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted text-sm text-muted-foreground">
                <Monitor className="h-4 w-4" />
                Open on your phone to use AR placement
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardContent className="p-4">
          <h3 className="font-semibold text-foreground mb-2">How to use AR placement</h3>
          <ol className="list-decimal list-inside space-y-1.5 text-sm text-muted-foreground">
            <li>Select a machine size above</li>
            <li>Tap <strong>"View in AR"</strong> on your phone (button appears on mobile devices)</li>
            <li>Point your camera at the floor where you'd like to place the machine</li>
            <li>The machine will appear at its real-world size — walk around it to see the fit</li>
            <li>Take a screenshot to share with the location owner!</li>
          </ol>
          <p className="mt-3 text-xs text-muted-foreground">
            Works on iPhone (iOS 12+) and Android (Chrome). No app download needed.
          </p>
          <p className="mt-1 text-xs text-muted-foreground italic">
            Note: Currently using a placeholder 3D model. Replace with actual claw machine .glb files in <code>public/models/</code> for production use.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
