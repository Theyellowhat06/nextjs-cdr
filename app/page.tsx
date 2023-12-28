"use client";
import { Button } from "antd";
import Link from "next/link";

export default function Home() {
  return (
    <div className="h-screen w-screen flex items-center justify-center">
      <Link href="./graph">
        <Button type="primary">Go to Graph</Button>
      </Link>
    </div>
  );
}
