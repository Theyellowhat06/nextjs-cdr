"use client";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { RadialGraph } from "@ant-design/graphs";
import axios from "axios";
import { Checkbox } from "antd";

export default function Home() {
  const [callers, setCallers] = useState<any[]>([]);
  const [selectedCallers, setSelectedCallers] = useState<string[]>([]);
  const [calls, setCalls] = useState<any[]>([]);

  useEffect(() => {
    axios.get("http://localhost:3050/user/callers").then((result) => {
      setCallers(result.data.result);
    });
  }, []);

  // const getNodes = (node={}) =>{
  //   return new Promise((resolve)=>{
  //     axios
  //     .post("http://localhost:3050/user/calls", {
  //       ids: selectedCallers,
  //     })
  //     .then((result) => {
  //       setCalls(result.data.result);
  //     });
  //   })
  // }
  useEffect(() => {
    axios
      .post("http://localhost:3050/user/calls", {
        ids: selectedCallers,
      })
      .then((result) => {
        setCalls(result.data.result);
      });
  }, [selectedCallers]);
  return (
    <div className="flex h-screen w-screen">
      <div className="w-full h-full">
        <DemoRadialGraph />
      </div>
      <div className="w-80 overflow-auto">
        {callers.map((caller: { Caller_id: string; count: number }) => (
          <Checkbox
            onChange={(value) => {
              const checked = value.target.checked;
              checked
                ? setSelectedCallers([...selectedCallers, caller.Caller_id])
                : setSelectedCallers(
                    selectedCallers.filter((sc) => sc !== caller.Caller_id)
                  );
            }}
            value={selectedCallers.find((sc) => sc === caller.Caller_id)}>
            {`${caller?.Caller_id} (${caller.count})` || ""}
          </Checkbox>
        ))}
      </div>
    </div>
  );
  function DemoRadialGraph() {
    const chartRef = useRef();
    const RadialData = {
      nodes: [
        {
          id: "0",
          label: "0",
        },
        {
          id: "1",
          label: "1",
        },
        {
          id: "2",
          label: "2",
        },
        {
          id: "3",
          label: "3",
        },
        {
          id: "4",
          label: "4",
        },
        {
          id: "5",
          label: "5",
        },
        {
          id: "6",
          label: "6",
        },
        {
          id: "7",
          label: "7",
        },
        {
          id: "8",
          label: "8",
        },
        {
          id: "9",
          label: "9",
        },
      ],
      edges: [
        {
          source: "0",
          target: "1",
          label: "hi",
        },
        {
          source: "0",
          target: "2",
        },
        {
          source: "0",
          target: "3",
        },
        {
          source: "0",
          target: "4",
        },
        {
          source: "0",
          target: "5",
        },
        {
          source: "0",
          target: "6",
        },
        {
          source: "0",
          target: "7",
        },
        {
          source: "0",
          target: "8",
        },
        {
          source: "0",
          target: "9",
        },
      ],
    };

    const fetchData = (node: any) => {
      setSelectedCallers([...selectedCallers, node.id]);
      // return new Promise((resolve, reject) => {
      //   const data = new Array(Math.ceil(Math.random() * 10) + 2)
      //     .fill("")
      //     .map((_, i) => i + 1);
      //   setTimeout(() => {
      //     resolve({
      //       nodes: [
      //         {
      //           ...node,
      //         },
      //       ].concat(
      //         data.map((i) => {
      //           return {
      //             id: `${node.id}-${i}`,
      //             label: `${node.label}-${i}`,
      //           };
      //         })
      //       ),
      //       edges: data.map((i) => {
      //         return {
      //           source: node.id,
      //           target: `${node.id}-${i}`,
      //         };
      //       }),
      //     });
      //   }, 1000);
      // });
    };

    const asyncData = async (node: any) => {
      return await fetchData(node);
    };

    const config = {
      data:
        calls && calls.length > 0
          ? {
              nodes: [
                ...selectedCallers.map((sc) => ({
                  id: `${sc}`,
                  label: `${sc}`,
                })),
                ...calls
                  .filter((c) =>
                    selectedCallers.find((sc) => sc !== c.Receiver_id)
                  )
                  .map((c) => ({
                    id: `${c.Receiver_id}`,
                    label: `${c.Receiver_id}`,
                  })),
              ],
              edges: calls.map((c) => ({
                source: `${c.Caller_id}`,
                target: `${c.Receiver_id}`,
                label: `${c.Duration_s}`,
                labelCfg: {
                  style: {
                    fontSize: 5,
                  },
                },
              })),
            }
          : { nodes: [], edges: [] },
      autoFit: false,
      layout: {
        unitRadius: 80,
        /** 节点直径 */
        nodeSize: 20,
        /** 节点间距 */
        nodeSpacing: 10,
      },
      nodeCfg: {
        asyncData,
        size: 20,
        style: {
          fill: "#6CE8DC",
          stroke: "#6CE8DC",
        },
        labelCfg: {
          style: {
            fontSize: 5,
            fill: "#000",
          },
        },
      },
      menuCfg: {
        customContent: (e: any) => {
          return (
            <div>
              <button
                onClick={() => {
                  console.log("");
                }}>
                手动拓展(双击节点也可以拓展)
              </button>
            </div>
          );
        },
      },
      edgeCfg: {
        style: {
          lineWidth: 1,
        },

        endArrow: {
          d: 10,
          size: 2,
        },
      },
      behaviors: ["drag-canvas", "zoom-canvas", "drag-node"],
      onReady: (graph: any) => {
        chartRef.current = graph;
      },
    };

    return <RadialGraph {...config} />;
  }
}
