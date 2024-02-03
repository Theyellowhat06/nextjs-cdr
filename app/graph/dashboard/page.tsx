"use client";
import { DualAxes } from "@ant-design/plots";
import { Card, Col, DatePicker, Empty, Row, Spin, message } from "antd";
import axios from "axios";
import { useEffect, useState } from "react";

const { RangePicker } = DatePicker;

export default function DemoDualAxes() {
  const [from, setFrom] = useState(new Date("1900-01-01"));
  const [to, setTo] = useState(new Date("2200-01-01"));
  const [chartData, setChartData] =
    useState<{ [key: string]: { [key: string]: string } }[]>();
  const [reading, setReading] = useState(false);
  useEffect(() => {
    setReading(true);
    axios
      .get(`${process.env.NEXT_PUBLIC_API}/user/calls_by_date`, {
        params: { from: from.toISOString(), to: to.toISOString() },
      })
      .then(({ data: { success, result } }) => {
        if (success) {
          setChartData(result);
        }
      })
      .catch((err) => {
        message.error(err.message);
      })
      .finally(() => {
        setReading(false);
      });
  }, [from, to]);
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
      </Row>
      <Card title={"Chart"}>
        {reading ? (
          <Spin />
        ) : chartData && chartData.length > 0 ? (
          <DualAxes
            data={[chartData, chartData]}
            xField={"formated_date"}
            yField={["max_dura", "min_dura", "avg_dura"]}
          />
        ) : (
          <Empty />
        )}
      </Card>
    </div>
  );
}
