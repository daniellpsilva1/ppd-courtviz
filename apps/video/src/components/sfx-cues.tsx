import { Audio, Sequence, staticFile } from "remotion";

type SfxProps = {
  delay?: number;
  volume?: number;
};

export function SFXWhoosh({ delay = 0, volume = 0.35 }: SfxProps) {
  return (
    <Sequence from={delay} layout="none">
      <Audio src={staticFile("audio/whoosh.mp3")} volume={volume} />
    </Sequence>
  );
}

export function SFXTick({ delay = 0, volume = 0.28 }: SfxProps) {
  return (
    <Sequence from={delay} layout="none">
      <Audio src={staticFile("audio/tick.mp3")} volume={volume} />
    </Sequence>
  );
}

export function SFXImpact({ delay = 0, volume = 0.4 }: SfxProps) {
  return (
    <Sequence from={delay} layout="none">
      <Audio src={staticFile("audio/impact.mp3")} volume={volume} />
    </Sequence>
  );
}
