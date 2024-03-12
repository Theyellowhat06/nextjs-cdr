"use client";

import IconPicker from "@/components/icon_picker";
import { setEdge, setNode } from "@/utils/graphin_helper";
import {
  BankOutlined,
  EditOutlined,
  ExpandAltOutlined,
  FileTextOutlined,
  InfoCircleOutlined,
  ShrinkOutlined,
  UserOutlined,
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
  Form,
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
import { uniqBy } from "lodash";
import { ChangeEvent, useEffect, useState } from "react";
import * as xlsx from "xlsx";

const { Menu } = ContextMenu;
const { RangePicker } = DatePicker;

type CallType = {
  Caller_id: string;
  Duration_s: number;
  Receiver_id: string;
  sender_account_number: string;
  receiver_account_number: string;
  bank_account_number: string;
  amount: string;
  icon: string | null;
  info: string | null;
  rc_icon: string | null;
  rc_info: string | null;
};
type CallerType = {
  Caller_id: string;
  sender_account_number: string;
  bank_account_number: string;
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
  bankAccount = "bankAccount",
}

export default function BankGraph() {
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
  const [openBankAccountInfo, setOpenBankAccountInfo] = useState<
    boolean | string
  >(false);

  const [search, setSearch] = useState({ id: "", info: "" });

  useEffect(() => {
    getCallers();
  }, [from, to, search]);

  const getCallers = () => {
    setReading(true);
    axios
      .get(`${process.env.NEXT_PUBLIC_API}/bank/people`, {
        params: { from: from.toISOString(), to: to.toISOString(), ...search },
      })
      .then(({ data: { success, result } }) => {
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
  };

  useEffect(() => {
    axios
      .post(`${process.env.NEXT_PUBLIC_API}/bank/calls`, {
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
      .post(`${process.env.NEXT_PUBLIC_API}/bank/excel_import`, {
        data: excel,
      })
      .then(({ data: { success } }) => {
        console.log(data);
        if (success) {
          closeDrawer();
          getCallers();
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
          getCallers();
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
        console.log(worksheet);
        const accountInfo = xlsx.utils.sheet_to_json(worksheet, {
          header: 1,
        })[0] as Array<string>;
        const json = xlsx.utils.sheet_to_json(worksheet, {
          range: 1,
          defval: null,
        }) as { [key: string]: string }[];
        setUploading(false);
        setExcel({
          accountNumber: accountInfo[10].split(" ")[0],
          statements: json.filter((j) => j["Харьцсан данс"]),
        });
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
      new Set(callsData.map((item) => item.sender_account_number))
    );
    callsData.forEach((c) => {
      edges[`${c.sender_account_number}-${c.receiver_account_number}`] = [
        ...(edges[`${c.sender_account_number}-${c.receiver_account_number}`] ||
          []),
        Number(c.amount),
      ];
    });
    receivedCalls.forEach((rc) => {
      recievedEdges[
        `${rc.receiver_account_number}-${rc.sender_account_number}`
      ] = [
        ...(edges[
          `${rc.receiver_account_number}-${rc.sender_account_number}`
        ] || []),
        Number(rc.amount),
      ];
    });
    console.log("edges:", recievedEdges);
    setState({
      ...state,
      data: {
        nodes: [
          ...idArray.map((pn) =>
            setNode({
              id: pn.toString(),
              ...(() => {
                const cd = callsData.find(
                  (cd) => cd.sender_account_number == pn
                );
                return { icon: cd?.icon, label: `${pn} (${cd?.info})` };
              })(),
            })
          ),
          ...callsData.map((cd) =>
            setNode({ id: cd.receiver_account_number.toString() })
          ),
          ...uniqBy(
            receivedCalls.flatMap((rc) => [
              setNode({ id: rc.sender_account_number.toString() }),
              setNode({ id: rc.receiver_account_number.toString() }),
            ]),
            "id"
          ),
        ],
        edges: [
          ...Object.keys(edges).map((e) => {
            const [target, srouce] = e.split("-");
            const max = Math.max(...edges[e]);
            const min = Math.min(...edges[e]);
            const color = max > 0 ? (min > 0 ? "green" : "orange") : "red";
            const sum = edges[e].reduce(
              (accumulator, currentValue) => accumulator + currentValue,
              0
            );
            const avg = sum / edges[e].length;
            return setEdge({
              source: target,
              target: srouce,
              label: `avg: ${avg.toFixed(2)}`,
              color: color,
            });
          }),
          ...Object.keys(recievedEdges).map((e) => {
            const [target, srouce] = e.split("-");
            const max = Math.max(...recievedEdges[e]);
            const min = Math.min(...recievedEdges[e]);
            const color = max > 0 ? (min > 0 ? "green" : "orange") : "red";
            const sum = recievedEdges[e].reduce(
              (accumulator, currentValue) => accumulator + currentValue,
              0
            );
            const avg = sum / recievedEdges[e].length;
            return setEdge({
              source: target,
              target: srouce,
              label: `avg: ${avg.toFixed(2)}`,
              color: color,
            });
          }),
        ],
      },
    });
    console.log(state);
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
    } else if (menuItem.key === menuKey.bankAccount) {
      setOpenBankAccountInfo(id);
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
                <ContextMenu bindType="node" style={{ width: 150 }}>
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
                      {
                        key: menuKey.bankAccount,
                        icon: <FileTextOutlined />,
                        name: "Bank account info",
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
              title="Bank accounts"
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
                                (sc) => sc === item.bank_account_number
                              )
                                ? true
                                : false
                            }
                            onChange={({ target: { checked } }) => {
                              console.log(checked, item);
                              if (checked) {
                                setSelectedCallers([
                                  ...selectedCallers,
                                  item.bank_account_number,
                                ]);
                              } else {
                                setSelectedCallers(
                                  selectedCallers.filter(
                                    (val) => val !== item.bank_account_number
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
                              title={`${item.bank_account_number} ${
                                item.info ? `(${item.info})` : ""
                              }`}
                              description={`Total statements: ${item.count}`}
                            />
                          </Checkbox>
                          <Button
                            shape="circle"
                            onClick={() => {
                              setOpenEditUser({
                                callerId: item.bank_account_number,
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
          getCallers();
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
                    getCallers();
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
      {openBankAccountInfo && (
        <BankAccountInfo
          accountNumber={openBankAccountInfo}
          onCancel={() => setOpenBankAccountInfo(false)}
        />
      )}
    </div>
  );
}

const BankAccountInfo = ({
  accountNumber,
  onCancel,
}: {
  accountNumber?: string | boolean;
  onCancel: () => void;
}) => {
  const [data, setData] = useState<{
    first_name: string;
    last_name: string;
    account_number: string;
    register_number: string;
  } | null>(null);
  const [openEditBankAccountDrawer, setOpenBankAccountDrawer] =
    useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  if (!accountNumber) return;
  useEffect(() => {
    axios
      .get(
        `${process.env.NEXT_PUBLIC_API}/bank/account_profile/${accountNumber}`
      )
      .then(({ data: { success, result } }) => {
        if (success) setData(result);
      })
      .catch((error) => {
        message.error(error.message);
      })
      .finally(() => setLoading(false));
  }, []);
  console.log(accountNumber, data);

  return (
    <Modal
      title={`Account number: ${accountNumber}`}
      open={!!accountNumber}
      onCancel={onCancel}
      footer={[
        <Button key={"cancel"} onClick={onCancel}>
          Cancel
        </Button>,
        <Button
          key={"edit"}
          onClick={() => setOpenBankAccountDrawer(true)}
          type="primary"
        >
          Edit
        </Button>,
      ]}
    >
      {loading ? (
        <Spin />
      ) : !data ? (
        <Empty />
      ) : (
        <>
          <div className="space-y-4">
            <div className="flex space-x-4">
              <Avatar size="large" icon={<UserOutlined />} />
              <div>
                <div className="text-slate-400">First Name</div>
                <div>{data.first_name}</div>
              </div>
            </div>
            <div className="flex space-x-4">
              <Avatar size="large" icon={<UserOutlined />} />
              <div>
                <div className="text-slate-400">Last Name</div>
                <div>{data.last_name}</div>
              </div>
            </div>
            <div className="flex space-x-4">
              <Avatar size="large" icon={<EditOutlined />} />
              <div>
                <div className="text-slate-400">Register number</div>
                <div>{data.register_number}</div>
              </div>
            </div>
            <div className="flex space-x-4">
              <Avatar size="large" icon={<BankOutlined />} />
              <div>
                <div className="text-slate-400">Account number</div>
                <div>{data.account_number}</div>
              </div>
            </div>
          </div>
        </>
      )}
      <Drawer
        open={!!openEditBankAccountDrawer}
        onClose={() => {
          setOpenBankAccountDrawer(false);
        }}
        title={`Edit ${accountNumber}`}
      >
        <Form
          initialValues={data ?? {}}
          onFinish={(val) => {
            console.log(val);
            axios
              .post(
                `${process.env.NEXT_PUBLIC_API}/bank/account_profile/${accountNumber}`,
                val
              )
              .then(({ data: { success, result } }) => {
                if (success) {
                  setData(result);
                  message.success("Successfuly");
                }
              })
              .catch((error) => {
                message.error(error.message);
              })
              .finally(() => {
                setLoading(false);
                setOpenBankAccountDrawer(false);
              });
          }}
        >
          <Form.Item
            label="First Name"
            name={"first_name"}
            rules={[{ required: true, message: "Please enter first name" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="Last Name"
            name={"last_name"}
            rules={[{ required: true, message: "Please enter last name" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="Register Number"
            name={"register_number"}
            rules={[
              { required: true, message: "Please enter register number" },
              { min: 10, message: "Min length is 10" },
            ]}
          >
            <Input maxLength={10} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              Submit
            </Button>
          </Form.Item>
        </Form>
      </Drawer>
    </Modal>
  );
};

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
