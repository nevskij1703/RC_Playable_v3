const path = require("path");
const fs = require("fs");
const { appPath } = require("./paths");

const getSplitAppPath = () => {
  return appPath.split(path.sep);
};

const getPlayableVersion = () => {
  const pathSplit = getSplitAppPath();

  return pathSplit[pathSplit.length - 1];
};
const getPlayableNumber = () => {
  const pathSplit = getSplitAppPath();

  return pathSplit[pathSplit.length - 1];
};

module.exports = {
  playableVersion: getPlayableVersion(),
  playableNumber: getPlayableNumber(),

  setupAssetsImportFile(importFilePath, assetsImport) {
    const { img, sounds, spine, spritesheets } = assetsImport;
    let importContent = "const application = window.application;";

    img.forEach((element) => {
      importContent += `application.importAll( require.context(PLAYABLE_PATH + "/src/img/${element}", true, /.(png|jpg)$/), application.ASSETS_TYPES.images);`;
    });

    sounds &&
      sounds.forEach((element) => {
        importContent += `application.importAll( require.context(PLAYABLE_PATH + "/src/sounds/${element}", true, /\.mp3$/), application.ASSETS_TYPES.sounds);`;
      });

    spine &&
      spine.forEach((element) => {
        importContent += `application.importAll( require.context(PLAYABLE_PATH + "/src/spine/${element}", false, /\.png$/), application.ASSETS_TYPES.images);`;
        importContent += `application.importAll( require.context(PLAYABLE_PATH + "/src/spine/${element}", false, /\.json$/), application.ASSETS_TYPES.spine);`;
        importContent += `application.importAll( require.context(PLAYABLE_PATH + "/src/spine/${element}", false, /\.txt$/), application.ASSETS_TYPES.atlas);`;
      });

    spritesheets &&
      spritesheets.forEach((element) => {
        importContent += `application.importAll( require.context(PLAYABLE_PATH + "/src/spritesheets/${element}", true, /\.png$/), application.ASSETS_TYPES.images);`;
        importContent += `application.importAll( require.context(PLAYABLE_PATH + "/src/spritesheets/${element}", true, /\.json$/), application.ASSETS_TYPES.spritesheets);`;
      });

    fs.writeFileSync(importFilePath, importContent);
  },
};
