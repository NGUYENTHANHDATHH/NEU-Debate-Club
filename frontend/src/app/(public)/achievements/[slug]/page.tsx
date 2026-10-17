"use client";

/* eslint-disable @next/next/no-img-element -- catalog images are CMS-configured URLs. */

import { useEffect, useState } from "react";
import { ArrowLeft, Tag } from "lucide-react";
import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { ROUTES } from "@/constants/routes";
import { CmsCatalogItem, fetchPublicCatalogItem } from "@/lib/api";

export default function AchievementDetailPage() {
  const params = useParams<{ slug: string }>();
  const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug;
  const [achievement, setAchievement] = useState<CmsCatalogItem | null | undefined>(undefined);

  useEffect(() => {
    if (slug) fetchPublicCatalogItem("achievements", slug).then(setAchievement).catch(console.error);
  }, [slug]);

  if (achievement === null) return notFound();
  if (!achievement) return null;

  const detail = typeof achievement.content === "string" ? achievement.content : null;
  return (
    <article className="min-h-screen bg-white dark:bg-black text-black dark:text-white pt-24 pb-20">
      <section className="max-w-5xl mx-auto px-6">
        <Link href={ROUTES.achievements} className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-[#8A151B]"><ArrowLeft className="w-4 h-4" /> Back to achievements</Link>
        <div className="mt-8 relative w-full h-[42vh] md:h-[58vh] overflow-hidden rounded-2xl bg-gray-200 dark:bg-[#111]">
          {achievement.imageUrl && <img src={achievement.imageUrl} alt={achievement.imageAlt || achievement.title} className="w-full h-full object-cover" />}
          <div className="absolute inset-0 bg-black/45 flex flex-col justify-end p-6 md:p-10"><span className="w-fit bg-[#8A151B] text-white text-xs font-semibold uppercase px-3 py-1 rounded-full">{achievement.category}</span><h1 className="text-3xl md:text-5xl font-bold text-white mt-4">{achievement.title}</h1></div>
        </div>
        <div className="mt-8 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 border-y py-5"><Tag className="w-4 h-4 text-[#8A151B]" />{achievement.category}</div>
        <div className="mt-8 space-y-5 text-lg leading-relaxed text-gray-700 dark:text-gray-300"><p className="text-xl border-l-4 border-[#8A151B] pl-5 italic text-black dark:text-white">{achievement.description}</p>{detail && <p className="whitespace-pre-wrap">{detail}</p>}</div>
      </section>
    </article>
  );
}
