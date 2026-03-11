
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { FileRow } from "@/components/core/FileRow";
import { MediaItem } from "@/types/worksheet";

interface FileUploaderProps {
  title: string;
  type: "videos" | "graphics" | "latest_worksheets";
  items: MediaItem[];
  onFileUpload: (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "videos" | "graphics" | "latest_worksheets"
  ) => void;
  onView: (
    item: MediaItem,
    type: "videos" | "graphics" | "latest_worksheets"
  ) => void;
  onRemove: (
    type: "videos" | "graphics" | "latest_worksheets",
    index: number,
    mediaId?: string | number
  ) => void;
  isUploading: boolean;
  deletingId: string | null;
}

export function FileUploader({
  title,
  type,
  items,
  onFileUpload,
  onView,
  onRemove,
  isUploading,
  deletingId,
}: FileUploaderProps) {
  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <Label className="block font-semibold text-primary">{title}</Label>
        <Button
          size="sm"
          variant="outline"
          className="relative h-7 text-xs gap-1"
          disabled={isUploading}
        >
          <Upload className="h-3 w-3" /> Add {title.slice(0, -1)}
          <input
            type="file"
            className="absolute inset-0 opacity-0 cursor-pointer"
            accept={type === "videos" ? "video/*" : "image/*,.pdf"}
            onChange={(e) => onFileUpload(e, type)}
            disabled={isUploading}
          />
        </Button>
      </div>
      {items.length === 0 && (
        <p className="text-sm text-slate-400 italic pl-1">
          No {title.toLowerCase()} uploaded.
        </p>
      )}
      {items.map((item, i) => (
        <FileRow
          key={i}
          item={item}
          type={type}
          index={i}
          onView={onView}
          onRemove={onRemove}
          deletingId={deletingId}
        />
      ))}
    </div>
  );
}
