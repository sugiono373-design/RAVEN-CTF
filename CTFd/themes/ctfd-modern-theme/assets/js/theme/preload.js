// Apply preferred theme as early as possible.
(function () {
  const preferred =
    localStorage.getItem("theme") ||
    (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  document.documentElement.setAttribute("data-bs-theme", preferred);
})();
