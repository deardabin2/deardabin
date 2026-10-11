import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

/** GET 폼이라 자바스크립트 없이도 동작한다. 나머지 필터는 hidden 으로 유지 */
export function SearchForm({
  action,
  name,
  defaultValue,
  placeholder,
  label,
  keep,
}: {
  action: string;
  name: string;
  defaultValue?: string;
  placeholder: string;
  label: string;
  keep: Record<string, string | undefined>;
}) {
  return (
    <form action={action} role="search" className="relative">
      {Object.entries(keep).map(([k, v]) => (v ? <input key={k} type="hidden" name={k} value={v} /> : null))}
      <label htmlFor={`search-${name}`} className="sr-only">
        {label}
      </label>
      <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        id={`search-${name}`}
        type="search"
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="pl-9"
      />
    </form>
  );
}
