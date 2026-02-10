import { CheckCircle, XCircle, Info, AlertTriangle, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface CustomToastProps {
  title: string;
  description?: string;
  variant?: "success" | "error" | "info" | "warning";
  onAction?: () => void;
  actionLabel?: string;
}

const CustomToast = ({ 
  title, 
  description, 
  variant = "success",
  onAction,
  actionLabel = "Success"
}: CustomToastProps) => {
  const variants = {
    success: {
      borderColor: "border-green-500",
      bgColor: "bg-green-50 dark:bg-green-950/30",
      iconColor: "text-green-600 dark:text-green-400",
      textColor: "text-green-800 dark:text-green-200",
      Icon: CheckCircle,
    },
    error: {
      borderColor: "border-red-500",
      bgColor: "bg-red-50 dark:bg-red-950/30",
      iconColor: "text-red-600 dark:text-red-400",
      textColor: "text-red-800 dark:text-red-200",
      Icon: XCircle,
    },
    info: {
      borderColor: "border-blue-500",
      bgColor: "bg-blue-50 dark:bg-blue-950/30",
      iconColor: "text-blue-600 dark:text-blue-400",
      textColor: "text-blue-800 dark:text-blue-200",
      Icon: Info,
    },
    warning: {
      borderColor: "border-yellow-500",
      bgColor: "bg-yellow-50 dark:bg-yellow-950/30",
      iconColor: "text-yellow-600 dark:text-yellow-400",
      textColor: "text-yellow-800 dark:text-yellow-200",
      Icon: AlertTriangle,
    },
  };

  const { borderColor, bgColor, iconColor, textColor, Icon } = variants[variant];

  return (
    <div
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-full border-2",
        borderColor,
        bgColor
      )}
    >
      <span className={cn("text-sm font-medium", textColor)}>
        {description || title}
      </span>
      <button
        onClick={onAction}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-colors",
          "bg-white/80 dark:bg-white/10 hover:bg-white dark:hover:bg-white/20",
          iconColor
        )}
      >
        {actionLabel}
        <ArrowRight className="h-3 w-3" />
      </button>
    </div>
  );
};

export default CustomToast;
