"use client";

/* eslint-disable no-undef */
import React from "react";
import {
  Row,
  Col,
  Card,
  Checkbox,
  List,
  Avatar,
  DatePicker,
  Button,
  Drawer,
  Input,
} from "antd";
import Graphin, { Utils } from "@antv/graphin";
import { ContextMenu } from "@antv/graphin-components";
import {
  ExpandAltOutlined,
  ShrinkOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import axios from "axios";
import IconLoader from "@antv/graphin-icons";

const { Menu } = ContextMenu;
const { RangePicker } = DatePicker;

const icons = Graphin.registerFontFamily(IconLoader);

type CallType = { Caller_id: string; Duration_s: number; Receiver_id: string };
type CallerType = { Caller_id: string; count: number };

enum menuKey {
  expand = "expand",
  remove = "remove",
  shrink = "shrink",
  info = "info",
}

export default function Graph() {
  const [state, setState] = React.useState({
    selected: [],
    data: { nodes: [], edges: [] },
  });

  const [callers, setCallers] = React.useState<any[]>([]);
  const [selectedCallers, setSelectedCallers] = React.useState<string[]>([]);
  const [from, setFrom] = React.useState(new Date("1900-01-01"));
  const [to, setTo] = React.useState(new Date("2200-01-01"));
  const [drawer, setDrawer] = React.useState(false);

  React.useEffect(() => {
    axios
      .get("http://localhost:3050/user/callers", {
        params: { from: from.toISOString(), to: to.toISOString() },
      })
      .then((result) => {
        setCallers(result.data.result);
      });
  }, [from, to]);

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
  React.useEffect(() => {
    axios
      .post("http://localhost:3050/user/calls", {
        ids: selectedCallers,
      })
      .then(({ data: { success, result } }) => {
        if (success) {
          updateGraphData(result);
        } else {
          updateGraphData([]);
        }
      });
  }, [selectedCallers]);

  const updateGraphData = (callsData: CallType[]) => {
    const edges: { [key: string]: number[] } = {};
    const idArray = [...new Set(callsData.map((item) => item.Caller_id))];
    callsData.forEach((c) => {
      edges[`${c.Caller_id}-${c.Receiver_id}`] = [
        ...(edges[`${c.Caller_id}-${c.Receiver_id}`] || []),
        c.Duration_s,
      ];
    });
    console.log("edges:", edges);
    console.log({
      nodes: [
        ...idArray.map((pn) => setNode({ id: pn.toString() })),
        ...callsData.map((cd) => setNode({ id: cd.Receiver_id.toString() })),
      ],
      edges: [
        ...Object.keys(edges).map((e) => {
          const [target, srouce] = e.split("-");
          return setEdge({
            source: target,
            target: srouce,
          });
        }),
        ...callsData.map((cd) =>
          setEdge({
            source: cd.Caller_id.toString(),
            target: cd.Receiver_id.toString(),
          })
        ),
      ],
    });
    setState({
      ...state,
      data: {
        nodes: [
          ...idArray.map((pn) => setNode({ id: pn.toString() })),
          ...callsData.map((cd) => setNode({ id: cd.Receiver_id.toString() })),
        ],
        edges: [
          ...Object.keys(edges).map((e) => {
            const [target, srouce] = e.split("-");
            const max = Math.max(...edges[e]);
            const min = Math.min(...edges[e]);
            const sum = edges[e].reduce(
              (accumulator, currentValue) => accumulator + currentValue,
              0
            );
            const avg = sum / edges[e].length;
            return setEdge({
              source: target,
              target: srouce,
              label: `avg: ${avg.toFixed(2)}`,
            });
          }),
        ],
      },
    });
  };

  const setEdge = ({
    source,
    target,
    label,
  }: {
    source: string;
    target: string;
    label?: string;
  }) => {
    return {
      source: source,
      target: target,
      style: {
        label: {
          value: label || "",
        },
      },
    };
  };

  const setNode = ({ id, label }: { id: string; label?: string }) => {
    return {
      id: id,
      style: {
        label: {
          value: label || id,
        },
        icon: {
          fontFamily: "graphin",
          type: "font",
          value: icons.home,
        },
      },
    };
  };

  const handleChange = (menuItem: any, menuData: any) => {
    console.log(menuItem, menuData);
    console.log(menuData);
    if (menuItem.key === menuKey.expand) {
      setSelectedCallers([...selectedCallers, menuData.id]);
    } else if (menuItem.key === menuKey.shrink) {
      setSelectedCallers(selectedCallers.filter((sc) => sc !== menuData.id));
    }

    // const count = 4;
    // const expandData = Utils.mock(count).expand([menuData]).graphin();

    // setState({
    //   ...state,
    //   data: {
    //     // 还需要对Node和Edge去重，这里暂不考虑
    //     nodes: [...state.data.nodes, ...expandData.nodes],
    //     edges: [...state.data.edges, ...expandData.edges],
    //   },
    // });
  };
  const { data } = state;
  return (
    <div className="bg-white">
      <Row gutter={16}>
        <Col span={18} className="h-screen">
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
          </Row>

          <Card title="graph" bodyStyle={{ height: "90vh" }}>
            <div className="w-full h-full">
              <Graphin
                data={data}
                layout={{
                  type: "graphin-force",
                }}>
                <ContextMenu bindType="node" style={{ width: 100 }}>
                  <Menu
                    bindType="node"
                    options={[
                      {
                        key: menuKey.expand,
                        icon: <ExpandAltOutlined />,
                        name: "Expand",
                      },
                      {
                        key: menuKey.shrink,
                        icon: <ShrinkOutlined />,
                        name: "Shrink",
                      },
                      {
                        key: menuKey.info,
                        icon: <InfoCircleOutlined />,
                        name: "info",
                      },
                    ]}
                    onChange={handleChange}
                  />
                </ContextMenu>
              </Graphin>
            </div>
          </Card>
        </Col>
        <Col>
          <div>
            <Card
              title="Callers"
              bodyStyle={{ overflow: "auto", height: "90vh" }}>
              <List
                itemLayout="horizontal"
                dataSource={callers}
                renderItem={(item: CallerType, index) => (
                  <List.Item>
                    <Checkbox
                      className=""
                      checked={
                        selectedCallers.find((sc) => sc === item.Caller_id)
                          ? true
                          : false
                      }
                      onChange={({ target: { checked } }) => {
                        console.log(checked, item);
                        if (checked) {
                          setSelectedCallers([
                            ...selectedCallers,
                            item.Caller_id,
                          ]);
                        } else {
                          setSelectedCallers(
                            selectedCallers.filter(
                              (val) => val !== item.Caller_id
                            )
                          );
                        }
                      }}>
                      <List.Item.Meta
                        className="w-80"
                        avatar={
                          <Avatar
                            src={`https://xsgames.co/randomusers/avatar.php?g=pixel&key=${index}`}
                          />
                        }
                        title={`${item.Caller_id}`}
                        description={`Total calls: ${item.count}`}
                      />
                    </Checkbox>
                  </List.Item>
                )}
              />
            </Card>
          </div>
        </Col>
      </Row>
      <Drawer open={drawer} onClose={() => setDrawer(false)}>
        <Input type="file" />
        <Button type="primary" className="bg-red">
          Submit
        </Button>
      </Drawer>
    </div>
  );
}
