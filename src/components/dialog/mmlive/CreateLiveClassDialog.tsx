"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2 } from "lucide-react";

// UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

// Define the type for the class item expected in the dropdown
export type ClassDropdownItem = {
  id: number;
  class_id: string; 
};

// Form Schema
const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  class_id: z.string().min(1, "Class is required"),
  server: z.string().min(1, "Server is required"),
});

// Infer the type for external use
export type CreateLiveClassFormValues = z.infer<typeof formSchema>;

interface CreateLiveClassDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classes: ClassDropdownItem[];
  onSubmit: (data: CreateLiveClassFormValues) => void;
  isLoading: boolean;
}

export function CreateLiveClassDialog({
  open,
  onOpenChange,
  classes,
  onSubmit,
  isLoading,
}: CreateLiveClassDialogProps) {
  const form = useForm<CreateLiveClassFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      class_id: "",
      server: "server 3",
    },
  });

  const handleSubmit = (values: CreateLiveClassFormValues) => {
    onSubmit(values);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>New E-Learning</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 py-4">
            
            {/* Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Session Title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Class Selection */}
            <FormField
              control={form.control}
              name="class_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Class</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Class" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {classes.map((c) => (
                        <SelectItem key={c.id} value={c.class_id}>
                          {c.class_id}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Server Selection */}
            <FormField
              control={form.control}
              name="server"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Server</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Server" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="server 3">Server 3</SelectItem>
                      <SelectItem value="server backup">Backup Server 3</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}