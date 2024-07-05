"use client";

import { Loader2, Search } from "lucide-react";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { useRef, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function Searchbar() {
  const params = useSearchParams();
  const DefaultQuery = params.get("query") || "";
  const [query, setQuery] = useState(DefaultQuery);
  const [isSearching, startTransition] = useTransition();
  const router = useRouter();

  const inputRef = useRef<HTMLInputElement>(null);

  const search = () => {
    startTransition(() => {
      router.push(`/search?query=${query}`);
    });
  };

  return (
    <div className="relative w-full h-14 flex flex-col bg-white">
      <div className="relative h-14 z-10 rounded-md">
        <Input
          disabled={isSearching}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              search();
            }

            if (e.key === "Escape") {
              inputRef?.current?.blur();
            }
          }}
          className="absolute inset-0 h-full"
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <Button
          disabled={isSearching}
          onClick={search}
          className="absolute right-0 inset-y-0 h-full rounded-l-none bg-black text-white"
        >
          {isSearching ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : (
            <Search className="h-6 w-6" />
          )}
        </Button>
      </div>
    </div>
  );
}
