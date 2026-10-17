"use client";

/* eslint-disable @next/next/no-img-element -- catalog images are CMS-configured URLs. */

import { useEffect, useState } from "react";
import { ArrowLeft, Tag } from "lucide-react";
import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { ROUTES } from "@/constants/routes";
import { CmsCatalogItem, fetchPublicCatalogItem } from "@/lib/api";

export default function ProjectDetail() {
  const params = useParams<{ slug: string }>();
  const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug;
  const [project, setProject] = useState<CmsCatalogItem | null | undefined>(undefined);

  useEffect(() => {
    if (slug) fetchPublicCatalogItem("projects", slug).then(setProject).catch(console.error);
  }, [slug]);

  if (project === null) return notFound();
  if (!project) return null;

  const detail = typeof project.content === "string" ? project.content : null;
  return (
    <article className="min-h-screen bg-white dark:bg-black text-black dark:text-white pb-32">
      <div className="relative w-full h-[50vh] md:h-[70vh] overflow-hidden bg-gray-200 dark:bg-[#111]">
        {project.imageUrl && <img src={project.imageUrl} alt={project.imageAlt || project.title} className="w-full h-full object-cover" />}
        <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center px-6 text-center">
          <span className="inline-block py-1 px-3 border border-white/30 rounded-full text-white/80 text-xs font-semibold uppercase tracking-widest mb-6">{project.category}</span>
          <h1 className="text-4xl md:text-6xl font-bold font-['Montserrat'] text-white">{project.title}</h1>
        </div>
      </div>
      <div className="max-w-3xl mx-auto px-6 py-12">
        <Link href={ROUTES.projects} className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-[#8A151B] mb-12"><ArrowLeft className="w-4 h-4" /> Back to projects</Link>
        <div className="flex items-center gap-2 mb-8 text-sm text-gray-600 dark:text-gray-400"><Tag className="w-4 h-4 text-[#8A151B]" />{project.category}</div>
        <p className="text-xl leading-relaxed border-l-4 border-[#8A151B] pl-6">{project.description}</p>
        {detail && <p className="mt-8 whitespace-pre-wrap leading-relaxed text-gray-700 dark:text-gray-300">{detail}</p>}
      </div>
    </article>
  );
}
