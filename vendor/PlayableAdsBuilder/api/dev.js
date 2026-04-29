


window.onload = function () {

  const application = window.application;

  console.log('dev build onload')
  console.log(application)


  application.firstUserAction = function () {
    logSystem('firstUserAction');
  };

  application.playableFinished = function () {
    logSystem('playableFinished');
  };

  application.clickInstall = function () {
    application.isIOS ? window.open(IOS_STORE_URL) : window.open(GOOGLE_PLAY_URL, '_blank');
  }

  application.eventEmitter.once('playableStart', () => {
    window.dev && (application.devController = new window.dev.CLASSES.DevController());// подключение dev-логики
  });

  application.init();

  // Здесь могла бы быть Ваша аналитика

}

const LOG_STYLES = {
  system: 'color:#000000; background: #ffcc99',
  analytics: 'color:#000000; background: #99ccff',
  default: '',
};

function logSystem(msg) {
  console.log('%csystem%c %s', LOG_STYLES.system, LOG_STYLES.default, msg);
}

function logAnalytics(msg) {
  console.log('%canalytics%c %s', LOG_STYLES.analytics, LOG_STYLES.default, msg);
}