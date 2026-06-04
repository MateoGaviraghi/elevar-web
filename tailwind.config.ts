import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: { 50:"#FEF3EF",100:"#FDDDD4",200:"#FAB99E",300:"#F79268",400:"#F37040",500:"#E94E1B",600:"#C43E12",700:"#9A2F0C",800:"#6F2009",900:"#451305" },
        ink: { 600:"#1A3247",700:"#112130",800:"#0B2C3D",900:"#0B1E33" },
        neutral: { 0:"#FFFFFF",50:"#F9F8FB",200:"#E5EAEE",500:"#929292",700:"#706F6F",900:"#333333" },
        status: { success:"#1E7E4A",warning:"#C47D0E",error:"#B91C1C",info:"#1D4ED8" },
      },
      fontFamily: {
        display: ["var(--font-dm-sans)","ui-sans-serif","system-ui","sans-serif"],
        sans: ["var(--font-inter)","ui-sans-serif","system-ui","sans-serif"],
      },
      fontSize: {
        xs:["0.75rem",{lineHeight:"1.5"}], sm:["0.875rem",{lineHeight:"1.5"}], base:["1rem",{lineHeight:"1.7"}],
        lg:["1.125rem",{lineHeight:"1.7"}], xl:["1.25rem",{lineHeight:"1.5"}], "2xl":["1.5rem",{lineHeight:"1.35"}],
        "3xl":["1.875rem",{lineHeight:"1.25"}], "4xl":["2.25rem",{lineHeight:"1.15"}], "5xl":["3rem",{lineHeight:"1.05"}],
        "6xl":["3.75rem",{lineHeight:"1.0"}], "7xl":["4.5rem",{lineHeight:"0.98"}], "8xl":["6rem",{lineHeight:"0.95"}],
      },
      letterSpacing: { tighter:"-0.04em", tight:"-0.02em", normal:"0", wide:"0.04em", wider:"0.08em", widest:"0.18em" },
      // Minimalist: near-square corners everywhere; pills only via `full`.
      borderRadius: { none:"0", sm:"2px", DEFAULT:"2px", md:"2px", lg:"3px", xl:"4px", "2xl":"6px", full:"9999px" },
      // Soft, low shadows — we lean on hairline borders, not chunky elevation.
      boxShadow: {
        sm:"0 1px 2px rgba(11,30,51,0.05)",
        md:"0 10px 30px -14px rgba(11,30,51,0.16)",
        lg:"0 24px 60px -24px rgba(11,30,51,0.20)",
      },
      maxWidth: { "screen-xl": "1280px" },
    },
  },
  plugins: [],
};
export default config;
