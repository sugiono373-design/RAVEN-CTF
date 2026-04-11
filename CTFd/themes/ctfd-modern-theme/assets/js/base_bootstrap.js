function readJsonTemplate(id) {
  const el = document.getElementById(id);
  if (!el) return null;
  try {
    return JSON.parse(el.textContent || "{}");
  } catch (_e) {
    return null;
  }
}

const initData = readJsonTemplate("ctfd-init-data");
if (initData) {
  window.init = initData;
}
