"use client";
import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import { DualAxes } from "@ant-design/plots";
import { Button, Card, Col, DatePicker, Empty, Row, Spin, message } from "antd";
import Link from "next/link";
import axios from "axios";

const { RangePicker } = DatePicker;

export default function DemoDualAxes() {
  const [from, setFrom] = useState(new Date("1900-01-01"));
  const [to, setTo] = useState(new Date("2200-01-01"));
  const [chartData, setChartData] = useState<any[]>();
  const [reading, setReading] = useState(false);
  useEffect(()=>{
    setReading(true)
    axios.get(`${process.env.NEXT_PUBLIC_API}/user/calls_by_date`, {
      params: { from: from.toISOString(), to: to.toISOString() },
    }).then(({ data: { success, result } })=>{
      if(success){
        setChartData(result)
      }
    }).catch((err) => {
      message.error(err.message)
    }).finally(()=>{
      setReading(false)
    })
  },[from, to])
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
          <Link href={"./graph"}>
            <Button type="primary">Graph</Button>
          </Link>
        </Col>
      </Row>
      <Card title={"Chart"}>
        {reading ?<Spin/>: chartData && chartData.length > 0? <DualAxes data={[chartData, chartData]} xField={"formated_date"} yField={['max_dura', 'min_dura', 'avg_dura']}  />: <Empty/>}
      </Card>
    </div>
  );
}
