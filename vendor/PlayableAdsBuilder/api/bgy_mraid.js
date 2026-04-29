window.onload = function () {
  const application = window.application;

  window.is_bgy_mraid = true;

  application.playableFinished = function () {
    window.BGY_MRAID && window.BGY_MRAID.gameEnd();
  };

  application.clickInstall = function () {
    window.BGY_MRAID && window.BGY_MRAID.open();
  };

  application.init().then(() => window.BGY_MRAID && window.BGY_MRAID.gameReady());
};
