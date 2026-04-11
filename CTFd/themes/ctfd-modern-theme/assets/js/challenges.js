import Alpine from "alpinejs";
import dayjs from "dayjs";

import CTFd from "./index";
import "./template_runtime/challenges-activity-feed";
import { registerCommonAlpineStates } from "./components/alpine-states";

import { Modal, Tab, Tooltip } from "bootstrap";
import highlight from "./theme/highlight";

function addTargetBlank(html) {
  let dom = new DOMParser();
  let view = dom.parseFromString(html, "text/html");
  let links = view.querySelectorAll('a[href*="://"]');
  links.forEach(link => {
    link.setAttribute("target", "_blank");
  });
  return view.documentElement.outerHTML;
}

window.Alpine = Alpine;
registerCommonAlpineStates(Alpine);

Alpine.store("challenge", {
  data: {
    view: "",
  },
});

Alpine.data("Hint", () => ({
  id: null,
  html: null,

  async showHint(event) {
    if (event.target.open) {
      let response = await CTFd.pages.challenge.loadHint(this.id);
      let hint = response.data;
      if (hint.content) {
        this.html = addTargetBlank(hint.html);
      } else {
        let answer = await CTFd.pages.challenge.displayUnlock(this.id);
        if (answer) {
          let unlock = await CTFd.pages.challenge.loadUnlock(this.id);

          if (unlock.success) {
            let response = await CTFd.pages.challenge.loadHint(this.id);
            let hint = response.data;
            this.html = addTargetBlank(hint.html);
          } else {
            event.target.open = false;
            CTFd._functions.challenge.displayUnlockError(unlock);
          }
        } else {
          event.target.open = false;
        }
      }
    }
  },
}));

Alpine.data("Challenge", () => ({
  id: null,
  next_id: null,
  submission: "",
  tab: null,
  solves: [],
  response: null,
  share_url: null,
  isSubmitting: false,
  submitResult: null,
  showSolvesTab: false,

  async init() {
    highlight();
  },

  getStyles() {
    let styles = {
      "modal-dialog": true,
    };
    try {
      let size = CTFd.config.themeSettings.challenge_window_size;
      switch (size) {
        case "sm":
          styles["modal-sm"] = true;
          break;
        case "lg":
          styles["modal-lg"] = true;
          break;
        case "xl":
          styles["modal-xl"] = true;
          break;
        default:
          break;
      }
    } catch (error) {
      console.log("Error processing challenge_window_size");
      console.log(error);
    }
    return styles;
  },

  async showChallenge() {
    this.showSolvesTab = false;
    new Tab(this.$el).show();
  },

  async showSolves() {
    this.solves = await CTFd.pages.challenge.loadSolves(this.id);
    this.solves.forEach(solve => {
      solve.date = dayjs(solve.date).format("MMMM Do, h:mm:ss A");
      return solve;
    });
    new Tab(this.$el).show();
  },

  async toggleSolves() {
    if (!this.showSolvesTab) {
      this.solves = await CTFd.pages.challenge.loadSolves(this.id);
      this.solves.forEach(solve => {
        solve.date = dayjs(solve.date).format("MMMM Do, h:mm:ss A");
        return solve;
      });
    }
    this.showSolvesTab = !this.showSolvesTab;
  },

  getNextId() {
    let data = Alpine.store("challenge").data;
    return data.next_id;
  },

  async nextChallenge() {
    let modal = Modal.getOrCreateInstance("[x-ref='challengeWindow']");

    modal._element.addEventListener(
      "hidden.bs.modal",
      event => {
        Alpine.nextTick(() => {
          this.$dispatch("load-challenge", this.getNextId());
        });
      },
      { once: true },
    );
    modal.hide();
  },

  async getShareUrl() {
    let body = {
      type: "solve",
      challenge_id: this.id,
    };
    const response = await CTFd.fetch("/api/v1/shares", {
      method: "POST",
      body: JSON.stringify(body),
    });
    const data = await response.json();
    const url = data["data"]["url"];
    this.share_url = url;
  },

  copyShareUrl() {
    navigator.clipboard.writeText(this.share_url);
    let t = Tooltip.getOrCreateInstance(this.$el);
    t.enable();
    t.show();
    setTimeout(() => {
      t.hide();
      t.disable();
    }, 2000);
  },

  async submitChallenge() {
    this.response = await CTFd.pages.challenge.submitChallenge(
      this.id,
      this.submission,
    );

    await this.renderSubmissionResponse();
  },

  async submitChallengeWithEffect() {
    if (!this.submission || this.isSubmitting) return;

    this.isSubmitting = true;
    this.submitResult = null;
    this.response = null;

    try {
      this.response = await CTFd.pages.challenge.submitChallenge(
        this.id,
        this.submission,
      );

      this.isSubmitting = false;

      if (this.response.data.status === "correct") {
        this.submitResult = "correct";
      } else if (this.response.data.status === "already_solved") {
        this.submitResult = "already";
      } else {
        this.submitResult = "incorrect";
      }

      setTimeout(() => {
        this.submitResult = null;
      }, 2000);

      await this.renderSubmissionResponse();
    } catch (error) {
      this.isSubmitting = false;
      this.submitResult = "incorrect";
      setTimeout(() => {
        this.submitResult = null;
      }, 2000);
      console.error("Submit error:", error);
    }
  },

  async renderSubmissionResponse() {
    if (this.response.data.status === "correct") {
      this.submission = "";
    }

    this.$dispatch("load-challenges");
  },
}));

