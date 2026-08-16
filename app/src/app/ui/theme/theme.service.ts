import { Injectable, signal } from "@angular/core";

export type ThemeChoice = "system" | "light" | "dark";

const STORAGE_KEY = "prospecting-console:theme";

@Injectable({ providedIn: "root" })
export class ThemeService {
  readonly choice = signal<ThemeChoice>(readChoice());
  private readonly media = window.matchMedia("(prefers-color-scheme: dark)");

  constructor() {
    this.apply();
    this.media.addEventListener("change", () => {
      if (this.choice() === "system") this.apply();
    });
  }

  cycle(): void {
    const next: ThemeChoice = this.choice() === "system" ? "light" : this.choice() === "light" ? "dark" : "system";
    this.set(next);
  }

  set(choice: ThemeChoice): void {
    this.choice.set(choice);
    localStorage.setItem(STORAGE_KEY, choice);
    this.apply();
  }

  private apply(): void {
    const dark = this.choice() === "dark" || (this.choice() === "system" && this.media.matches);
    document.documentElement.classList.toggle("app-dark", dark);
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
  }
}

function readChoice(): ThemeChoice {
  const value = localStorage.getItem(STORAGE_KEY);
  return value === "light" || value === "dark" || value === "system" ? value : "system";
}
