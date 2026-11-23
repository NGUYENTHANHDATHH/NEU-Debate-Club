import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dự án",
  description: "Các dự án, chương trình và hoạt động học thuật do NEU Debate Club – CLB Tranh biện Đại học Kinh tế Quốc dân tổ chức.",
  alternates: { canonical: "/projects" },
};

export default function ProjectsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
