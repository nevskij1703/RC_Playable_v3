


window.onload = function () {

  const application = window.application;

  window.is_facebook = true;

  application.clickInstall = function () {
    FbPlayableAd.onCTAClick();
  }


  application.init();
}