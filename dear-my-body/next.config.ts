import type { NextConfig } from "next";

// Cache Components 는 끈다. 모든 화면이 로그인 사용자별 데이터라 정적 셸 이점이 거의 없고,
// 쿠키를 읽는 곳마다 Suspense 경계를 강제해 구조만 복잡해지기 때문.
const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
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
