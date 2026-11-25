/* eslint-disable @next/next/no-img-element -- 인라인 SVG 데이터라 next/image 최적화가 필요 없다 */
import { vibeyDataUri, type VibeyLook } from "@/lib/vibey";

type Props = VibeyLook & {
  className?: string;
  alt?: string;
};

export function Vibey({ mood, stage, className, alt = "" }: Props) {
  return (
    <img
      src={vibeyDataUri({ mood, stage })}
      alt={alt}
      draggable={false}
      className={`select-none ${className ?? ""}`}
    />
  );
}
