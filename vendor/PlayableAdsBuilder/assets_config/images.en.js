const application = window.application;

application.importAll(
  require.context(`${PLAYABLE_PATH}/src/img/lang/en`, false, /\.(png|jpg)$/),
  application.ASSETS_TYPES.images
);