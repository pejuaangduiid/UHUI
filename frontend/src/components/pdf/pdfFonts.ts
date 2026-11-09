import { Font } from "@react-pdf/renderer";

export function registerLocalPdfFonts() {
  
  Font.registerHyphenationCallback((word) => [word]);
}

