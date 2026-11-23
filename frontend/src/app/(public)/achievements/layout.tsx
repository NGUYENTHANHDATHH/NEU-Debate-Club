import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Thành tích",
  description: "Thành tích và giải thưởng tranh biện của NEU Debate Club – CLB Tranh biện Đại học Kinh tế Quốc dân.",
  alternates: { canonical: "/achievements" },
};

export default function AchievementsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
