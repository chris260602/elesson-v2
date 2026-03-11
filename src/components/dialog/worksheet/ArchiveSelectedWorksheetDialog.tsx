
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2 } from "lucide-react";

interface ArchiveSelectedWorksheetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isArchiving: boolean;
  selectedRowsCount: number;
}

export function ArchiveSelectedWorksheetDialog({
  open,
  onOpenChange,
  onConfirm,
  isArchiving,
  selectedRowsCount,
}: ArchiveSelectedWorksheetDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Archive Selected Worksheets?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to archive{" "}
            <strong>{selectedRowsCount}</strong> selected worksheet(s)? These
            items will be moved to the archive list.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isArchiving}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            disabled={isArchiving}
            className="bg-slate-900"
          >
            {isArchiving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Archiving...
              </>
            ) : (
              "Yes, Archive Them"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
