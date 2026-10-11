import { z } from "zod";

/** 동의 문구를 바꾸면 버전을 올린다. 기존 사용자는 다시 동의해야 한다. */
export const HEALTH_CONSENT_VERSION = "2026-10-11";

export const consentSchema = z.object({
  agreed: z.literal(true, "건강정보 수집·이용에 동의해 주셔야 기록을 시작할 수 있어요."),
});
