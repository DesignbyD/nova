"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils/cn";
import type { ProductImage } from "@/types/catalog";

/** Main image with thumbnails. Thumbnails are real buttons, so it works with keyboard and screen readers. */
export function ProductGallery({ images, name }: { images: ProductImage[]; name: string }) {
  const [index, setIndex] = useState(0);
  const current = images[index] ?? images[0];
  if (!current) return <div className="aspect-[4/5] rounded-panel bg-paper-deep" role="img" aria-label={`${name}, no image available`} />;

  return (
    <div className="flex flex-col gap-3 lg:sticky lg:top-24">
      <div className="relative aspect-[4/5] overflow-hidden rounded-panel bg-paper-deep">
        <Image
          key={current.src}
          src={current.src}
          alt={current.alt}
          fill
          priority={index === 0}
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="nova-fade-in object-cover"
        />
      </div>
      {images.length > 1 ? (
        <ul className="grid grid-cols-4 gap-3" aria-label={`${name} images`}>
          {images.map((image, i) => (
            <li key={image.src}>
              <button
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Show image ${i + 1} of ${images.length}`}
                aria-pressed={i === index}
                className={cn(
                  "relative block aspect-[4/5] w-full overflow-hidden rounded-control bg-paper-deep outline-offset-2 transition-opacity",
                  i === index ? "ring-2 ring-ink" : "opacity-70 hover:opacity-100",
                )}
              >
                <Image src={image.src} alt="" fill sizes="120px" className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
