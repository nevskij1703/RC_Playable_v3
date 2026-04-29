

window.onload = function () {

  const application = window.application;

  window.is_mraid = true;

  const is_mraid = typeof mraid !== 'undefined';

  function isReady () {
    mraid.removeEventListener('ready', isReady);

    if (mraid.isViewable()) {
      application.init();
    } 

    mraid.addEventListener('viewableChange', viewableChangeHandler);
  }

  function viewableChangeHandler(viewable) {
    const application = window.application;
    const sound = application.sound;
    if (viewable) {
      !application.renderer && application.init();
      !application.soundMuted && sound.unmuteAll();
    } else {
      !application.soundMuted && sound.muteAll();
    }
  }

  if (is_mraid) {
    if (mraid.getState() === 'loading') {
      mraid.addEventListener('ready', isReady);
    } else {
      isReady();
    }
  } else {
    application.init();
  }


  application.clickInstall = function () {
    let link = application.isIOS ? IOS_STORE_URL : GOOGLE_PLAY_URL;

    if (is_mraid) {
      mraid.open(link);
    } else {
      window.open(link, '_blank');
    }
  }

}