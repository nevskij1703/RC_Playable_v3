

window.onload = function () {

  const application = window.application;

  application.clickInstall = function () {
    ExitApi.exit();
  }


  application.init();
}