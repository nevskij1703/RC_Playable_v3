const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const { appBuildPath, playablePath } = require("./configs/paths");
const { DefinePlugin } = require("webpack");
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
    mode: "development",
    /* cache: {
    type: 'filesystem',
  }, */
    entry: [
      "./src/js/index.dev.js",
      path.resolve(__dirname, "api/dev.js"),
      path.resolve(__dirname, "css/style.css"),

      //path.resolve(__dirname, "assets_config/assets.base.js"),
      path.resolve(__dirname, "assets_config/assets.import.js"),
      path.resolve(__dirname, "assets_config/images.en.js"),

      "../../common/devMode/DevController.js",
    ],
    devtool: "inline-source-map",
    devServer: {
      static: "./dist",
      hot: true,
      port: 8080,
    },
    output: {
      filename: "bundle.js",
      path: appBuildPath,
    },
    resolve: {
      alias: {
        config$: versionBuildSettings.configPath,
      },
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
        /*BASE_IMAGE_PATH: JSON.stringify('../img/base'), // заменяет
      APP_PATH: JSON.stringify(appPath),
      BUILDER_PATH: JSON.stringify(__dirname)*/
      }),

      /*new webpack.ContextReplacementPlugin(
      "base",
      "../../img/base"
    ),*/

      new HtmlWebpackPlugin({
        filename: "index.html",
        templateParameters: {
          buttonMute: true,
          buttonInstall: true,
          is_adwords: false,
          ad_network: "dev",
          loadStartData: versionBuildSettings.loadStartData,
          playableNumber: JSON.stringify(playableNumber),
        },
        cache: true,
        template: path.resolve(__dirname, "templates/dev/index.html"),
        inject: "body",
      }),
      new HtmlWebpackPlugin({
        filename: "adwords.html",
        templateParameters: {
          buttonMute: true,
          buttonInstall: false,
          is_adwords: true,
          ad_network: "dev",
          loadStartData: versionBuildSettings.loadStartData,
          playableNumber: JSON.stringify(playableNumber),
        },
        cache: true,
        template: path.resolve(__dirname, "templates/dev/index.html"),
        inject: "body",
      }),
      //new webpack.DefinePlugin({
      //BASE_IMAGES: JSON.stringify(['../../img/base', true, /\.(png|jpg)$/])
      /*PRODUCTION: JSON.stringify(true),
      VERSION: JSON.stringify('5fa3b9'),
      BROWSER_SUPPORTS_HTML5: true,
      TWO: '1+1',*/
      /*      'typeof window': JSON.stringify('object'),
      'process.env': {
        NODE_ENV: JSON.stringify(process.env.NODE_ENV)
      },*/
      //})
    ],
    module: {
      rules: [
        {
          test: /\.css$/i,
          use: [require.resolve("style-loader"), require.resolve("css-loader")],
        },
        {
          test: /\.(png|jpg|mp3|json|txt)$/,
          //exclude: /node_modules/,
          type: "asset/inline",
        },
      ],
    },
  };
};
