const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const HtmlInlineScriptPlugin = require("html-inline-script-webpack-plugin");
const { DefinePlugin } = require("webpack");
const TerserPlugin = require("terser-webpack-plugin");
const { playablePath } = require("./configs/paths");
const games = require("./configs/games");
const { playableNumber, setupAssetsImportFile } = require("./configs/playable");
const buildSettings = require(path.resolve(playablePath, "buildSettings.js"));

module.exports = (env) => {
  const playableTitleKey = env.titleKey,
    playableVersion = env.playableVersion,
    versionBuildSettings = buildSettings[playableVersion][playableTitleKey],
    assetsImportFilePath = path.resolve(
      __dirname,
      "assets_config/assets.import.js",
    );

  setupAssetsImportFile(assetsImportFilePath, versionBuildSettings.assets);

  return {
    mode: "production",
    entry: {
      base_app: ["./src/js/index.js", path.resolve(__dirname, "css/style.css")],
      base_assets_en: {
        dependOn: "base_app",
        import: [
          path.resolve(__dirname, "assets_config/assets.import.js"),
          path.resolve(__dirname, "assets_config/images.en.js"),
        ],
      },
      mraid_api: path.resolve(__dirname, "api/mraid.js"),
    },
    output: {
      filename: "[name].js",
      path: playablePath,
    },
    resolve: {
      alias: {
        config$: versionBuildSettings.configPath,
      },
    },
    optimization: {
      minimize: true,
      minimizer: [
        new TerserPlugin({
          extractComments: false,
          terserOptions: {
            compress: {
              drop_console: true,
            },
            format: {
              comments: false,
            },
          },
        }),
      ],
    },
    plugins: [
      new DefinePlugin({
        IOS_STORE_URL: JSON.stringify(games[playableTitleKey].appStore),
        GOOGLE_PLAY_URL: JSON.stringify(games[playableTitleKey].googlePlay),
        PLAYABLE_PATH: JSON.stringify(playablePath),
        PLAYABLE_NUMBER: JSON.stringify(playableNumber),
        PLAYABLE_TITLE: JSON.stringify(playableTitleKey),
        PLAYABLE_DEFAULT_VERSIONS: JSON.stringify(
          versionBuildSettings.versions,
        ),
      }),
      new HtmlWebpackPlugin({
        filename: "index.html",
        templateParameters: {
          buttonMute: true,
          buttonInstall: false,
          ad_network: "applovin",
          loadStartData: versionBuildSettings.loadStartData,
          playableNumber: JSON.stringify(playableNumber),
        },
        template: path.resolve(__dirname, "templates/base/index.html"),
        inject: "body",
        chunks: ["base_app", "base_assets_en", "mraid_api"],
        minify: {
          html5: true,
          collapseWhitespace: true,
          minifyJS: true,
          removeComments: true,
        },
      }),
      new HtmlInlineScriptPlugin(),
    ],
    module: {
      rules: [
        {
          test: /\.css$/i,
          use: [require.resolve("style-loader"), require.resolve("css-loader")],
        },
        {
          test: /\.(png|jpg|mp3|json|txt)$/,
          type: "asset/inline",
        },
        {
          test: /\.(js)$/,
          exclude: /node_modules/,
          use: {
            loader: require.resolve("babel-loader"),
            options: {
              presets: [
                [require.resolve("@babel/preset-env"), { targets: "defaults" }],
              ],
            },
          },
        },
      ],
    },
  };
};
