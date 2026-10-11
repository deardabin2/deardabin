"use client";

import { useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { saveArticle } from "@/app/(coach)/admin/content-actions";
import { FormField } from "@/components/features/auth/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { articleSchema, type ArticleFormInput, type ArticleFormOutput } from "@/lib/validations/content";
import { DeleteContentButton } from "./form-actions";
import { MarkdownField } from "./markdown-field";
import { PublishSwitch } from "./publish-switch";

export function ArticleForm({
  id,
  defaultValues,
  categories,
}: {
  id: string | null;
  defaultValues: ArticleFormInput;
  categories: string[];
}) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const {
    register,
    control,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<ArticleFormInput, unknown, ArticleFormOutput>({
    resolver: zodResolver(articleSchema),
    defaultValues,
  });

  const onSubmit = handleSubmit(() => {
    setMessage(null);
    startTransition(async () => {
      const result = await saveArticle(id, getValues());
      if (result && !result.ok) setMessage(result.message);
    });
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
      <FormField id="title" label="제목" error={errors.title?.message}>
        <Input id="title" aria-invalid={!!errors.title} {...register("title")} />
      </FormField>
      <div className="grid grid-cols-[1fr_7rem] gap-3">
        <FormField id="category" label="분류" error={errors.category?.message}>
          <Input id="category" list="article-categories" aria-invalid={!!errors.category} {...register("category")} />
        </FormField>
        <datalist id="article-categories">
          {categories.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
        <FormField id="sortOrder" label="순서" hint="작을수록 위" error={errors.sortOrder?.message}>
          <Input id="sortOrder" type="number" inputMode="numeric" min={0} {...register("sortOrder")} />
        </FormField>
      </div>
      <Controller
        control={control}
        name="body"
        render={({ field }) => (
          <MarkdownField label="본문" rows={16} value={field.value} onChange={field.onChange} error={errors.body?.message} />
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
        {id ? <DeleteContentButton table="articles" id={id} label={defaultValues.title} onError={setMessage} /> : <span />}
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? "저장하는 중…" : "저장"}
        </Button>
      </div>
    </form>
  );
}
