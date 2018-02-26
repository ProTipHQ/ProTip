$(function(){
  if(!localStorage['proTipInstalled']) {
      window.location.replace("install.html");
  }

  allowExternalLinks();
});
