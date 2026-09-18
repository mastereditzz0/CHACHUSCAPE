import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dream Studio — ChachuScape",
  description:
    "Bring an idea to life. Describe anything and ChachuScape renders it into cinematic, gallery-ready artwork.",
};

export default function CreateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
