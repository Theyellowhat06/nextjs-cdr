"use client";
import { Menu, MenuProps } from "antd";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useState } from "react";
import {
  BankOutlined,
  DashboardOutlined,
  PhoneOutlined,
} from "@ant-design/icons";

export default function GraphLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  //   pathname = "/graph/cdr";
  const [currentMenu, setCurrentMenu] = useState<string>(
    pathname === "/graph" ? "/graph/cdr" : pathname ?? "/graph/cdr"
  );
  const items: MenuProps["items"] = [
    {
      label: "CDR analysis",
      key: "/graph/cdr",
      icon: <PhoneOutlined />,
    },
    {
      label: "Bank transaction analysis",
      key: "/graph/bank",
      icon: <BankOutlined />,
    },
    {
      label: "Dashboard",
      key: "/graph/dashboard",
      icon: <DashboardOutlined />,
    },
  ];
  const onClick: MenuProps["onClick"] = ({ key }) => {
    setCurrentMenu(key);
    router.push(key);
  };
  return (
    <div>
      <Menu
        onClick={onClick}
        selectedKeys={[currentMenu]}
        mode="horizontal"
        items={items}
      />
      {children}
    </div>
  );
}
