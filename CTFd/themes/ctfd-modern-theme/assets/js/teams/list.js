import Alpine from "alpinejs";
import CTFd from "../index";
import { registerCommonAlpineStates } from "../components/alpine-states";

window.CTFd = CTFd;
window.Alpine = Alpine;
registerCommonAlpineStates(Alpine);

Alpine.start();
