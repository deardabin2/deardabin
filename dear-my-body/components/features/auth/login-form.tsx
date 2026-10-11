"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { login } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";
import { FormField } from "./form-field";

export function LoginForm({ next, notice }: { next?: string; notice?: string }) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(notice ?? null);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  const onSubmit = (values: LoginInput) => {
    setMessage(null);
    startTransition(async () => {
      const result = await login(values, next);
      if (result && !result.ok) setMessage(result.message);
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
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
      <FormField id="password" label="비밀번호" error={errors.password?.message}>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          aria-invalid={!!errors.password}
          aria-describedby={errors.password ? "password-error" : undefined}
          {...register("password")}
        />
      </FormField>

      {message ? (
        <p role="status" className="rounded-lg bg-secondary px-3 py-2 text-sm">
          {message}
        </p>
      ) : null}

      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "로그인하는 중…" : "로그인"}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        아직 계정이 없으신가요?{" "}
        <Link href="/signup" className="inline-flex min-h-11 items-center font-medium text-primary underline-offset-4 hover:underline">
          회원가입
        </Link>
      </p>
    </form>
  );
}
