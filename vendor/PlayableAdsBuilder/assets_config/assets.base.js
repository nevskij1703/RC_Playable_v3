const application = window.application;

application.importAll(
  require.context(`${PLAYABLE_PATH}/src/img/base`, true, /\.(png|jpg)$/),
  application.ASSETS_TYPES.images,
);
application.importAll(
  require.context(`${PLAYABLE_PATH}/src/spritesheets`, false, /\.png$/),
  application.ASSETS_TYPES.images,
);
application.importAll(
  require.context(`${PLAYABLE_PATH}/src/spine`, false, /\.png$/),
  application.ASSETS_TYPES.images,
);
application.importAll(
  require.context(`${PLAYABLE_PATH}/src/spritesheets`, false, /\.json$/),
  application.ASSETS_TYPES.spritesheets,
);
application.importAll(
  require.context(`${PLAYABLE_PATH}/src/spine`, false, /\.json$/),
  application.ASSETS_TYPES.spine,
);
application.importAll(
  require.context(`${PLAYABLE_PATH}/src/spine`, false, /\.txt$/),
  application.ASSETS_TYPES.atlas,
);

application.importAll(
  require.context(`${PLAYABLE_PATH}/src/sounds`, true, /\.mp3$/),
  application.ASSETS_TYPES.sounds,
);
