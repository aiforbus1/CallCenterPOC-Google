import { staticFile } from "remotion";
import { loadFont as loadCairoFont } from "@remotion/google-fonts/Cairo";
import { loadFont as loadTajawalFont } from "@remotion/google-fonts/Tajawal";

/**
 * Arabic Font loader with offline local fallback.
 * Uses @remotion/google-fonts and local bundled woff2 fonts from public/assets/fonts.
 */

// Initialize Remotion Google Fonts loader
export const cairoLoader = loadCairoFont("normal", {
  weights: ["400", "600", "700", "800"],
  subsets: ["arabic", "latin"],
});

export const tajawalLoader = loadTajawalFont("normal", {
  weights: ["400", "500", "700"],
  subsets: ["arabic", "latin"],
});

export const fontFamilies = {
  heading: `${cairoLoader.fontFamily}, 'Cairo', 'Segoe UI', Tahoma, sans-serif`,
  body: `${tajawalLoader.fontFamily}, 'Tajawal', 'Segoe UI', Arial, sans-serif`,
};

/**
 * Returns CSS @font-face style string referencing local bundled woff2 files in public/assets/fonts
 * to ensure 100% offline rendering capability without network requests.
 */
export const getOfflineFontFaceStyles = (): string => `
@font-face {
  font-family: 'Cairo';
  font-style: normal;
  font-weight: 400;
  src: url('${staticFile("assets/fonts/Cairo-400-arabic.woff2")}') format('woff2');
  unicode-range: U+0600-06FF, U+0750-077F, U+0870-0891, U+0897-08E1, U+08E3-08FF, U+FB50-FDFF, U+FE70-FEFC;
}
@font-face {
  font-family: 'Cairo';
  font-style: normal;
  font-weight: 700;
  src: url('${staticFile("assets/fonts/Cairo-700-arabic.woff2")}') format('woff2');
  unicode-range: U+0600-06FF, U+0750-077F, U+0870-0891, U+0897-08E1, U+08E3-08FF, U+FB50-FDFF, U+FE70-FEFC;
}
@font-face {
  font-family: 'Cairo';
  font-style: normal;
  font-weight: 800;
  src: url('${staticFile("assets/fonts/Cairo-800-arabic.woff2")}') format('woff2');
  unicode-range: U+0600-06FF, U+0750-077F, U+0870-0891, U+0897-08E1, U+08E3-08FF, U+FB50-FDFF, U+FE70-FEFC;
}
@font-face {
  font-family: 'Tajawal';
  font-style: normal;
  font-weight: 400;
  src: url('${staticFile("assets/fonts/Tajawal-400-arabic.woff2")}') format('woff2');
  unicode-range: U+0600-06FF, U+0750-077F, U+0870-0891, U+0897-08E1, U+08E3-08FF, U+FB50-FDFF, U+FE70-FEFC;
}
@font-face {
  font-family: 'Tajawal';
  font-style: normal;
  font-weight: 500;
  src: url('${staticFile("assets/fonts/Tajawal-500-arabic.woff2")}') format('woff2');
  unicode-range: U+0600-06FF, U+0750-077F, U+0870-0891, U+0897-08E1, U+08E3-08FF, U+FB50-FDFF, U+FE70-FEFC;
}
@font-face {
  font-family: 'Tajawal';
  font-style: normal;
  font-weight: 700;
  src: url('${staticFile("assets/fonts/Tajawal-700-arabic.woff2")}') format('woff2');
  unicode-range: U+0600-06FF, U+0750-077F, U+0870-0891, U+0897-08E1, U+08E3-08FF, U+FB50-FDFF, U+FE70-FEFC;
}
`;
