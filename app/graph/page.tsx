"use client";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Graph() {
  const pathname = usePathname();
  const router = useRouter();
  useEffect(() => {
    if (pathname === "/graph") {
      router.push("/graph/cdr");
    }
  }, [pathname]);
  return <></>;
}
