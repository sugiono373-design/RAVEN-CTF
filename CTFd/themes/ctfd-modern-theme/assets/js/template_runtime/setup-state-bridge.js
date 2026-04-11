var STATE = null;
var setupConfigNode = document.getElementById("setup-config");
if (setupConfigNode) {
  var setupConfig = JSON.parse(setupConfigNode.textContent || "{}");
  STATE = setupConfig.state || null;
}
window.STATE = STATE;
