import { getPlayerColor } from "@courtviz/themes";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../court-viz-utils";
import { bodyFont, condensedFont } from "../fonts";

type DuelStatRowProps = {
  delay?: number;
  guestLabel: string;
  guestShare: number;
  guestValue: string;
  hostLabel: string;
  hostShare: number;
  hostValue: string;
  title: string;
};

export function DuelStatRow({
  delay = 0,
  guestLabel,
  guestShare,
  guestValue,
  hostLabel,
  hostShare,
  hostValue,
  title,
}: DuelStatRowProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ config: { damping: 200 }, delay, fps, frame });
  const bar = spring({ config: { damping: 200 }, delay: delay + 6, fps, frame });

  const hostColor = getPlayerColor("host", theme);
  const guestColor = getPlayerColor("guest", theme);
  const hostWins = hostShare >= guestShare;
  const total = Math.max(hostShare + guestShare, 0.001);
  const hostPct = (hostShare / total) * 100;
  const guestPct = 100 - hostPct;

  return (
    <div
      style={{
        display: "flex",
        flex: 1,
        flexDirection: "column",
        justifyContent: "center",
        opacity: enter,
        transform: `translateY(${(1 - enter) * 10}px)`,
      }}
    >
      <div
        style={{
          color: theme.inkMuted,
          fontFamily: condensedFont,
          fontSize: 13,
          fontWeight: 600,
          letterSpacing: "0.12em",
          marginBottom: 10,
          textAlign: "center",
          textTransform: "uppercase",
        }}
      >
        {title}
      </div>

      <div style={{ alignItems: "baseline", display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ textAlign: "left" }}>
          <div
            style={{
              color: hostWins ? hostColor : `${hostColor}88`,
              fontFamily: condensedFont,
              fontSize: hostWins ? 44 : 32,
              fontWeight: 700,
            }}
          >
            {hostValue}
          </div>
          <div style={{ color: theme.inkMuted, fontFamily: bodyFont, fontSize: 12 }}>{hostLabel}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div
            style={{
              color: !hostWins ? guestColor : `${guestColor}88`,
              fontFamily: condensedFont,
              fontSize: !hostWins ? 44 : 32,
              fontWeight: 700,
            }}
          >
            {guestValue}
          </div>
          <div style={{ color: theme.inkMuted, fontFamily: bodyFont, fontSize: 12 }}>{guestLabel}</div>
        </div>
      </div>

      <div style={{ height: 14, position: "relative" }}>
        <div
          style={{
            background: `${theme.inkMuted}33`,
            borderRadius: 7,
            height: 14,
            left: "50%",
            position: "absolute",
            top: 0,
            transform: "translateX(-50%)",
            width: 2,
          }}
        />
        <div style={{ display: "flex", height: 14, width: "100%" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              width: "50%",
            }}
          >
            <div
              style={{
                background: hostColor,
                borderRadius: "7px 0 0 7px",
                height: 14,
                transform: `scaleX(${bar * (hostPct / 100)})`,
                transformOrigin: "right",
                width: "100%",
              }}
            />
          </div>
          <div style={{ width: "50%" }}>
            <div
              style={{
                background: guestColor,
                borderRadius: "0 7px 7px 0",
                height: 14,
                transform: `scaleX(${bar * (guestPct / 100)})`,
                transformOrigin: "left",
                width: "100%",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
