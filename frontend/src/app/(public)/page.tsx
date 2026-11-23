"use client";
import React from "react";
import { Hero } from "@/components/ui/HomeLayout/Hero";
import { Vision } from "@/components/ui/HomeLayout/Vision";
import { Departments } from "@/components/ui/HomeLayout/Departments";
import { Projects } from "@/components/ui/HomeLayout/Projects";
import { Comments } from "@/components/ui/HomeLayout/Comments";
import { Achievements } from "@/components/ui/HomeLayout/Achievements";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL, SOCIAL_LINKS } from "@/constants/routes";

// Dữ liệu có cấu trúc để Google và chatbot nhận diện CLB là một tổ chức.
const ORGANIZATION_JSON_LD = JSON.stringify({
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE_NAME,
  alternateName: ["NDC", "CLB Tranh biện NEU", "Câu lạc bộ Tranh biện Đại học Kinh tế Quốc dân"],
  url: SITE_URL,
  logo: `${SITE_URL}/logo.png`,
  description: SITE_DESCRIPTION,
  parentOrganization: {
    "@type": "CollegeOrUniversity",
    name: "Đại học Kinh tế Quốc dân",
    alternateName: "National Economics University",
    url: "https://neu.edu.vn",
  },
  sameAs: SOCIAL_LINKS,
});

export default function HomePage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ORGANIZATION_JSON_LD }} />
      <Hero />
      <Vision />
      <Achievements />
      <Projects />
      <Departments />
      <Comments />
    </>
  );
}
