"use strict";

const path = require("path");
const fs = require("fs");

const playableDirectory = fs.realpathSync(process.cwd());

const resolveApp = (relativePath) =>
  path.resolve(playableDirectory, relativePath);

module.exports = {
  appPath: resolveApp(""),
  appBuildPath: resolveApp("dist"),
  playablePath: playableDirectory,
};
