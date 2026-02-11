import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface QRCodeProps {
    value: string;
    size?: "sm" | "md" | "lg";
    className?: string;
}

const sizeMap = {
    sm: 120,
    md: 180,
    lg: 240,
};

const QRCode = ({ value, size = "md", className }: QRCodeProps) => {
    const px = sizeMap[size];
    // Use a public QR code generation API
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${px}x${px}&data=${encodeURIComponent(value)}&format=svg&margin=8`;

    return (
        <div className={cn("flex items-center justify-center", className)}>
            <img
                src={qrUrl}
                alt={`QR Code for ${value}`}
                width={px}
                height={px}
                className="rounded-lg bg-white p-1"
                loading="lazy"
            />
        </div>
    );
};

export { QRCode };
export default QRCode;
