//LOAD the game, but do not start it until the ad is visible
window.onload = function () {
  window.is_dapi = true;

  (dapi.isReady()) ? onReadyCallback() : dapi.addEventListener("ready", onReadyCallback);
  //here you can put other code that not related to presenting any media information - do not play any audio/video/images at this moment
  //use this to prepare your creative to be shown(i.e. do necessary calculations or pre-loads)
};

function onReadyCallback() {
  //no need to listen to this event anymore
  dapi.removeEventListener("ready", onReadyCallback);

  let isAudioEnabled = !!dapi.getAudioVolume();

  dapi.addEventListener("audioVolumeChange", audioVolumeChangeCallback); //this event is used to get info about any volume state change
  dapi.addEventListener("viewableChange", adVisibleCallback); //this event is used to know when the ad was visible/hidden
  dapi.addEventListener("adResized", adResizeCallback); //this event is used recalculate ad UI items(mostly upon rotation)

  if (dapi.isViewable()) {
    adVisibleCallback({ isViewable: true });
  }
}
function startGame() {
  //start your game here
  //const screenSize = dapi.getScreenSize();
  //(add your own code here)
  const application = window.application;

  application.clickInstall = function () {
    dapi.openStoreUrl();
  };

  if (!application.renderer) {
    application.init().then(() => {
      audioVolumeChangeCallback(dapi.getAudioVolume());
      adResizeCallback(dapi.getScreenSize());
    })
  }
}
/*function pauseGame() {
  //pause your game here(add your own code here)
}*/
function adVisibleCallback(event) {
  //console.log("isViewable " + event.isViewable);
  if (event.isViewable) {
    screenSize = dapi.getScreenSize();
    //START or RESUME the ad (add your own code here)
    startGame(); //example of function that can be called to start game
  } else {
    //PAUSE the ad and MUTE sounds or DO nothing if creative hasnât been launched yet (add your own code here)
    //pauseGame(); //example of function that can be called to pause game
    window.application.sound && window.application.sound.muteAll();
  }
}
function adResizeCallback(event) {
  //  screenSize = event;
  //console.log("ad was resized width " + event.width + " height " + event.height);
  window.application.onResize(event);
}

function audioVolumeChangeCallback(volume) {
  const isAudioEnabled = !!volume;
  const sound = window.application.sound;
  if (isAudioEnabled) {
    sound.unmuteAll(); //START or turn on the sound(add your own code here)
  } else {
    sound.muteAll();//PAUSE the turn off the sound(add your own code here)
  }
}