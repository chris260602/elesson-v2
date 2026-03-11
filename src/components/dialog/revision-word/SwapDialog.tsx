import { useForm } from "react-hook-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import axios from "axios";
import { useEffect } from "react";
import AxiosInstance from "@/utils/axiosInstance";

export function SwapDialog({ open, onOpenChange, item, onSuccess }: any) {
    const { register, handleSubmit, reset } = useForm();

    useEffect(() => {
        if(open && item) reset({ question_no: "" }); // Reset on open
    }, [open, item]);

    const onSubmit = async (data: any) => {
        if (!item?.id) return;
        try {
            await AxiosInstance.patch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/revision-problem-sums/${item.id}/swap-question-no`, data);
            toast.success("Swapped successfully");
            onSuccess();
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to swap");
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
                        <Button type="submit">Save</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}