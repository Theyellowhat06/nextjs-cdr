"use client";

import IconPicker from "@/components/icon_picker";
import { setEdge, setNode } from "@/utils/graphin_helper";
import {
  EditOutlined,
  ExpandAltOutlined,
  InfoCircleOutlined,
  ShrinkOutlined,
} from "@ant-design/icons";
import Graphin, { GraphinData } from "@antv/graphin";
import { ContextMenu } from "@antv/graphin-components";
import { Item } from "@antv/graphin-components/lib/ContextMenu/Menu";
import {
  Avatar,
  Button,
  Card,
  Checkbox,
  Col,
  DatePicker,
  Divider,
  Drawer,
  Empty,
  Input,
  List,
  Modal,
  Popconfirm,
  Row,
  Spin,
  Table,
  Tabs,
  message,
} from "antd";
import Search from "antd/es/input/Search";
import TextArea from "antd/es/input/TextArea";
import axios from "axios";
import { ChangeEvent, useEffect, useState } from "react";
import * as xlsx from "xlsx";
import {  getCallersAction } from "./serverActions";

const { Menu } = ContextMenu;
const { RangePicker } = DatePicker;

export type CallType = {
  Caller_id: string;
  Duration_s: number;
  Receiver_id: string;
  icon: string | null;
  info: string | null;
  rc_icon: string | null;
  rc_info: string | null;
};
export type CallerType = {
  Caller_id: string;
  count: number;
  icon: string | null;
  info: string | null;
};

enum menuKey {
  expand = "expand",
  remove = "remove",
  shrink = "shrink",
  info = "info",
  editIcon = "editIcon",
}

