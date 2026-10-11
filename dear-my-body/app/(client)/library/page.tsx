import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, ChefHat, ChevronRight, Leaf } from "lucide-react";

export const metadata: Metadata = { title: "라이브러리" };

const SECTIONS = [
  { href: "/library/ingredients", title: "식재료", description: "장보기 전에 살펴봐요", icon: Leaf },
  { href: "/library/recipes", title: "레시피", description: "인분에 맞춰 재료 양이 바뀌어요", icon: ChefHat },
  { href: "/library/knowledge", title: "기초지식", description: "알고 먹으면 더 쉬워요", icon: BookOpen },
];

export default function LibraryPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">라이브러리</h1>
      <ul className="flex flex-col gap-3">
        {SECTIONS.map(({ href, title, description, icon: Icon }) => (
          <li key={href}>
            <Link
              href={href}
              className="flex min-h-20 items-center gap-4 rounded-xl border bg-card px-4 py-4 transition-colors hover:bg-accent"
            >
              <span aria-hidden className="flex size-11 items-center justify-center rounded-full bg-accent text-primary">
                <Icon className="size-5" />
              </span>
              <span className="flex flex-1 flex-col">
                <span className="font-semibold">{title}</span>
                <span className="text-sm text-muted-foreground">{description}</span>
              </span>
              <ChevronRight aria-hidden className="size-5 text-muted-foreground" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
