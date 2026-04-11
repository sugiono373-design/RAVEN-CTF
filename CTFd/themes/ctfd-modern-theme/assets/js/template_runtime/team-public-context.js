var teamPublicConfigNode = document.getElementById("team-public-config");
if (teamPublicConfigNode) {
  var teamPublicConfig = JSON.parse(teamPublicConfigNode.textContent || "{}");
  window.TEAM = teamPublicConfig.team;
}
