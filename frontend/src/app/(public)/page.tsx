"use client";
import React from "react";
import { Hero } from "@/components/ui/HomeLayout/Hero";
import { Vision } from "@/components/ui/HomeLayout/Vision";
import { Departments } from "@/components/ui/HomeLayout/Departments";
import { Projects } from "@/components/ui/HomeLayout/Projects";
import { Comments } from "@/components/ui/HomeLayout/Comments";
import { Achievements } from "@/components/ui/HomeLayout/Achievements";

export default function HomePage() {
  return (
    <>
      <Hero />
      <Vision />
      <Achievements />
      <Projects />
      <Departments />
      <Comments />
    </>
  );
}
