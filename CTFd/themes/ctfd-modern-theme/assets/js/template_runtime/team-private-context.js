var teamPrivateConfigNode = document.getElementById("team-private-config");
if (teamPrivateConfigNode) {
  var teamPrivateConfig = JSON.parse(teamPrivateConfigNode.textContent || "{}");
  window.stats_data = teamPrivateConfig.stats_data;
  window.team_captain = teamPrivateConfig.team_captain;
}
