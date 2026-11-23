import type { Metadata } from "next";
import { notFound } from "next/navigation";
import translations from "@/constants/translations.json";
import { DEPARTMENT_KEYS, routePath } from "@/constants/routes";
import DepartmentDetail from "./DepartmentDetail";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return Object.keys(DEPARTMENT_KEYS).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const key = DEPARTMENT_KEYS[slug as keyof typeof DEPARTMENT_KEYS];
  if (!key) return {};
  const dept = translations.vi.departments.detail[key];
  return {
    title: dept.name,
    description: `${dept.title}. ${dept.desc}`,
    alternates: { canonical: routePath.departmentDetail(slug) },
  };
}

export default async function DepartmentPage({ params }: Props) {
  if (!((await params).slug in DEPARTMENT_KEYS)) notFound();
  return <DepartmentDetail />;
}
