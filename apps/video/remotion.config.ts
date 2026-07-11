import { Config } from "@remotion/cli/config";

// PNG intermediates + bt709 limited range — avoids QuickTime showing a blank navy frame
Config.setVideoImageFormat("png");
Config.setPixelFormat("yuv420p");
Config.setColorSpace("bt709");
Config.setOverwriteOutput(true);
Config.overrideFfmpegCommand(({ args }) => {
  const colorFlags = ["-color_primaries", "bt709", "-color_trc", "bt709", "-colorspace", "bt709"];
  const outputIndex = args.findIndex((arg) => typeof arg === "string" && arg.endsWith(".mp4"));
  if (outputIndex === -1) return args;
  return [...args.slice(0, outputIndex), ...colorFlags, ...args.slice(outputIndex)];
});
