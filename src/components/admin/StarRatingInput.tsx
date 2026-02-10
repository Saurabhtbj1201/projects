import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingInputProps {
  value: number;
  onChange: (rating: number) => void;
  max?: number;
}

const StarRatingInput = ({ value, onChange, max = 5 }: StarRatingInputProps) => {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: max }, (_, i) => i + 1).map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star === value ? 0 : star)}
          className="focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-sm"
        >
          <Star
            className={cn(
              "h-6 w-6 cursor-pointer transition-colors",
              star <= value
                ? "fill-yellow-400 text-yellow-400"
                : "text-muted-foreground hover:text-yellow-400"
            )}
          />
        </button>
      ))}
      <span className="ml-2 text-sm text-muted-foreground">
        {value > 0 ? `${value} star${value > 1 ? "s" : ""}` : "No rating"}
      </span>
    </div>
  );
};

export default StarRatingInput;
