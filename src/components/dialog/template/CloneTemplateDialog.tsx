
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
import { TemplateItem } from "@/types/template";

interface CloneTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isCloning: boolean;
  target: TemplateItem | null;
}

export function CloneTemplateDialog({
  open,
  onOpenChange,
  onConfirm,
  isCloning,
  target,
}: CloneTemplateDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Clone Template?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to clone{" "}
            <span className="font-semibold text-foreground">
              {target?.title}
            </span>
            ?
            <br />
            A copy will be created in the active templates list.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isCloning}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            disabled={isCloning}
          >
            {isCloning ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Cloning...
              </>
            ) : (
              "Yes, Clone it"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
