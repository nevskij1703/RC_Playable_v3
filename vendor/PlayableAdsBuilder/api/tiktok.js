
window.onload = function () {

    const application = window.application;
  
    application.clickInstall = function () {
        window.openAppStore();
    }
  
    application.init();
  }