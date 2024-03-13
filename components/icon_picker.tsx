import { contactIcons } from "@/utils/contact_icons";
import { Button, Card, Col, Drawer, Row, Tabs, message, Image } from "antd";
import axios from "axios";
import { useState } from "react";

export default function IconPicker({
  callerId,
  onClose,
  onUpdate,
  isBank = false,
}: {
  callerId?: string | boolean;
  onClose: () => void;
  onUpdate: () => void;
  isBank?: boolean;
}) {
  const [customIcon, setCustomIcon] = useState<string | undefined>();
  const [iconTab, setIconTab] = useState("1");
  const [choosenIcon, setChoosenIcon] = useState<string | undefined>();

  return (
    <Drawer
      open={!!callerId}
      title="Icons"
      onClose={onClose}
      extra={
        <Button
          type="primary"
          onClick={() => {
            console.log(customIcon);
            axios
              .post("../api/uploadCustomImage", {
                caller_id: callerId,
                icon: iconTab === "1" ? undefined : customIcon,
                icon_path: choosenIcon,
                isBank: isBank,
              })
              .then(({ data: { success } }) => {
                if (success) {
                  onUpdate();
                  onClose();
                  message.success("Contact icon updated successfully");
                }
              });
          }}
        >
          Save
        </Button>
      }
    >
      <div className="text-black">
        <Tabs
          defaultActiveKey="1"
          onChange={(val) => {
            setIconTab(val);
          }}
          items={[
            {
              key: "1",
              label: "Default Icons",
              children: (
                <Row gutter={[16, 24]}>
                  {contactIcons.map((icon, index) => (
                    <Col key={index} className={`gutter-row`} span={6}>
                      <Card
                        style={{
                          ...{ cursor: "pointer" },
                          ...(choosenIcon == icon
                            ? { background: "#0090ff1c" }
                            : {}),
                        }}
                        hoverable={true}
                        onClick={() => {
                          setChoosenIcon(icon);
                        }}
                      >
                        <img style={{ width: 20 }} src={icon} />
                      </Card>
                    </Col>
                  ))}
                </Row>
              ),
            },
            {
              key: "2",
              label: "Custom Icons",
              children: (
                <div>
                  <input
                    type="file"
                    onChange={(e) => {
                      const file = e.target.files?.[0];

                      if (file) {
                        const reader = new FileReader();

                        reader.onloadend = () => {
                          setCustomIcon(reader.result?.toString());
                        };

                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                  {customIcon ? (
                    <Image className="pt-8" src={customIcon} />
                  ) : (
                    <></>
                  )}
                </div>
              ),
            },
          ]}
        />
      </div>
    </Drawer>
  );
}
