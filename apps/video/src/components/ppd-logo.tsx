import { Img, staticFile } from "remotion";

type PpdLogoProps = {
  height?: number;
  width?: number;
};

export function PpdLogo({ height = 48, width = 48 }: PpdLogoProps) {
  return (
    <Img
      src={staticFile("brand/ppd-logo.png")}
      style={{
        height,
        objectFit: "contain",
        width,
      }}
    />
  );
}
