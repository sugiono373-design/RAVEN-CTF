export function registerCommonAlpineStates(Alpine) {
  Alpine.data("ImageFallbackState", () => ({
    hasError: false,
  }));
}
