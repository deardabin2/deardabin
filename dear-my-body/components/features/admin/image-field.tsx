"use client";

import { useRef, useState } from "react";
import imageCompression from "browser-image-compression";
import { ImagePlus, LoaderCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CONTENT_IMAGE_BUCKET, contentImageUrl } from "@/lib/content-image";
import { createClient } from "@/lib/supabase/client";

/** 콘텐츠 대표 이미지. 고른 즉시 줄여서 올리고, 저장할 때 경로가 함께 저장된다 */
export function ImageField({
  folder,
  value,
  onChange,
}: {
  folder: "ingredients" | "recipes";
  value: string | null;
  onChange: (path: string | null) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const src = contentImageUrl(value);

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setMessage(null);
    setUploading(true);
    try {
      const resized = await imageCompression(file, {
        maxWidthOrHeight: 1600,
        maxSizeMB: 0.8,
        initialQuality: 0.85,
        fileType: "image/jpeg",
        useWebWorker: true,
      });
      const path = `${folder}/${crypto.randomUUID()}.jpg`;
      const { error } = await createClient()
        .storage.from(CONTENT_IMAGE_BUCKET)
        .upload(path, resized, { contentType: "image/jpeg", upsert: false });
      if (error) throw error;
      onChange(path);
    } catch {
      setMessage("이미지를 올리지 못했어요. 다른 파일로 다시 시도해 주세요.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium">대표 이미지</span>
      {src ? (
        <div className="relative overflow-hidden rounded-lg border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt="대표 이미지 미리보기" className="aspect-[16/10] w-full object-cover" />
          <Button
            type="button"
            variant="secondary"
            size="icon"
            className="absolute top-2 right-2 rounded-full bg-card/90"
            onClick={() => onChange(null)}
            aria-label="대표 이미지 빼기"
          >
            <X aria-hidden />
          </Button>
        </div>
      ) : null}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(e) => onFile(e.target.files?.[0])}
      />
      <Button type="button" variant="outline" onClick={() => fileRef.current?.click()} disabled={uploading}>
        {uploading ? <LoaderCircle className="animate-spin" aria-hidden /> : <ImagePlus aria-hidden />}
        {uploading ? "올리는 중…" : src ? "이미지 바꾸기" : "이미지 올리기"}
      </Button>
      {message ? (
        <p role="status" className="text-sm text-destructive">
          {message}
        </p>
      ) : null}
    </div>
  );
}
