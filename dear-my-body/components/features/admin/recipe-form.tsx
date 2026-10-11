"use client";

import { useState, useTransition } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { saveRecipe } from "@/app/(coach)/admin/content-actions";
import { FormField } from "@/components/features/auth/form-field";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { recipeSchema, type RecipeFormInput, type RecipeFormOutput } from "@/lib/validations/content";
import { DeleteContentButton } from "./form-actions";
import { ImageField } from "./image-field";
import { MarkdownField } from "./markdown-field";
import { PublishSwitch } from "./publish-switch";

export function RecipeForm({
  id,
  defaultValues,
  ingredientOptions,
}: {
  id: string | null;
  defaultValues: RecipeFormInput;
  ingredientOptions: { id: string; name: string; isPublished: boolean }[];
}) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const {
    register,
    control,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<RecipeFormInput, unknown, RecipeFormOutput>({
    resolver: zodResolver(recipeSchema),
    defaultValues,
  });
  const ingredients = useFieldArray({ control, name: "ingredients" });
  const steps = useFieldArray({ control, name: "steps" });

  const onSubmit = handleSubmit(() => {
    setMessage(null);
    startTransition(async () => {
      const result = await saveRecipe(id, getValues());
      if (result && !result.ok) setMessage(result.message);
    });
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
      <FormField id="title" label="제목" error={errors.title?.message}>
        <Input id="title" aria-invalid={!!errors.title} {...register("title")} />
      </FormField>
      <FormField id="summary" label="한 줄 소개" error={errors.summary?.message}>
        <Input id="summary" maxLength={200} {...register("summary")} />
      </FormField>
      <div className="grid grid-cols-2 gap-3">
        <FormField id="servings" label="기준 인분" error={errors.servings?.message}>
          <Input id="servings" type="number" inputMode="numeric" min={1} {...register("servings")} />
        </FormField>
        <FormField id="cookMinutes" label="조리 시간(분)" error={errors.cookMinutes?.message}>
          <Input id="cookMinutes" type="number" inputMode="numeric" min={0} {...register("cookMinutes")} />
        </FormField>
      </div>
      <FormField id="tags" label="태그" hint="쉼표로 구분해요. 예: 아침, 간단" error={errors.tags?.message}>
        <Input id="tags" {...register("tags")} />
      </FormField>

      <Controller
        control={control}
        name="imagePath"
        render={({ field }) => <ImageField folder="recipes" value={field.value} onChange={field.onChange} />}
      />

      <fieldset className="flex flex-col gap-3 rounded-xl border p-3">
        <legend className="px-1 text-sm font-medium">재료 (기준 인분 양)</legend>
        <p className="text-xs text-muted-foreground">양을 비워 두면 &apos;약간&apos;처럼 단위만 보여요. 인분을 바꾸면 양이 비례로 계산돼요.</p>
        {ingredients.fields.map((field, index) => {
          const e = errors.ingredients?.[index];
          return (
            <div key={field.id} className="grid grid-cols-[1fr_4.5rem_4rem_2.75rem] items-start gap-2">
              <div>
                <label htmlFor={`ing-${index}-name`} className="sr-only">
                  재료 {index + 1} 이름
                </label>
                <Input id={`ing-${index}-name`} placeholder="재료" aria-invalid={!!e?.name} {...register(`ingredients.${index}.name`)} />
                {e?.name ? <p className="mt-1 text-xs text-destructive">{e.name.message}</p> : null}
              </div>
              <div>
                <label htmlFor={`ing-${index}-amount`} className="sr-only">
                  재료 {index + 1} 양
                </label>
                <Input
                  id={`ing-${index}-amount`}
                  type="number"
                  inputMode="decimal"
                  placeholder="양"
                  aria-invalid={!!e?.amount}
                  {...register(`ingredients.${index}.amount`)}
                />
              </div>
              <div>
                <label htmlFor={`ing-${index}-unit`} className="sr-only">
                  재료 {index + 1} 단위
                </label>
                <Input id={`ing-${index}-unit`} placeholder="단위" {...register(`ingredients.${index}.unit`)} />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => ingredients.remove(index)}
                aria-label={`재료 ${index + 1} 빼기`}
              >
                <Trash2 aria-hidden />
              </Button>
            </div>
          );
        })}
        <Button type="button" variant="outline" onClick={() => ingredients.append({ name: "", amount: "", unit: "" })}>
          <Plus aria-hidden />
          재료 추가
        </Button>
      </fieldset>

      <fieldset className="flex flex-col gap-3 rounded-xl border p-3">
        <legend className="px-1 text-sm font-medium">만드는 법</legend>
        {steps.fields.map((field, index) => (
          <div key={field.id} className="flex items-start gap-2">
            <span aria-hidden className="mt-2.5 w-5 text-center text-sm font-semibold text-muted-foreground">
              {index + 1}
            </span>
            <div className="flex-1">
              <label htmlFor={`step-${index}`} className="sr-only">
                {index + 1}단계
              </label>
              <Textarea id={`step-${index}`} rows={2} aria-invalid={!!errors.steps?.[index]?.text} {...register(`steps.${index}.text`)} />
              {errors.steps?.[index]?.text ? (
                <p className="mt-1 text-xs text-destructive">{errors.steps[index]?.text?.message}</p>
              ) : null}
            </div>
            <div className="flex flex-col">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={index === 0}
                onClick={() => steps.move(index, index - 1)}
                aria-label={`${index + 1}단계 위로`}
              >
                <ArrowUp aria-hidden />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={index === steps.fields.length - 1}
                onClick={() => steps.move(index, index + 1)}
                aria-label={`${index + 1}단계 아래로`}
              >
                <ArrowDown aria-hidden />
              </Button>
              <Button type="button" variant="ghost" size="icon" onClick={() => steps.remove(index)} aria-label={`${index + 1}단계 빼기`}>
                <Trash2 aria-hidden />
              </Button>
            </div>
          </div>
        ))}
        <Button type="button" variant="outline" onClick={() => steps.append({ text: "" })}>
          <Plus aria-hidden />
          단계 추가
        </Button>
      </fieldset>

      <Controller
        control={control}
        name="nutritionNote"
        render={({ field }) => (
          <MarkdownField label="영양 포인트" value={field.value} onChange={field.onChange} error={errors.nutritionNote?.message} />
        )}
      />

      <fieldset className="flex flex-col gap-2 rounded-xl border p-3">
        <legend className="px-1 text-sm font-medium">연결할 식재료</legend>
        <p className="text-xs text-muted-foreground">고르면 식재료 상세 화면에 이 레시피가 함께 보여요.</p>
        {ingredientOptions.length === 0 ? (
          <p className="text-sm text-muted-foreground">먼저 식재료를 만들어 주세요.</p>
        ) : (
          <Controller
            control={control}
            name="ingredientIds"
            render={({ field }) => (
              <ul className="grid grid-cols-2 gap-1">
                {ingredientOptions.map((o) => {
                  const checked = field.value.includes(o.id);
                  return (
                    <li key={o.id} className="flex min-h-11 items-center gap-2">
                      <Checkbox
                        id={`link-${o.id}`}
                        checked={checked}
                        onCheckedChange={(v) =>
                          field.onChange(v === true ? [...field.value, o.id] : field.value.filter((x) => x !== o.id))
                        }
                      />
                      <Label htmlFor={`link-${o.id}`} className="font-normal">
                        {o.name}
                        {!o.isPublished ? <span className="text-xs text-muted-foreground">(비공개)</span> : null}
                      </Label>
                    </li>
                  );
                })}
              </ul>
            )}
          />
        )}
      </fieldset>

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
        {id ? <DeleteContentButton table="recipes" id={id} label={defaultValues.title} onError={setMessage} /> : <span />}
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? "저장하는 중…" : "저장"}
        </Button>
      </div>
    </form>
  );
}
