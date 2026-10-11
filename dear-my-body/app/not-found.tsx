import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 px-5 text-center">
      <p className="text-base font-medium">찾는 화면이 없어요</p>
      <p className="text-sm text-muted-foreground">주소가 바뀌었거나, 볼 수 없는 화면일 수 있어요.</p>
      <Button asChild>
        <Link href="/">처음으로</Link>
      </Button>
    </main>
  );
}
