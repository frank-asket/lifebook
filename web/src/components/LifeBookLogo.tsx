import React from "react";
import Image from "next/image";

interface LifeBookLogoProps {
  size?: number;
  className?: string;
  showWordmark?: boolean;
  wordmarkClassName?: string;
  invert?: boolean;
  rounded?: string;
}

export function LifeBookLogo({
  size = 36,
  className = "",
  showWordmark = false,
  wordmarkClassName = "",
  invert = false,
  rounded = "rounded-xl",
}: LifeBookLogoProps) {
  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      <div
        className={`relative overflow-hidden ${rounded} bg-black flex items-center justify-center shrink-0 shadow-sm`}
        style={{ width: size, height: size }}
      >
        <Image
          src="/logol.png"
          alt="LifeBook"
          width={size}
          height={size}
          className="object-contain"
          priority
          unoptimized
        />
      </div>
      {showWordmark && (
        <span
          className={`font-serif font-bold tracking-tight ${
            invert ? "text-white" : "text-[#1E1931]"
          } ${wordmarkClassName || "text-xl"}`}
        >
          LifeBook
        </span>
      )}
    </div>
  );
}
