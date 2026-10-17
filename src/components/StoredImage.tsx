"use client";

import { useEffect, useState } from "react";
import { getScreenshotUrl } from "@/lib/supabase/screenshots";

type StoredImageProps = {
  path: string;
  alt: string;
  className?: string;
};

export default function StoredImage({ path, alt, className = "" }: StoredImageProps) {
  const [url, setUrl] = useState<string | null>(path.startsWith("data:") ? path : null);

  useEffect(() => {
    let cancelled = false;
    getScreenshotUrl(path).then((result) => {
      if (!cancelled) setUrl(result);
    });
    return () => {
      cancelled = true;
    };
  }, [path]);

  if (!url) return <div className={`bg-black/5 animate-pulse ${className}`} />;
  return <img src={url} alt={alt} className={className} />;
}
