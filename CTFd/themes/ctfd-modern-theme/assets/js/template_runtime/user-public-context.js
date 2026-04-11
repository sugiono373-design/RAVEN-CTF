var userPublicConfigNode = document.getElementById("user-public-config");
if (userPublicConfigNode) {
  var userPublicConfig = JSON.parse(userPublicConfigNode.textContent || "{}");
  window.USER = userPublicConfig.user;
}
