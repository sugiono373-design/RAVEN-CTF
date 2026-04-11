(function () {
  const navbarCollapse = document.getElementById("base-navbars");
  if (!navbarCollapse) return;

  function positionDropdown(event) {
    const dropdownToggle = event.target.closest(".dropdown-toggle");
    if (!dropdownToggle || window.innerWidth < 768) return;

    const dropdownMenu = dropdownToggle.parentElement.querySelector(".dropdown-menu");
    if (!dropdownMenu || !dropdownMenu.classList.contains("dropdown-menu")) return;

    const toggleRect = dropdownToggle.getBoundingClientRect();
    const bottomPosition = window.innerHeight - toggleRect.bottom;

    dropdownMenu.style.top = "auto";
    dropdownMenu.style.bottom = `${bottomPosition}px`;
    dropdownMenu.style.transform = "none";
  }

  function resetDropdownOnMobile() {
    if (window.innerWidth >= 768) return;
    document.querySelectorAll(".navbar.sidebar-nav .dropdown-menu").forEach(menu => {
      menu.style.top = "";
      menu.style.bottom = "";
      menu.style.transform = "";
      menu.style.position = "";
      menu.style.left = "";
    });
  }

  document.querySelectorAll(".navbar.sidebar-nav .dropdown-toggle").forEach(toggle => {
    toggle.addEventListener("click", event => {
      setTimeout(() => positionDropdown(event), 10);
    });
  });

  document.querySelectorAll("#base-navbars .nav-link:not(.dropdown-toggle)").forEach(link => {
    link.addEventListener("click", () => {
      if (window.innerWidth < 768 && navbarCollapse.classList.contains("show")) {
        const bsCollapse = bootstrap.Collapse.getInstance(navbarCollapse);
        if (bsCollapse) bsCollapse.hide();
      }
    });
  });

  window.addEventListener("resize", resetDropdownOnMobile);

  if (window.bootstrap) {
    const tooltipTriggerList = [].slice.call(
      document.querySelectorAll('.navbar.sidebar-nav [data-bs-toggle="tooltip"]'),
    );
    tooltipTriggerList.map(tooltipTriggerEl => {
      return new bootstrap.Tooltip(tooltipTriggerEl, {
        trigger: "hover focus",
        placement: "right",
      });
    });
  }
})();
