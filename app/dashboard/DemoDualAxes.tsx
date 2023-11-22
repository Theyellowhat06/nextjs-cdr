"use client";
import React from "react";
import { DualAxes } from "@ant-design/plots";
import { Button, Col, Row } from "antd";
import Link from "next/link";

export default function DemoDualAxes() {
  const data = [
    {
      year: "1991",
      value: 3,
      count: 10,
    },
    {
      year: "1992",
      value: 4,
      count: 4,
    },
    {
      year: "1993",
      value: 3.5,
      count: 5,
    },
    {
      year: "1994",
      value: 5,
      count: 5,
    },
    {
      year: "1995",
      value: 4.9,
      count: 4.9,
    },
    {
      year: "1996",
      value: 6,
      count: 35,
    },
    {
      year: "1997",
      value: 7,
      count: 7,
    },
    {
      year: "1998",
      value: 9,
      count: 1,
    },
    {
      year: "1999",
      value: 13,
      count: 20,
    },
  ];
  const config = {
    data: [data, data],
    xField: "year",
    yField: ["value", "count"],
    geometryOptions: [
      {
        geometry: "line",
        color: "#5B8FF9",
      },
      {
        geometry: "line",
        color: "#5AD8A6",
      },
    ],
  };
  return (
    <div>
      <Row gutter={16} className="p-4">
        <Col>
          <RangePicker
            onChange={(date) => {
              if (date) {
                const [from, to] = date;
                if (from) setFrom(from?.toDate());
                if (to) setTo(to?.toDate());
              } else {
                setFrom(new Date("1900-01-01"));
                setTo(new Date("2200-01-01"));
              }
            }}
          />
        </Col>
        <Col>
          <Button type="primary" onClick={() => setDrawer(true)}>
            Import Excel
          </Button>
        </Col>
        <Col>
          <Link href={"./dashboard"}>
            <Button type="primary">Dashoard</Button>
          </Link>
        </Col>
      </Row>
      <DualAxes {...config} />
    </div>
  );
}