export default function Graph() {
  const [state, setState] = useState<{ selected: []; data: GraphinData }>({
    selected: [],
    data: { nodes: [], edges: [] },
  });

  const [callers, setCallers] = useState<CallerType[]>([]);
  const [selectedCallers, setSelectedCallers] = useState<string[]>([]);
  const [from, setFrom] = useState(new Date("1900-01-01"));
  const [to, setTo] = useState(new Date("2200-01-01"));
  const [drawer, setDrawer] = useState(false);
  const [excel, setExcel] = useState<unknown>();
  const [inputValue, setInputValue] = useState("");
  const [uploading, setUploading] = useState(false);
  const [reading, setReading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState<{
    sources: string[];
    target: string;
  } | null>(null);
  const [openEditUser, setOpenEditUser] = useState<{
    info: string;
    callerId: string;
  } | null>(null);
  const [openEditIcon, setOpenEditIcon] = useState<boolean | string>(false);

  const [search, setSearch] = useState({ id: "", info: "" });

  useEffect(() => {
    getCallers({from, to, search});
  }, [from, to, search]);

  const getCallers = ({from, to, search}: {from: Date, to: Date, search: {id: string, info: string}}) => {
    setReading(true);
    getCallersAction({from, to, search}).then(({success, result}) => {
          if (success) {
            setCallers(result);
          }
        })
    .catch((err) => {
      message.error(err.message);
    })
    .finally(() => {
      setReading(false);
    });
    // axios
    //   .get(`${process.env.NEXT_PUBLIC_API}/user/callers`, {
    //     params: { from: from.toISOString(), to: to.toISOString(), ...search },
    //   })
    //   .then(({ data: { success, result } }) => {
    //     if (success) {
    //       setCallers(result);
    //     }
    //   })
    //   .catch((err) => {
    //     message.error(err.message);
    //   })
    //   .finally(() => {
    //     setReading(false);
    //   });
  };

  useEffect(() => {
    axios
      .post(`${process.env.NEXT_PUBLIC_API}/user/calls`, {
        ids: selectedCallers,
      })
      .then(({ data: { success, result, recieved_calls } }) => {
        if (success) {
          updateGraphData(result, recieved_calls);
        } else {
          updateGraphData([], []);
        }
      })
      .catch((err) => {
        message.error(err.message);
      })
      .finally(() => {});
  }, [selectedCallers]);

  const onUpload = () => {
    setUploading(true);
    axios
      .post(`${process.env.NEXT_PUBLIC_API}/user/excel_import`, {
        data: excel,
      })
      .then(({ data: { success } }) => {
        console.log(data);
        if (success) {
          closeDrawer();
          getCallers({from, to, search});
          message.success("Амжилттай");
        }
      })
      .catch((err) => {
        console.log(err);
        message.error(err.message);
      })
      .finally(() => {
        setUploading(false);
      });
  };

  const removeAllRecords = () => {
    setUploading(true);
    axios
      .post(`${process.env.NEXT_PUBLIC_API}/user/remove_all_records`, {
        data: excel,
      })
      .then(({ data: { success, msg } }) => {
        console.log(data);
        if (success) {
          closeDrawer();
          getCallers({from, to, search});
          setSelectedCallers([]);
          message.success("Амжилттай");
        } else {
          message.error(msg);
        }
      })
      .catch((err) => {
        console.log(err);
        message.error(err.message);
      })
      .finally(() => {
        setUploading(false);
      });
  };

  const closeDrawer = () => {
    setDrawer(false);
    setExcel(null);
    setInputValue("");
  };

  const readUploadFile = (e: ChangeEvent<HTMLInputElement>) => {
    setUploading(true);
    e.preventDefault();
    if (e.target.files) {
      setInputValue(e.target.value);
      const reader = new FileReader();
      reader.onload = async (e) => {
        const data = e?.target?.result;
        const workbook = xlsx.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = xlsx.utils.sheet_to_json(worksheet);
        setUploading(false);
        setExcel(json);
      };
      reader.readAsArrayBuffer(e.target.files[0]);
    }
  };

  const updateGraphData = (
    callsData: CallType[],
    receivedCalls: CallType[]
  ) => {
    const edges: { [key: string]: number[] } = {};
    const recievedEdges: { [key: string]: number[] } = {};
    const idArray = Array.from(
      new Set(callsData.map((item) => item.Caller_id))
    );
    callsData.forEach((c) => {
      edges[`${c.Caller_id}-${c.Receiver_id}`] = [
        ...(edges[`${c.Caller_id}-${c.Receiver_id}`] || []),
        c.Duration_s,
      ];
    });
    receivedCalls.forEach((rc) => {
      recievedEdges[`${rc.Receiver_id}-${rc.Caller_id}`] = [
        ...(edges[`${rc.Receiver_id}-${rc.Caller_id}`] || []),
        rc.Duration_s,
      ];
    });
    console.log("edges:", edges);
    setState({
      ...state,
      data: {
        nodes: [
          ...idArray.map((pn) =>
            setNode({
              id: pn.toString(),
              ...(() => {
                const cd = callsData.find((cd) => cd.Caller_id == pn);
                return { icon: cd?.icon, label: `${pn} (${cd?.info})` };
              })(),
            })
          ),
          ...callsData.map((cd) => setNode({ id: cd.Receiver_id.toString() })),
          ...receivedCalls.map((rc) =>
            setNode({ id: rc.Caller_id.toString() })
          ),
        ],
        edges: [
          ...Object.keys(recievedEdges).map((e) => {
            const [target, srouce] = e.split("-");
            // const max = Math.max(...recievedEdges[e]);
            // const min = Math.min(...recievedEdges[e]);
            const sum = recievedEdges[e].reduce(
              (accumulator, currentValue) => accumulator + currentValue,
              0
            );
            const avg = sum / recievedEdges[e].length;
            return setEdge({
              source: target,
              target: srouce,
              label: `avg: ${avg.toFixed(2)}`,
              color: "green",
            });
          }),
          ...Object.keys(edges).map((e) => {
            const [target, srouce] = e.split("-");
            // const max = Math.max(...edges[e]);
            // const min = Math.min(...edges[e]);
            const sum = edges[e].reduce(
              (accumulator, currentValue) => accumulator + currentValue,
              0
            );
            const avg = sum / edges[e].length;
            return setEdge({
              source: target,
              target: srouce,
              label: `avg: ${avg.toFixed(2)}`,
              color: recievedEdges[e] ? "orange" : "red",
            });
          }),
        ],
      },
    });
  };

  const handleChange = (menuItem: Item, { id }: { id: string }) => {
    if (menuItem.key === menuKey.expand) {
      setSelectedCallers([...selectedCallers, id]);
    } else if (menuItem.key === menuKey.shrink) {
      setSelectedCallers(selectedCallers.filter((sc) => sc !== id));
    } else if (menuItem.key === menuKey.info) {
      const sources = state.data.edges.filter(
        (e: { source: string; target: string }) => e.target === id
      );
      setIsModalOpen({
        sources: sources.map((s: { source: string }) => s.source),
        target: id,
      });
    } else if (menuItem.key === menuKey.editIcon) {
      setOpenEditIcon(id);
    }
  };
  const { data } = state;
  return (
    <div className="bg-white">
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
          <Popconfirm
            title={"Removing all records"}
            description={"Do you really want to remove all records?"}
            onConfirm={removeAllRecords}
            okButtonProps={{ loading: uploading }}
          >
            <Button danger>Remove all record</Button>
          </Popconfirm>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={18}>
          <Card title="graph" bodyStyle={{ height: "85vh" }}>
            <div className="w-full h-full">
              <Graphin
                data={data}
                layout={{
                  type: "graphin-force",
                }}
              >
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
                      {
                        key: menuKey.editIcon,
                        icon: <EditOutlined />,
                        name: "Edit icon",
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
              bodyStyle={{ overflow: "auto", height: "85vh", minWidth: 415 }}
            >
              <div>
                <Tabs
                  type="card"
                  size="small"
                  tabBarStyle={{
                    padding: 0,
                    margin: 0,
                  }}
                  items={[
                    {
                      key: "id",
                      label: "ID",
                      children: (
                        <Search
                          allowClear
                          placeholder="Enter ID"
                          onSearch={(val) => setSearch({ id: val, info: "" })}
                        />
                      ),
                    },
                    {
                      key: "info",
                      label: "Info",
                      children: (
                        <Search
                          allowClear
                          placeholder="Enter info"
                          onSearch={(val) => setSearch({ id: "", info: val })}
                        />
                      ),
                    },
                  ]}
                />
                <Divider />
                {reading ? (
                  <Spin />
                ) : (
                  <List
                    itemLayout="horizontal"
                    dataSource={callers ?? []}
                    renderItem={(item: CallerType, index) => (
                      <List.Item>
                        <div className="flex">
                          <Checkbox
                            className=""
                            checked={
                              selectedCallers.find(
                                (sc) => sc === item.Caller_id
                              )
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
                            }}
                          >
                            <List.Item.Meta
                              className="w-72"
                              avatar={
                                <Avatar
                                  src={
                                    item.icon ??
                                    `//xsgames.co/randomusers/avatar.php?g=pixel&key=${index}`
                                  }
                                />
                              }
                              title={`${item.Caller_id} ${
                                item.info ? `(${item.info})` : ""
                              }`}
                              description={`Total calls: ${item.count}`}
                            />
                          </Checkbox>
                          <Button
                            shape="circle"
                            onClick={() => {
                              setOpenEditUser({
                                callerId: item.Caller_id,
                                info: item.info ?? "",
                              });
                            }}
                          >
                            <EditOutlined />
                          </Button>
                        </div>
                      </List.Item>
                    )}
                  />
                )}
              </div>
            </Card>
          </div>
        </Col>
      </Row>
      <IconPicker
        callerId={openEditIcon}
        onUpdate={() => {
          console.log("working");
          getCallers({from, to, search});
          setSelectedCallers([]);
        }}
        onClose={() => setOpenEditIcon(false)}
      />
      <Drawer
        open={!!openEditUser}
        onClose={() => setOpenEditUser(null)}
        extra={
          <Button
            type="primary"
            onClick={() => {
              axios
                .post(`${process.env.NEXT_PUBLIC_API}/contacts/info`, {
                  caller_id: openEditUser?.callerId,
                  info: openEditUser?.info,
                })
                .then(({ data: { success } }) => {
                  if (success) {
                    getCallers({from, to, search});
                    setSelectedCallers([]);
                    message.success("Contact info updated succesfully");
                    setOpenEditUser(null);
                  }
                });
            }}
          >
            Save
          </Button>
        }
      >
        <div className="text-black">
          <p>Notes</p>
          <TextArea
            title="Notes"
            value={openEditUser?.info}
            onChange={(e) =>
              setOpenEditUser({
                callerId: openEditUser?.callerId as string,
                info: e.target.value,
              })
            }
          />
        </div>
      </Drawer>
      <Drawer open={drawer} onClose={closeDrawer}>
        <div className="flex flex-col">
          <Input
            value={inputValue}
            type="file"
            accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
            onChange={readUploadFile}
          />
          <Button
            type="primary"
            disabled={!excel}
            loading={uploading}
            onClick={onUpload}
          >
            Submit
          </Button>
        </div>
      </Drawer>
      <Modal
        title={"List of call"}
        open={isModalOpen ? true : false}
        onCancel={() => {
          setIsModalOpen(null);
        }}
        width={1000}
        footer={null}
      >
        {isModalOpen && <ListOfCall {...isModalOpen} />}
      </Modal>
    </div>
  );
}

const ListOfCall = ({
  sources,
  target,
}: {
  sources: string[];
  target: string;
}) => {
  const [reading, setReading] = useState(false);
  const [callsData, setCallsData] = useState([]);
  useEffect(() => {
    setReading(true);
    axios
      .get(`${process.env.NEXT_PUBLIC_API}/user/calls_by_receiver`, {
        params: { sources: sources, target: target },
      })
      .then(({ data: { success, result } }) => {
        if (success) {
          setCallsData(result);
        }
      })
      .catch((err) => {
        message.error(err.message);
      })
      .finally(() => {
        setReading(false);
      });
  }, [sources, target]);
  return reading ? (
    <Spin />
  ) : callsData && callsData.length > 0 ? (
    <Table
      dataSource={callsData}
      columns={Object.keys(callsData[0]).map((k) => ({
        title: k,
        dataIndex: k,
        key: k,
      }))}
    />
  ) : (
    <Empty />
  );
};
