import localFont from "next/font/local";

/** Display + interface typeface. Variable: weight 200-800, optical size auto. */
export const fontSans = localFont({
  src: "./fonts/bricolage-grotesque.woff2",
  variable: "--font-sans-loaded",
  weight: "200 800",
  display: "swap",
});

/** Reading typeface for descriptions and editorial copy. */
export const fontSerif = localFont({
  src: [
    { path: "./fonts/newsreader.woff2", style: "normal" },
    { path: "./fonts/newsreader-italic.woff2", style: "italic" },
  ],
  variable: "--font-serif-loaded",
  weight: "200 800",
  display: "swap",
});
