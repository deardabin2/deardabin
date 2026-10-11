import { z } from "zod";

export const loginSchema = z.object({
  email: z.email("이메일 형식을 확인해 주세요."),
  password: z.string().min(1, "비밀번호를 입력해 주세요."),
});

export const signupSchema = z
  .object({
    displayName: z
      .string()
      .trim()
      .min(1, "어떻게 불러드리면 될까요?")
      .max(30, "이름은 30자까지 쓸 수 있어요."),
    email: z.email("이메일 형식을 확인해 주세요."),
    password: z.string().min(8, "비밀번호는 8자 이상으로 정해 주세요."),
    passwordConfirm: z.string(),
  })
  .refine((v) => v.password === v.passwordConfirm, {
    message: "비밀번호가 서로 달라요. 한 번 더 확인해 주세요.",
    path: ["passwordConfirm"],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
