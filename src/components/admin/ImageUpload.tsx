import { useState, useRef, useCallback } from "react";
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Upload, X, Loader2, Crop as CropIcon, Check } from "lucide-react";

interface ImageUploadProps {
  images: string[];
  onChange: (images: string[]) => void;
  bucket: string;
  maxWidth?: number;
  maxHeight?: number;
  aspectRatio?: number;
  maxSizeKB?: number;
  single?: boolean;
  descriptions?: string[];
  onDescriptionsChange?: (descriptions: string[]) => void;
}

function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number
) {
  return centerCrop(
    makeAspectCrop(
      { unit: "%", width: 90 },
      aspect,
      mediaWidth,
      mediaHeight
    ),
    mediaWidth,
    mediaHeight
  );
}

const ImageUpload = ({
  images,
  onChange,
  bucket,
  maxWidth = 1200,
  maxHeight = 800,
  aspectRatio = 16 / 9,
  maxSizeKB = 500,
  single = false,
  descriptions = [],
  onDescriptionsChange,
}: ImageUploadProps) => {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [tempImage, setTempImage] = useState<string | null>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const imgRef = useRef<HTMLImageElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const onImageLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const { width, height, naturalWidth, naturalHeight } = e.currentTarget;
      const initialCrop = centerAspectCrop(width, height, aspectRatio);
      setCrop(initialCrop);
      
      // Set initial completed crop with pixel values
      if (initialCrop.unit === '%') {
        const pixelCrop: PixelCrop = {
          unit: 'px',
          x: (initialCrop.x * width) / 100,
          y: (initialCrop.y * height) / 100,
          width: (initialCrop.width * width) / 100,
          height: (initialCrop.height * height) / 100,
        };
        setCompletedCrop(pixelCrop);
      }
    },
    [aspectRatio]
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setTempImage(reader.result as string);
      setCropDialogOpen(true);
    };
    reader.readAsDataURL(file);

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const getCroppedImg = async (): Promise<Blob | null> => {
    if (!imgRef.current || !completedCrop) return null;

    const image = imgRef.current;
    const canvas = document.createElement("canvas");
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    const cropWidth = completedCrop.width * scaleX;
    const cropHeight = completedCrop.height * scaleY;

    // Scale down if needed
    let targetWidth = cropWidth;
    let targetHeight = cropHeight;

    if (targetWidth > maxWidth) {
      targetHeight = (maxWidth / targetWidth) * targetHeight;
      targetWidth = maxWidth;
    }
    if (targetHeight > maxHeight) {
      targetWidth = (maxHeight / targetHeight) * targetWidth;
      targetHeight = maxHeight;
    }

    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      cropWidth,
      cropHeight,
      0,
      0,
      targetWidth,
      targetHeight
    );

    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => resolve(blob),
        "image/jpeg",
        0.9
      );
    });
  };

  const handleCropAndUpload = async () => {
    setIsUploading(true);
    try {
      const blob = await getCroppedImg();
      if (!blob) {
        throw new Error("Failed to crop image");
      }

      // Check file size
      const sizeKB = blob.size / 1024;
      if (sizeKB > maxSizeKB) {
        toast({
          title: "Image too large",
          description: `Image must be under ${maxSizeKB}KB. Current size: ${Math.round(sizeKB)}KB`,
          variant: "destructive",
        });
        return;
      }

      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, blob, {
          contentType: "image/jpeg",
          upsert: false,
        });

      if (error) throw error;

      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path);
      const newImageUrl = urlData.publicUrl;

      if (single) {
        onChange([newImageUrl]);
        onDescriptionsChange?.([""]); 
      } else {
        const updatedImages = [...images, newImageUrl];
        const updatedDescriptions = [...descriptions, ""];
        onChange(updatedImages);
        onDescriptionsChange?.(updatedDescriptions);
      }

      toast({ title: "Image uploaded successfully" });
      setCropDialogOpen(false);
      setTempImage(null);
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload image",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = (index: number) => {
    onChange(images.filter((_, i) => i !== index));
    if (onDescriptionsChange) {
      onDescriptionsChange(descriptions.filter((_, i) => i !== index));
    }
  };

  const updateDescription = (index: number, value: string) => {
    if (!onDescriptionsChange) return;
    const newDescriptions = [...descriptions];
    newDescriptions[index] = value;
    onDescriptionsChange(newDescriptions);
  };

  return (
    <div className="space-y-3">
      <div className="space-y-4">
        {images.map((url, index) => (
          <div key={url} className="flex items-start gap-3 p-3 border rounded-lg bg-muted/30">
            <div className="relative group flex-shrink-0">
              <img
                src={url}
                alt={`Upload ${index + 1}`}
                className="w-24 h-16 object-cover rounded-lg border"
              />
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
            {onDescriptionsChange && (
              <div className="flex-1">
                <Input
                  placeholder="Image description (optional)"
                  value={descriptions[index] || ""}
                  onChange={(e) => updateDescription(index, e.target.value)}
                  className="text-sm"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  This caption will appear below the image in the carousel
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
      
      {(!single || images.length === 0) && (
        <label className="w-full h-16 border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer hover:border-primary transition-colors gap-2">
          <Upload className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Click to upload image</span>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </label>
      )}
      
      <p className="text-xs text-muted-foreground">
        Recommended: {maxWidth}x{maxHeight}px, max {maxSizeKB}KB
      </p>

      <Dialog open={cropDialogOpen} onOpenChange={setCropDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CropIcon className="h-5 w-5" />
              Crop Image
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {tempImage && (
              <div className="max-h-[60vh] overflow-auto">
                <ReactCrop
                  crop={crop}
                  onChange={(c) => setCrop(c)}
                  onComplete={(c) => setCompletedCrop(c)}
                  aspect={aspectRatio}
                >
                  <img
                    ref={imgRef}
                    src={tempImage}
                    alt="Crop preview"
                    onLoad={onImageLoad}
                    className="max-w-full"
                  />
                </ReactCrop>
              </div>
            )}
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setCropDialogOpen(false);
                  setTempImage(null);
                }}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleCropAndUpload}
                disabled={isUploading || !completedCrop}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Crop & Upload
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ImageUpload;
