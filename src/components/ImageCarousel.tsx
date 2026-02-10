import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface ImageCarouselProps {
  images: string[];
  descriptions?: string[];
  projectName: string;
  autoScrollInterval?: number;
}

const ImageCarousel = ({
  images,
  descriptions = [],
  projectName,
  autoScrollInterval = 5000,
}: ImageCarouselProps) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const goToNext = useCallback(() => {
    setSelectedIndex((prev) => (prev + 1) % images.length);
  }, [images.length]);

  const goToPrev = useCallback(() => {
    setSelectedIndex((prev) => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  // Auto-scroll effect
  useEffect(() => {
    if (images.length <= 1 || isPaused) return;

    const timer = setInterval(goToNext, autoScrollInterval);
    return () => clearInterval(timer);
  }, [images.length, isPaused, autoScrollInterval, goToNext]);

  if (!images || images.length === 0) {
    return (
      <div className="aspect-video rounded-3xl overflow-hidden bg-muted flex items-center justify-center">
        <span className="text-muted-foreground text-lg font-medium">No Image</span>
      </div>
    );
  }

  const currentDescription = descriptions[selectedIndex];

  return (
    <div
      className="space-y-4"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Main Image with Transition */}
      <div className="relative aspect-video rounded-3xl overflow-hidden bg-muted group">
        {images.map((image, index) => (
          <img
            key={image}
            src={image}
            alt={`${projectName} - Image ${index + 1}`}
            className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ease-in-out ${
              selectedIndex === index 
                ? "opacity-100 scale-100" 
                : "opacity-0 scale-105"
            }`}
          />
        ))}

        {/* Navigation Arrows */}
        {images.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity rounded-full"
              onClick={goToPrev}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity rounded-full"
              onClick={goToNext}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </>
        )}

        {/* Image Counter */}
        {images.length > 1 && (
          <div className="absolute bottom-4 right-4 bg-background/80 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium">
            {selectedIndex + 1} / {images.length}
          </div>
        )}

        {/* Description Overlay */}
        {currentDescription && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6 pt-12">
            <p className="text-white text-sm md:text-base">{currentDescription}</p>
          </div>
        )}
      </div>

      {/* Thumbnail Navigation */}
      {images.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => setSelectedIndex(index)}
              className={cn(
                "flex-shrink-0 w-20 h-14 rounded-xl overflow-hidden border-2 transition-all relative",
                selectedIndex === index
                  ? "border-primary ring-2 ring-primary/20"
                  : "border-transparent hover:border-muted-foreground/50"
              )}
            >
              <img
                src={image}
                alt={`${projectName} thumbnail ${index + 1}`}
                className="w-full h-full object-cover"
              />
              {/* Progress indicator for auto-scroll */}
              {selectedIndex === index && images.length > 1 && !isPaused && (
                <div className="absolute bottom-0 left-0 h-0.5 bg-primary animate-progress" />
              )}
            </button>
          ))}
        </div>
      )}

      <style>{`
        @keyframes progress {
          from { width: 0%; }
          to { width: 100%; }
        }
        .animate-progress {
          animation: progress ${autoScrollInterval}ms linear;
        }
      `}</style>
    </div>
  );
};

export default ImageCarousel;