const createChallengeBoard = () => ({
  loaded: false,
  challenges: [],
  challenge: null,

  async init() {
    this.challenges = await CTFd.pages.challenges.getChallenges();
    this.loaded = true;

    if (window.location.hash) {
      let chalHash = decodeURIComponent(window.location.hash.substring(1));
      let idx = chalHash.lastIndexOf("-");
      if (idx >= 0) {
        let pieces = [chalHash.slice(0, idx), chalHash.slice(idx + 1)];
        let id = pieces[1];
        await this.loadChallenge(id);
      }
    }
  },

  getCategories() {
    const categories = [];

    this.challenges.forEach(challenge => {
      const { category } = challenge;

      if (!categories.includes(category)) {
        categories.push(category);
      }
    });

    try {
      const f = CTFd.config.themeSettings.challenge_category_order;
      if (f && typeof f === "string" && f.trim().startsWith("(")) {
        const getSort = new Function(`"use strict"; return (${f})`);
        categories.sort(getSort());
      }
    } catch (error) {
    }

    return categories;
  },

  getChallenges(category) {
    let challenges = this.challenges;

    if (category !== null) {
      challenges = this.challenges.filter(challenge => challenge.category === category);
    }

    try {
      const f = CTFd.config.themeSettings.challenge_order;
      if (f && typeof f === "string" && f.trim().startsWith("(")) {
        const getSort = new Function(`"use strict"; return (${f})`);
        challenges.sort(getSort());
      }
    } catch (error) {
      // Challenge order function error silently handled
    }

    return challenges;
  },

  async loadChallenges() {
    this.challenges = await CTFd.pages.challenges.getChallenges();
  },

  async loadChallenge(challengeId) {
    await CTFd.pages.challenge.displayChallenge(challengeId, challenge => {
      challenge.data.view = addTargetBlank(challenge.data.view);
      Alpine.store("challenge").data = challenge.data;

      Alpine.nextTick(() => {
        let modal = Modal.getOrCreateInstance("[x-ref='challengeWindow']");
        modal._element.addEventListener(
          "hidden.bs.modal",
          event => {
            history.replaceState(null, null, " ");
          },
          { once: true },
        );
        modal.show();
        history.replaceState(null, null, `#${challenge.data.name}-${challengeId}`);
      });
    });
  },
});

Alpine.data("ChallengeBoard", createChallengeBoard);

const CHALLENGE_CATEGORY_ICONS = {
  web: "fas fa-globe",
  crypto: "fas fa-lock",
  pwn: "fas fa-bug",
  reverse: "fas fa-cogs",
  forensics: "fas fa-search",
  misc: "fas fa-puzzle-piece",
  binary: "fas fa-file-code",
  steganography: "fas fa-eye",
  osint: "fas fa-satellite",
  network: "fas fa-network-wired",
  mobile: "fas fa-mobile-alt",
  blockchain: "fas fa-link",
  ai: "fas fa-robot",
  iot: "fas fa-microchip",
  hardware: "fas fa-microchip",
  ppc: "fas fa-code",
  pentest: "fas fa-user-secret",
  redteam: "fas fa-user-secret",
};

const CHALLENGE_CATEGORY_COLORS = {
  web: "#329af1",
  crypto: "#845ef7",
  pwn: "#ff6b6b",
  reverse: "#fdc419",
  forensics: "#5473e1",
  misc: "#20c897",
  binary: "#17a2b8",
  osint: "#ff922b",
  network: "#34C759",
  mobile: "#f16594",
  blockchain: "#50cf66",
  hardware: "#d1d0d1",
  ai: "#94d82c",
  pentest: "#cd5de8",
  redteam: "#cd5de8",
  ppc: "#9C27B0",
};

Alpine.data("ChallengesPage", () => ({
  ...createChallengeBoard(),
  selectedCategory: null,
  hideSolved: false,

  filterChallenges() {
    // Trigger Alpine update when hideSolved changes.
  },

  getVisibleChallenges(category) {
    let challenges = this.getSortedChallenges(category);
    if (this.hideSolved) {
      challenges = challenges.filter(c => !c.solved_by_me);
    }
    return challenges;
  },

  getFilteredCategories() {
    if (this.selectedCategory) {
      return [this.selectedCategory];
    }
    return this.getCategories();
  },

  getTotalChallenges() {
    if (!this.loaded || !this.challenges) return 0;
    return this.challenges.length;
  },

  getCategoryIcon(category) {
    const key = category.toLowerCase();
    return CHALLENGE_CATEGORY_ICONS[key] || "fas fa-folder";
  },

  getCategoryColor(category) {
    const key = category.toLowerCase();
    return CHALLENGE_CATEGORY_COLORS[key] || "#329af1";
  },

  getCategoryBadgeStyle(category) {
    const color = this.getCategoryColor(category);
    return `background: ${color}20; color: ${color}; border: 1px solid ${color}40;`;
  },

  getDifficultyFromTags(tags) {
    if (!tags || tags.length === 0) return "medium";
    const tag = tags[0]?.value?.toLowerCase() || "";
    if (tag.includes("easy")) return "easy";
    if (tag.includes("hard")) return "hard";
    return "medium";
  },

  getSortedChallenges(category) {
    const challenges = this.getChallenges(category);
    return challenges.sort((a, b) => a.value - b.value);
  },
}));

Alpine.data("MatrixRain", () => ({
  columns: Array.from({ length: 8 + Math.floor(Math.random() * 5) }, () => ({
    left: (5 + Math.random() * 90).toFixed(1),
    delay: (Math.random() * 3).toFixed(2),
    speed: (2 + Math.random() * 2.5).toFixed(2),
  })),
}));

Alpine.start();
