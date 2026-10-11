import type { NextConfig } from "next";

// Cache Components 는 끈다. 모든 화면이 로그인 사용자별 데이터라 정적 셸 이점이 거의 없고,
// 쿠키를 읽는 곳마다 Suspense 경계를 강제해 구조만 복잡해지기 때문.
const nextConfig: NextConfig = {
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
