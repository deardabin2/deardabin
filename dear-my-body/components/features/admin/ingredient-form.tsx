"use client";

import { useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { saveIngredient } from "@/app/(coach)/admin/content-actions";
import { FormField } from "@/components/features/auth/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ingredientSchema, type IngredientFormInput, type IngredientFormOutput } from "@/lib/validations/content";
import { DeleteContentButton } from "./form-actions";
import { ImageField } from "./image-field";
import { MarkdownField } from "./markdown-field";
import { PublishSwitch } from "./publish-switch";

export function IngredientForm({ id, defaultValues }: { id: string | null; defaultValues: IngredientFormInput }) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const {
    register,
    control,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<IngredientFormInput, unknown, IngredientFormOutput>({
    resolver: zodResolver(ingredientSchema),
    defaultValues,
  });

  // 검증을 통과하면, 서버에서 같은 스키마로 다시 검증할 수 있게 원래 입력값을 넘긴다
  const onSubmit = handleSubmit(() => {
    setMessage(null);
    startTransition(async () => {
      const result = await saveIngredient(id, getValues());
      if (result && !result.ok) setMessage(result.message);
    });
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
      <div className="grid grid-cols-2 gap-3">
        <FormField id="name" label="이름" error={errors.name?.message}>
          <Input id="name" aria-invalid={!!errors.name} {...register("name")} />
        </FormField>
        <FormField id="category" label="분류" error={errors.category?.message}>
          <Input id="category" placeholder="예: 채소" aria-invalid={!!errors.category} {...register("category")} />
        </FormField>
      </div>
      <FormField id="tags" label="태그" hint="쉼표로 구분해요. 예: 아침, 식물성 단백질" error={errors.tags?.message}>
        <Input id="tags" {...register("tags")} />
      </FormField>
      <FormField id="summary" label="한 줄 소개" error={errors.summary?.message}>
        <Input id="summary" maxLength={200} {...register("summary")} />
      </FormField>

      <Controller
        control={control}
        name="imagePath"
        render={({ field }) => <ImageField folder="ingredients" value={field.value} onChange={field.onChange} />}
      />
      <Controller
        control={control}
        name="benefits"
        render={({ field }) => (
          <MarkdownField label="이런 점이 좋아요" value={field.value} onChange={field.onChange} error={errors.benefits?.message} />
        )}
      />
      <Controller
        control={control}
        name="howToUse"
        render={({ field }) => (
          <MarkdownField label="이렇게 먹어요" value={field.value} onChange={field.onChange} error={errors.howToUse?.message} />
        )}
      />
      <Controller
        control={control}
        name="caution"
        render={({ field }) => (
          <MarkdownField label="알아 두세요" value={field.value} onChange={field.onChange} error={errors.caution?.message} />
        )}
      />
      <Controller
        control={control}
        name="isPublished"
        render={({ field }) => <PublishSwitch checked={field.value} onChange={field.onChange} />}
      />

      {message ? (
        <p role="status" className="rounded-lg bg-secondary px-3 py-2 text-sm">
          {message}
        </p>
      ) : null}
      <div className="flex items-center justify-between gap-3">
        {id ? (
          <DeleteContentButton table="ingredients" id={id} label={defaultValues.name} onError={setMessage} />
        ) : (
          <span />
        )}
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? "저장하는 중…" : "저장"}
        </Button>
      </div>
    </form>
  );
}
