"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { MailCheck } from "lucide-react";
import { signup } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { signupSchema, type SignupInput } from "@/lib/validations/auth";
import { FormField } from "./form-field";

export function SignupForm() {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupInput>({ resolver: zodResolver(signupSchema) });

  const onSubmit = (values: SignupInput) => {
    setMessage(null);
    startTransition(async () => {
      const result = await signup(values);
      if (!result) return;
      if (!result.ok) setMessage(result.message);
      else if (result.data.needsEmailConfirm) setSentTo(values.email);
    });
  };

  if (sentTo) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <MailCheck className="size-10 text-primary" aria-hidden />
        <p className="text-base font-medium">메일함을 확인해 주세요</p>
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{sentTo}</span> 으로 가입 확인 링크를
          보냈어요. 링크를 누르면 바로 시작할 수 있어요.
        </p>
        <Button asChild variant="outline" className="w-full">
          <Link href="/login">로그인 화면으로</Link>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
      <FormField id="displayName" label="이름(닉네임)" error={errors.displayName?.message}>
        <Input
          id="displayName"
          autoComplete="nickname"
          aria-invalid={!!errors.displayName}
          aria-describedby={errors.displayName ? "displayName-error" : undefined}
          {...register("displayName")}
        />
      </FormField>
      <FormField id="email" label="이메일" error={errors.email?.message}>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? "email-error" : undefined}
          {...register("email")}
        />
      </FormField>
      <FormField
        id="password"
        label="비밀번호"
        hint="8자 이상으로 정해 주세요."
        error={errors.password?.message}
      >
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          aria-invalid={!!errors.password}
          aria-describedby={errors.password ? "password-error" : undefined}
          {...register("password")}
        />
      </FormField>
      <FormField id="passwordConfirm" label="비밀번호 확인" error={errors.passwordConfirm?.message}>
        <Input
          id="passwordConfirm"
          type="password"
          autoComplete="new-password"
          aria-invalid={!!errors.passwordConfirm}
          aria-describedby={errors.passwordConfirm ? "passwordConfirm-error" : undefined}
          {...register("passwordConfirm")}
        />
      </FormField>

      {message ? (
        <p role="status" className="rounded-lg bg-secondary px-3 py-2 text-sm">
          {message}
        </p>
      ) : null}

      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "가입하는 중…" : "가입하기"}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        이미 계정이 있으신가요?{" "}
        <Link href="/login" className="inline-flex min-h-11 items-center font-medium text-primary underline-offset-4 hover:underline">
          로그인
        </Link>
      </p>
    </form>
  );
}
