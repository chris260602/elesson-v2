import { useForm } from "react-hook-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { showErrorMessage, showSuccessMessage } from "@/utils/notificationUtils";
import { swapQuestionNumber } from "@/apiRoutes/revision-words";

export function SwapDialog({ open, onOpenChange, item, onSuccess }: any) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { register, handleSubmit, reset } = useForm();

    useEffect(() => {
        if (open && item) reset({ question_no: "" }); // Reset on open
    }, [open, item]);

    const onSubmit = async (data: any) => {
        if (!item?.id) return;
        setIsSubmitting(true);
        try {
            await swapQuestionNumber(item.id, data);
            showSuccessMessage("Swapped successfully");
            onSuccess(data.question_no); // Pass the new number for optimistic update
        } catch (error: any) {
            showErrorMessage(error.response?.data?.message || "Failed to swap");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-sm">
                <DialogHeader><DialogTitle>Swap Question Number</DialogTitle></DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <Label>Current Number: <span className="font-bold">{item?.question_no}</span></Label>
                    </div>
                    <div className="space-y-2">
                        <Label>Swap To Question No.</Label>
                        <Input type="number" {...register("question_no", { required: true })} />
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Swapping...</> : "Save"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}