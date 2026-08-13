import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("png");
Config.setPixelFormat("yuv420p");
Config.setColorSpace("bt709");
Config.setCrf(18);
Config.setOverwriteOutput(true);
Config.overrideFfmpegCommand(({ args }) => {
  const colorFlags = ["-color_primaries", "bt709", "-color_trc", "bt709", "-colorspace", "bt709"];
  const outputIndex = args.findIndex((arg) => typeof arg === "string" && arg.endsWith(".mp4"));
  if (outputIndex === -1) return args;
  return [...args.slice(0, outputIndex), ...colorFlags, ...args.slice(outputIndex)];
});
Config.overrideWebpackConfig((webpackConfig) => {
  return {
    ...webpackConfig,
    resolve: {
      ...webpackConfig.resolve,
      fallback: {
        ...webpackConfig.resolve?.fallback,
        path: false,
        url: false,
      },
    },
  };
});
