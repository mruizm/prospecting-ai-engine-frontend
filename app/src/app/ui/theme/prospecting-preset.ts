import { definePreset } from "@primeuix/themes";
import Aura from "@primeuix/themes/aura";

export const ProspectingPreset = definePreset(Aura, {
  primitive: {
    borderRadius: {
      none: "0",
      xs: "3px",
      sm: "5px",
      md: "8px",
      lg: "10px",
      xl: "14px",
    },
  },
  semantic: {
    primary: {
      50: "#eef6ff",
      100: "#d9eaff",
      200: "#bcdcff",
      300: "#8ec7ff",
      400: "#58a7f5",
      500: "#2a78d6",
      600: "#1f63b8",
      700: "#184f95",
      800: "#184477",
      900: "#193b63",
      950: "#102642",
    },
    focusRing: {
      width: "2px",
      style: "solid",
      color: "{primary.color}",
      offset: "2px",
    },
    colorScheme: {
      light: {
        surface: {
          0: "#ffffff",
          50: "#f7f8f6",
          100: "#eef1ee",
          200: "#e4e7e2",
          300: "#d1d6d1",
          400: "#aeb5af",
          500: "#838b85",
          600: "#626a65",
          700: "#4c534f",
          800: "#292e2b",
          900: "#161817",
          950: "#0b0f0e",
        },
      },
      dark: {
        surface: {
          0: "#ffffff",
          50: "#f2f4f2",
          100: "#dfe3df",
          200: "#c3c9c4",
          300: "#9ca59e",
          400: "#747e77",
          500: "#59625c",
          600: "#424945",
          700: "#282c2a",
          800: "#1e2120",
          900: "#161817",
          950: "#0d0e0d",
        },
      },
    },
  },
});
