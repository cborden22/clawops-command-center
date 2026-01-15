import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { FileText, Calculator, Target } from "lucide-react";
import { CollectionReportsSheet } from "./CollectionReportsSheet";

interface DocumentsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DocumentsSheet({ open, onOpenChange }: DocumentsSheetProps) {
  const navigate = useNavigate();
  const [collectionsOpen, setCollectionsOpen] = useState(false);

  const handleSelect = (path: string) => {
    onOpenChange(false);
    navigate(path);
  };

  const handleCollectionsOpen = () => {
    onOpenChange(false);
    setCollectionsOpen(true);
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="rounded-t-2xl">
          <SheetHeader className="pb-4">
            <SheetTitle className="text-center">Documents & Reports</SheetTitle>
          </SheetHeader>
          <div className="grid grid-cols-2 gap-4 pb-6">
            <Button
              variant="outline"
              className="h-24 flex-col gap-2 text-base"
              onClick={() => handleSelect("/documents")}
            >
              <FileText className="h-8 w-8 text-primary" />
              <span>Location Agreement</span>
            </Button>
            <Button
              variant="outline"
              className="h-24 flex-col gap-2 text-base"
              onClick={() => handleSelect("/commission-summary")}
            >
              <Calculator className="h-8 w-8 text-primary" />
              <span>Commission Summary</span>
            </Button>
            <Button
              variant="outline"
              className="h-24 flex-col gap-2 text-base col-span-2"
              onClick={handleCollectionsOpen}
            >
              <Target className="h-8 w-8 text-primary" />
              <span>Collection Reports</span>
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <CollectionReportsSheet open={collectionsOpen} onOpenChange={setCollectionsOpen} />
    </>
  );
}
