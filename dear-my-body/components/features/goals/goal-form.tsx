"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import { finishGoal, saveGoal } from "@/app/(client)/goals/actions";
import { FormField } from "@/components/features/auth/form-field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  goalSchema,
  MAX_BEHAVIOR_GOALS,
  type GoalFormInput,
  type GoalFormOutput,
} from "@/lib/validations/goal";

type GoalFormProps = {
  /** 서버 데이터가 바뀌면(저장 직후 등) 폼을 새 값으로 다시 그리기 위한 키 */
  version: string;
  defaultValues: GoalFormInput;
  hasActiveGoal: boolean;
};

export function GoalForm({ version, ...props }: GoalFormProps) {
  // 메시지는 폼이 다시 그려져도 남아 있도록 바깥에 둔다
  const [message, setMessage] = useState<string | null>(null);
  return <GoalFormInner key={version} {...props} message={message} setMessage={setMessage} />;
}

function GoalFormInner({
  defaultValues,
  hasActiveGoal,
  message,
  setMessage,
}: Omit<GoalFormProps, "version"> & {
  message: string | null;
  setMessage: (message: string | null) => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors, isDirty },
  } = useForm<GoalFormInput, unknown, GoalFormOutput>({
    resolver: zodResolver(goalSchema),
    defaultValues,
  });
  const { fields, append, remove } = useFieldArray({ control, name: "behaviorGoals" });
  const kinds = useWatch({ control, name: "behaviorGoals" });

  const onSubmit = (values: GoalFormOutput) => {
    setMessage(null);
    startTransition(async () => {
      const result = await saveGoal(values);
      if (!result.ok) {
        setMessage(result.message);
        return;
      }
      setMessage("목표를 저장했어요. 오늘 기록하러 가 볼까요?");
      router.refresh();
    });
  };

  const onFinish = () => {
    if (!window.confirm("지금 목표를 마무리할까요? 지난 기록은 그대로 남아요.")) return;
    startTransition(async () => {
      const result = await finishGoal();
      if (!result.ok) setMessage(result.message);
      else router.refresh();
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
      <Card>
        <CardHeader>
          <CardTitle>기간</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3">
          <FormField id="startDate" label="시작하는 날" error={errors.startDate?.message}>
            <Input id="startDate" type="date" aria-invalid={!!errors.startDate} {...register("startDate")} />
          </FormField>
          <FormField id="endDate" label="마치는 날" error={errors.endDate?.message}>
            <Input id="endDate" type="date" aria-invalid={!!errors.endDate} {...register("endDate")} />
          </FormField>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>체중 <span className="text-sm font-normal text-muted-foreground">(선택)</span></CardTitle>
          <CardDescription>숫자보다 습관이 먼저예요. 비워 둬도 괜찮아요.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3">
          <FormField id="startWeight" label="시작 체중 (kg)" error={errors.startWeight?.message}>
            <Input
              id="startWeight"
              type="number"
              inputMode="decimal"
              step="0.1"
              aria-invalid={!!errors.startWeight}
              {...register("startWeight")}
            />
          </FormField>
          <FormField id="targetWeight" label="목표 체중 (kg)" error={errors.targetWeight?.message}>
            <Input
              id="targetWeight"
              type="number"
              inputMode="decimal"
              step="0.1"
              aria-invalid={!!errors.targetWeight}
              {...register("targetWeight")}
            />
          </FormField>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <FormField id="motivation" label="나의 동기 한 줄" error={errors.motivation?.message}>
            <Input
              id="motivation"
              maxLength={100}
              placeholder="예: 계단을 가볍게 오르고 싶어요"
              aria-invalid={!!errors.motivation}
              {...register("motivation")}
            />
          </FormField>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            매일 지킬 행동 목표{" "}
            <span className="text-sm font-normal text-muted-foreground">
              {fields.length}/{MAX_BEHAVIOR_GOALS}
            </span>
          </CardTitle>
          <CardDescription>작고 구체적일수록 지키기 쉬워요.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {fields.length === 0 ? (
            <p className="rounded-lg bg-muted px-3 py-4 text-center text-sm text-muted-foreground">
              아직 행동 목표가 없어요. 하나만 정해 봐도 좋아요.
            </p>
          ) : null}

          {fields.map((field, index) => {
            const kind = kinds?.[index]?.kind ?? "check";
            const fieldErrors = errors.behaviorGoals?.[index];
            return (
              <fieldset key={field.id} className="flex flex-col gap-3 rounded-xl border p-3">
                <legend className="sr-only">행동 목표 {index + 1}</legend>
                <div className="flex items-start gap-2">
                  <div className="flex-1">
                    <FormField
                      id={`bg-${index}-title`}
                      label={`행동 목표 ${index + 1}`}
                      error={fieldErrors?.title?.message}
                    >
                      <Input
                        id={`bg-${index}-title`}
                        maxLength={40}
                        placeholder={kind === "check" ? "예: 아침 챙겨 먹기" : "예: 물 마시기"}
                        aria-invalid={!!fieldErrors?.title}
                        {...register(`behaviorGoals.${index}.title`)}
                      />
                    </FormField>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="mt-6"
                    onClick={() => remove(index)}
                    aria-label={`행동 목표 ${index + 1} 빼기`}
                  >
                    <Trash2 aria-hidden />
                  </Button>
                </div>

                <div role="radiogroup" aria-label="기록 방식" className="grid grid-cols-2 gap-2">
                  {(
                    [
                      ["check", "했어요 체크"],
                      ["number", "숫자로 기록"],
                    ] as const
                  ).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      role="radio"
                      aria-checked={kind === value}
                      onClick={() =>
                        setValue(`behaviorGoals.${index}.kind`, value, { shouldDirty: true })
                      }
                      className={cn(
                        "min-h-11 rounded-lg border text-sm transition-colors",
                        kind === value
                          ? "border-primary bg-accent font-medium text-accent-foreground"
                          : "bg-card text-muted-foreground",
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {kind === "number" ? (
                  <div className="grid grid-cols-2 gap-3">
                    <FormField
                      id={`bg-${index}-target`}
                      label="하루 목표치"
                      error={fieldErrors?.targetValue?.message}
                    >
                      <Input
                        id={`bg-${index}-target`}
                        type="number"
                        inputMode="decimal"
                        aria-invalid={!!fieldErrors?.targetValue}
                        {...register(`behaviorGoals.${index}.targetValue`)}
                      />
                    </FormField>
                    <FormField id={`bg-${index}-unit`} label="단위" error={fieldErrors?.unit?.message}>
                      <Input
                        id={`bg-${index}-unit`}
                        maxLength={10}
                        placeholder="예: 잔, 분"
                        {...register(`behaviorGoals.${index}.unit`)}
                      />
                    </FormField>
                  </div>
                ) : null}
              </fieldset>
            );
          })}

          {errors.behaviorGoals?.root?.message || errors.behaviorGoals?.message ? (
            <p role="alert" className="text-sm text-destructive">
              {errors.behaviorGoals?.root?.message ?? errors.behaviorGoals?.message}
            </p>
          ) : null}

          <Button
            type="button"
            variant="outline"
            disabled={fields.length >= MAX_BEHAVIOR_GOALS}
            onClick={() => append({ title: "", kind: "check", targetValue: "", unit: "" })}
          >
            <Plus aria-hidden />
            {fields.length >= MAX_BEHAVIOR_GOALS ? "5개까지 정할 수 있어요" : "행동 목표 추가"}
          </Button>
        </CardContent>
      </Card>

      {message ? (
        <p role="status" className="rounded-lg bg-secondary px-3 py-2 text-sm">
          {message}
        </p>
      ) : null}

      <Button type="submit" size="lg" disabled={pending || (hasActiveGoal && !isDirty)}>
        {pending ? "저장하는 중…" : hasActiveGoal ? "변경 내용 저장" : "목표 저장하기"}
      </Button>

      {hasActiveGoal ? (
        <Button type="button" variant="ghost" onClick={onFinish} disabled={pending}>
          이 목표 마무리하고 새로 시작하기
        </Button>
      ) : null}
    </form>
  );
}
