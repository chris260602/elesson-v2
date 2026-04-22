import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LevelType } from "@/types/level";

interface LevelDetailsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  level: LevelType | null;
}

export function LevelDetailsDialog({ isOpen, onOpenChange, level }: LevelDetailsDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Level Details</DialogTitle>
        </DialogHeader>
        
        {level && (
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right text-muted-foreground font-semibold">Level</Label>
              <Input 
                readOnly 
                value={level.name} 
                className="col-span-3 bg-slate-50" 
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right text-muted-foreground font-semibold">Password</Label>
              <Input 
                readOnly 
                value={level.password || "-"} 
                className="col-span-3 bg-slate-50 font-mono text-sm" 
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="destructive" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}