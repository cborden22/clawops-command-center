import { useState, useMemo, useRef, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Printer, Search, MapPin } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface BatchMachine {
  id: string;
  machineId: string;
  name: string;
  locationName: string;
  locationSlug?: string;
  unitCode?: string;
}

interface BatchQRPrintDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  machines: BatchMachine[];
}

const escapeHtml = (str: string) =>
  str.replace(/[&<>"']/g, (m) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m] || m)
  );

export function BatchQRPrintDialog({ open, onOpenChange, machines }: BatchQRPrintDialogProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const qrContainerRef = useRef<HTMLDivElement>(null);

  // Reset selection when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedIds(new Set());
      setSearch("");
    }
  }, [open]);

  const filtered = useMemo(
    () =>
      machines.filter(
        (m) =>
          m.name.toLowerCase().includes(search.toLowerCase()) ||
          m.locationName.toLowerCase().includes(search.toLowerCase())
      ),
    [machines, search]
  );

  // Group by location
  const grouped = useMemo(() => {
    const map = new Map<string, BatchMachine[]>();
    for (const m of filtered) {
      const group = map.get(m.locationName) || [];
      group.push(m);
      map.set(m.locationName, group);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  const allFilteredSelected =
    filtered.length > 0 && filtered.every((m) => selectedIds.has(m.id));

  const toggleAll = () => {
    if (allFilteredSelected) {
      const newSet = new Set(selectedIds);
      for (const m of filtered) newSet.delete(m.id);
      setSelectedIds(newSet);
    } else {
      const newSet = new Set(selectedIds);
      for (const m of filtered) newSet.add(m.id);
      setSelectedIds(newSet);
    }
  };

  const toggle = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const handlePrint = () => {
    const selected = machines.filter((m) => selectedIds.has(m.id));
    if (selected.length === 0) {
      toast({ title: "No machines selected", description: "Please select at least one machine.", variant: "destructive" });
      return;
    }

    // Render hidden QR codes to get SVG data
    const container = qrContainerRef.current;
    if (!container) return;

    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

    const stickersHtml = selected
      .map((m) => {
        const reportUrl =
          m.locationSlug && m.unitCode
            ? `${baseUrl}/report/${m.locationSlug}/${m.unitCode}`
            : `${baseUrl}/m/${m.machineId}`;

        // Find the rendered SVG for this machine
        const svgEl = container.querySelector(`[data-machine-id="${m.id}"] svg`);
        const svgData = svgEl ? new XMLSerializer().serializeToString(svgEl) : "";

        const safeName = escapeHtml(m.name);
        const safeLocation = escapeHtml(m.locationName);

        return `
          <div class="sticker">
            <div class="left-column">
              <h1>HAVING TROUBLE?</h1>
              <p class="subtitle">Scan to report an issue</p>
              <div class="steps">
                <div class="step">1. Open your camera</div>
                <div class="step">2. Point at the QR code</div>
                <div class="step">3. Tap the link</div>
              </div>
              <div class="branding">ClawOps</div>
            </div>
            <div class="right-column">
              <div class="qr-code">${svgData}</div>
              <div class="machine-info">
                <div class="machine-name">${safeName}</div>
                <div class="location-name">${safeLocation}</div>
              </div>
            </div>
          </div>
        `;
      })
      .join("");

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast({ title: "Pop-up Blocked", description: "Please allow pop-ups to print QR codes.", variant: "destructive" });
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR Sticker Sheet</title>
          <style>
            @page {
              size: letter;
              margin: 0.25in;
            }
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body {
              font-family: system-ui, -apple-system, sans-serif;
              background: white;
            }
            .grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 0;
              width: 8in;
              margin: 0 auto;
            }
            .sticker {
              width: 3.5in;
              height: 2in;
              padding: 0.15in;
              display: flex;
              border: 1px dashed #ccc;
              page-break-inside: avoid;
              break-inside: avoid;
            }
            .left-column {
              flex: 1;
              display: flex;
              flex-direction: column;
              justify-content: center;
              padding-right: 0.15in;
            }
            .right-column {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
            }
            h1 { font-size: 13px; font-weight: 700; margin-bottom: 2px; color: #000; }
            .subtitle { font-size: 9px; color: #666; margin-bottom: 10px; }
            .steps { font-size: 9px; line-height: 1.5; color: #333; }
            .step { margin-bottom: 2px; }
            .branding { font-size: 8px; color: #999; margin-top: auto; padding-top: 8px; }
            .qr-code svg { width: 1.25in; height: 1.25in; }
            .machine-info { text-align: center; margin-top: 4px; }
            .machine-name { font-size: 8px; font-weight: 600; color: #000; }
            .location-name { font-size: 7px; color: #666; }
            @media print {
              .sticker { border: none; }
            }
          </style>
        </head>
        <body>
          <div class="grid">
            ${stickersHtml}
          </div>
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() { window.close(); };
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Build URLs for hidden QR rendering
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Printer className="h-5 w-5 text-primary" />
            Print QR Sheet
          </DialogTitle>
          <DialogDescription>
            Select machines to print a sheet of QR code stickers
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search machines or locations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Select All */}
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer text-sm font-medium">
              <Checkbox
                checked={allFilteredSelected}
                onCheckedChange={toggleAll}
              />
              Select All
            </label>
            <span className="text-sm text-muted-foreground">
              {selectedIds.size} selected
            </span>
          </div>

          {/* Machine List */}
          <ScrollArea className="h-[300px] border rounded-lg">
            <div className="p-2 space-y-3">
              {grouped.map(([locationName, locationMachines]) => (
                <div key={locationName}>
                  <div className="flex items-center gap-1.5 px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    <MapPin className="h-3 w-3" />
                    {locationName}
                  </div>
                  {locationMachines.map((m) => (
                    <label
                      key={m.id}
                      className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent/50 cursor-pointer transition-colors"
                    >
                      <Checkbox
                        checked={selectedIds.has(m.id)}
                        onCheckedChange={() => toggle(m.id)}
                      />
                      <span className="text-sm">{m.name}</span>
                    </label>
                  ))}
                </div>
              ))}
              {filtered.length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-8">
                  No machines found
                </p>
              )}
            </div>
          </ScrollArea>

          {/* Print Button */}
          <Button
            onClick={handlePrint}
            disabled={selectedIds.size === 0}
            className="w-full gap-2"
          >
            <Printer className="h-4 w-4" />
            Print Sheet ({selectedIds.size} sticker{selectedIds.size !== 1 ? "s" : ""})
          </Button>
        </div>

        {/* Hidden QR codes for SVG extraction */}
        <div ref={qrContainerRef} className="sr-only" aria-hidden="true">
          {machines
            .filter((m) => selectedIds.has(m.id))
            .map((m) => {
              const reportUrl =
                m.locationSlug && m.unitCode
                  ? `${baseUrl}/report/${m.locationSlug}/${m.unitCode}`
                  : `${baseUrl}/m/${m.machineId}`;
              return (
                <div key={m.id} data-machine-id={m.id}>
                  <QRCodeSVG
                    value={reportUrl}
                    size={200}
                    level="H"
                    includeMargin
                    bgColor="#ffffff"
                    fgColor="#000000"
                  />
                </div>
              );
            })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
