"use client";

import { useId, useRef, useState } from "react";
import imageCompression from "browser-image-compression";
import { Camera, ImagePlus, LoaderCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import type { MealType } from "@/lib/validations/daily-log";
import { MEAL_LABELS, type MealState } from "./types";

const MEAL_PHOTO_BUCKET = "meal-photos";

export function MealCard({
  mealType,
  meal,
  userId,
  logDate,
  onChange,
  onPhotoChange,
}: {
  mealType: MealType;
  meal: MealState;
  userId: string;
  logDate: string;
  /** 글·시간 변경 (디바운스 저장) */
  onChange: (patch: Partial<MealState>) => void;
  /** 사진 변경 (바로 저장) */
  onPhotoChange: (patch: Pick<MealState, "photoPath" | "photoUrl">) => void;
}) {
  const label = MEAL_LABELS[mealType];
  const fileRef = useRef<HTMLInputElement>(null);
  const descriptionId = useId();
  const timeId = useId();
  const [uploading, setUploading] = useState(false);
  const [photoMessage, setPhotoMessage] = useState<string | null>(null);

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setPhotoMessage(null);
    setUploading(true);
    try {
      // 업로드 전에 줄여서 데이터와 저장 공간을 아낀다
      const resized = await imageCompression(file, {
        maxWidthOrHeight: 1280,
        maxSizeMB: 0.5,
        initialQuality: 0.8,
        fileType: "image/jpeg",
        useWebWorker: true,
      });
      const path = `${userId}/${logDate}/${mealType}-${crypto.randomUUID()}.jpg`;
      const { error } = await createClient()
        .storage.from(MEAL_PHOTO_BUCKET)
        .upload(path, resized, { contentType: "image/jpeg", upsert: false });
      if (error) throw error;
      onPhotoChange({ photoPath: path, photoUrl: URL.createObjectURL(resized) });
    } catch {
      setPhotoMessage("사진을 올리지 못했어요. 다른 사진으로 다시 시도해 주세요.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <Card className="gap-3 py-4">
      <CardHeader className="flex-row items-center justify-between px-4">
        <CardTitle>{label}</CardTitle>
        <div className="flex items-center gap-2">
          <label htmlFor={timeId} className="text-xs text-muted-foreground">
            먹은 시간
          </label>
          <Input
            id={timeId}
            type="time"
            value={meal.eatenAt ?? ""}
            onChange={(e) => onChange({ eatenAt: e.target.value || null })}
            className="h-11 w-28 px-2 text-sm"
          />
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 px-4">
        <label htmlFor={descriptionId} className="sr-only">
          {label}에 먹은 것
        </label>
        <Textarea
          id={descriptionId}
          value={meal.description}
          maxLength={500}
          placeholder={`${label}에 무엇을 드셨나요?`}
          onChange={(e) => onChange({ description: e.target.value })}
          className="min-h-16"
        />

        {meal.photoUrl ? (
          <div className="relative overflow-hidden rounded-lg border">
            {/* 비공개 버킷의 서명된 URL 이라 next/image 최적화 대상이 아니다 */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={meal.photoUrl}
              alt={`${label} 사진`}
              className="aspect-[4/3] w-full object-cover"
            />
            <Button
              type="button"
              variant="secondary"
              size="icon"
              className="absolute top-2 right-2 rounded-full bg-card/90"
              onClick={() => onPhotoChange({ photoPath: null, photoUrl: null })}
              aria-label={`${label} 사진 지우기`}
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
        <Button
          type="button"
          variant="outline"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? (
            <LoaderCircle className="animate-spin" aria-hidden />
          ) : meal.photoUrl ? (
            <ImagePlus aria-hidden />
          ) : (
            <Camera aria-hidden />
          )}
          {uploading ? "사진 올리는 중…" : meal.photoUrl ? "사진 바꾸기" : "사진 추가"}
        </Button>
        {photoMessage ? (
          <p role="status" className="text-sm text-destructive">
            {photoMessage}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
