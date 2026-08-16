import { provideAnimationsAsync } from "@angular/platform-browser/animations/async";
import { provideZonelessChangeDetection } from "@angular/core";
import { bootstrapApplication } from "@angular/platform-browser";
import { provideRouter } from "@angular/router";
import { MessageService } from "primeng/api";
import { providePrimeNG } from "primeng/config";
import { AppComponent } from "./app/app.component";
import { routes } from "./app/app.routes";
import { ProspectingPreset } from "./app/ui/theme/prospecting-preset";

bootstrapApplication(AppComponent, {
  providers: [
    provideZonelessChangeDetection(),
    provideAnimationsAsync(),
    provideRouter(routes),
    providePrimeNG({
      ripple: true,
      theme: {
        preset: ProspectingPreset,
        options: {
          darkModeSelector: ".app-dark",
          cssLayer: { name: "primeng", order: "reset, primeng, app" },
        },
      },
    }),
    MessageService,
  ],
}).catch((error: unknown) => console.error(error));
