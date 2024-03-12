import { IUserNode } from "@antv/graphin";

export const setEdge = ({
    source,
    target,
    label,
    color,
  }: {
    source: string;
    target: string;
    label?: string;
    color?: string;
  }) => {
    return {
      source: color === 'green' ? target : source,
      target: color === 'green' ? source : target,
      style: {
        
        label: {
          value: label || "",
        },
        ...(color
          ? {
              keyshape: {
                stroke: color,
                ...(color === 'orange' ? {
                  startArrow: {
                    path: 'M 0,0 L 8,4 L 8,-4 Z',
                    fill: color,
                  }
                }:{})
              },
            }
          : {}),
       
      },
    };
  };

export const setNode = ({
    id,
    label,
    icon,
  }: {
    id: string;
    label?: string;
    icon?: string | null;
  }): IUserNode => {
    return {
      id: id,
      style: {
        label: {
          value: label || id,
        },
        icon: {
          type: "image",
          value: icon ?? `../icons/contract.png`,
          size: [17, 17],
          clip: {
            r: 10,
          },
        },
      },
    };
  };