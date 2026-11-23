import { Config } from "@remotion/cli/config";

Config.setRspack(true);
Config.overrideRspackConfig((current) => {
  return {
    ...current,
    resolve: {
      ...current.resolve,
      fallback: {
        ...current.resolve?.fallback,
        os: false,
        fs: false,
        path: false,
      },
    },
  };
});

Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
Config.setDefaultPremountInSeconds(2);
