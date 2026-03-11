import { FileText, Video, ImageIcon, Eye, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { MediaItem } from "@/types/worksheet";
import { Field, FieldLabel } from "../ui/field";

interface FileRowProps {
  item: MediaItem;
  type: "videos" | "graphics" | "latest_worksheets";
  onView: (
    item: MediaItem,
    type: "videos" | "graphics" | "latest_worksheets",
  ) => void;
  onRemove: (
    type: "videos" | "graphics" | "latest_worksheets",
    index: number,
    mediaId?: string | number,
  ) => void;
  index: number;
  deletingId: string | null;
}

export function FileRow({
  item,
  type,
  onView,
  onRemove,
  index,
  deletingId,
}: FileRowProps) {
  const isDeletingThis = deletingId === `${type}-${item.id}`;

  const getIcon = () => {
    switch (type) {
      case "videos":
        return <Video className="h-4 w-4 text-blue-600" />;
      case "graphics":
        return <ImageIcon className="h-4 w-4 text-green-600" />;
      default:
        return <FileText className="h-4 w-4 text-orange-600" />;
    }
  };

  return (
    <div className="flex items-start gap-3 bg-slate-50 p-2 rounded border mb-2 group hover:bg-slate-100 transition-colors">
      <div
        className="p-2 bg-white rounded border flex items-center justify-center cursor-pointer"
        onClick={() => onView(item, type)}
      >
        {getIcon()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center">
          <span
            className="truncate text-sm font-medium cursor-pointer hover:underline hover:text-blue-600"
            onClick={() => onView(item, type)}
          >
            {item.name}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-slate-400 hover:text-blue-600 hover:bg-blue-50"
              onClick={() => onView(item, type)}
              disabled={isDeletingThis}
            >
              <Eye className="h-3 w-3" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-red-500 hover:bg-red-50"
              disabled={isDeletingThis}
              onClick={() => onRemove(type, index, item.id)}
            >
              {isDeletingThis ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <X className="h-3 w-3" />
              )}
            </Button>
          </div>
        </div>
        {item.percentage !== "completed" && item.percentage !== 100 && (
          <Field className="w-full max-w-sm mt-1">
            <FieldLabel htmlFor="progress-upload">
              <span>Uploading</span>
              <span className="ml-auto">{item.percentage}%</span>
            </FieldLabel>
            <Progress value={Number(item.percentage)} className="h-1" />
          </Field>
        )}
      </div>
    </div>
  );
}
