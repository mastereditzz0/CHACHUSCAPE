import type { Metadata } from "next";
import {
  Geist,
  Geist_Mono,
  Plus_Jakarta_Sans,
  JetBrains_Mono,
  Fraunces,
} from "next/font/google";
import CustomCursor from "@/components/CustomCursor";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/* body / UI font — nav, buttons, paragraphs, forms */
const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

/* HUD micro-labels / meta / tags */
const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

/* the italic serif word in the studio's generating scene */
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "ChachuScape — AI Image Generator",
  description:
    "ChachuScape turns a single sentence into cinematic, gallery-ready artwork with a state-of-the-art diffusion engine.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${jakarta.variable} ${jetbrains.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <CustomCursor />
        {children}
      </body>
    </html>
  );
}
