import type { Metadata } from "next";
import { Inter, Fira_Code } from "next/font/google"; // As per your prompt's legacyStyle
import "./globals.css";
import { AppProvider } from "@/contexts/AppContext"; // Import AppProvider

// Font configuration based on your prompt's legacyStyle
const inter = Inter({
  subsets: ["latin"],
  variable: '--font-inter' // CSS variable for Inter
});

const firaCode = Fira_Code({
  subsets: ["latin"],
  weight: ["400", "700"], // Specify weights if needed
  variable: '--font-fira-code' // CSS variable for Fira Code
});

export const metadata: Metadata = {
  title: "NEXUS-IMAGE TRANSLATOR", // Project Name
  description: "AI打底 + 人工精修 - Professional Image Translation Tool", // Mission
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      {/* Apply font variables to the body */}
      <body className={`${inter.variable} ${firaCode.variable} font-sans bg-gray-950 text-gray-200`}>
        {/* Base styles from existing project: bg-gray-950 text-gray-200 */}
        <AppProvider> {/* Wrap children with AppProvider */}
          {children}
        </AppProvider>
      </body>
    </html>
  );
}

// Note for globals.css update (will be done if necessary in a separate step):
// To fully apply these fonts as primary and mono throughout Tailwind:
// 1. In tailwind.config.ts:
//    theme: {
//      extend: {
//        fontFamily: {
//          sans: ['var(--font-inter)', 'sans-serif'], // or just 'var(--font-inter)' + system UI fallbacks
//          mono: ['var(--font-fira-code)', 'monospace'], // or just 'var(--font-fira-code)' + system UI fallbacks
//        },
//      },
//    },
// This makes `font-sans` and `font-mono` utility classes use your chosen fonts.
// The current `font-sans` in `<body>` will use Tailwind's default sans-serif stack
// unless `tailwind.config.ts` is updated as above.
// The CSS variables are available globally for manual use if needed.
// The body background and text color are set to match the existing project's `globals.css`.
// (bg-gray-950, text-gray-200)
// This was identified from reading `src/app/globals.css` in the original project.
// Original: background-color: #0a0a0a; /* 对应bg-gray-950 */ color: #e5e5e5; /* 对应text-gray-200 */
