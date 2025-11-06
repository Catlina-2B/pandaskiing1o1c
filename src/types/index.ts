import { SVGProps } from "react";

export type IconSvgProps = SVGProps<SVGSVGElement> & {
  size?: number;
};

// 重新导出 subgraph 类型以便其他地方使用
export * from './subgraph';
