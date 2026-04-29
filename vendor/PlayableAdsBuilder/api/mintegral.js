

window.onload = function () {

  const application = window.application;
  const sound = application.sound;

  application.clickInstall = function () {
    window.install && window.install();
  }
  application.playableFinished = function () {
    window.gameEnd && window.gameEnd();
  }


  window.gameStart = function () {
    !application.soundMuted && sound.unmuteAll();
  }
  window.gameClose = function () {
    !application.soundMuted && sound.muteAll();
  }


  application.init();

  window.gameReady && window.gameReady();
}