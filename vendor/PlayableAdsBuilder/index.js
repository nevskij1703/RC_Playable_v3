#!/usr/bin/env node
"use strict";

const spawn = require("cross-spawn");

process.on("unhandledRejection", (err) => {
  throw err;
});

const SCRIPTS = {
  start: "start",
  build: "build",
};

const args = process.argv.slice(2);
const scriptName = args.shift();

const playableVersion = args.shift(),
  playableTitleKey = args.shift().toUpperCase();

if (SCRIPTS[scriptName]) {
  let result;
  if (scriptName === SCRIPTS.start) {
    result = spawn.sync(
      "webpack",
      [
        "serve",
        "--open",
        "--config",
        require.resolve("./webpack.config.dev.js"),
        "--env",
        `titleKey=${playableTitleKey}`,
        `playableVersion=${playableVersion}`,
      ],
      { stdio: "inherit" },
    );
  } else if (scriptName === SCRIPTS.build) {
    result = spawn.sync(
      "webpack",
      [
        "--config",
        require.resolve("./webpack.config.prod.js"),
        "--env",
        `titleKey=${playableTitleKey}`,
        `playableVersion=${playableVersion}`,
      ],
      { stdio: "inherit" },
    );
  }
  if (result.error) {
    console.error("Failed to spawn webpack:", result.error.message);
    process.exit(1);
  }
  if (typeof result.status === "number" && result.status !== 0) {
    process.exit(result.status);
  }
} else {
  console.log('Unknown script "' + scriptName + '".');
  process.exit(1);
}
