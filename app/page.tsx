"use client";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { RadialGraph } from "@ant-design/graphs";
import axios from "axios";
import { Button, Checkbox } from "antd";
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
