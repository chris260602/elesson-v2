import { useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Loader2 } from "lucide-react";

export default function PasscodeDialog({ open, onOpenChange, onSubmit, isLoading }: { open: boolean, onOpenChange: (v:boolean)=>void, onSubmit: (s:string)=>void, isLoading: boolean }) {
  const [code, setCode] = useState("");
  return (
    <Dialog open={open} onOpenChange={(val) => { if(!val) setCode(""); onOpenChange(val); }}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader><DialogTitle>Enter Passcode</DialogTitle></DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); if(code) onSubmit(code); }} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label>Passcode required</Label>
            <Input 
                placeholder="Enter Passcode" 
                value={code} 
                onChange={(e) => setCode(e.target.value)} 
                autoFocus 
                disabled={isLoading}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isLoading || !code}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2"/> : null}
                {isLoading ? "Verifying..." : "Submit"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}