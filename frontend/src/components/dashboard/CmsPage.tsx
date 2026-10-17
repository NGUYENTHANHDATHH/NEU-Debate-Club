"use client";

/* eslint-disable @next/next/no-img-element -- catalog images are CMS-configured URLs. */

import {
  ChevronLeft,
  ChevronRight,
  EyeOff,
  Pencil,
  Pin,
  Plus,
  Upload,
} from "lucide-react";
import { useEffect, useState } from "react";
import { ActionButton } from "@/components/ui/Dashboard/ActionButton";
import { PageFrame } from "@/components/ui/Dashboard/PageFrame";
import { Section } from "@/components/ui/Dashboard/Section";
import {
  CmsCatalogItem,
  CmsSection,
  fetchCmsCatalog,
  fetchCmsSection,
  fetchCmsSections,
  publishCmsCatalog,
  publishCmsSection,
  saveCmsDraft,
} from "@/lib/api";

const sectionLabels: Record<string, string> = {
  hero: "Hero",
  vision: "Tầm nhìn",
  departments: "Departments",
  comments: "Comments",
  achievements: "Achievements",
  projects: "Projects",
};

type ContentItem = Record<string, unknown>;

const projectCategories = [
  "talkshow",
  "workshop",
  "debate_tournament",
  "debate_camp",
  "debate_training",
  "other",
];
const achievementCategories = ["championship", "award", "event", "other"];

function textValue(value: unknown) {
  return typeof value === "string" ? value : "";
}

function inputClassName() {
  return "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-[#18181B] outline-none transition focus:border-[#E11D48]";
}

function Field({
  label,
  value,
  onChange,
  multiline = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
}) {
  return (
    <label className="space-y-1 text-xs font-medium text-slate-700">
      <span>{label}</span>
      {multiline ? (
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={`${inputClassName()} min-h-20 resize-y`}
        />
      ) : (
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={inputClassName()}
        />
      )}
    </label>
  );
}

function itemLabel(item: ContentItem, section: string, index: number) {
  if (section === "departments")
    return textValue(item.name ?? item.nameKey) || `Ban ${index + 1}`;
  if (section === "comments")
    return textValue(item.name ?? item.author) || `Comment ${index + 1}`;
  return textValue(item.title) || `Bài viết ${index + 1}`;
}

function catalogItemContent(item: CmsCatalogItem): ContentItem {
  return {
    ...item,
    pinned: item.displayOrder === 0,
    hidden: !item.visible,
  };
}

export function CmsPage() {
  const [sections, setSections] = useState<CmsSection[]>([]);
  const [selected, setSelected] = useState("hero");
  const [content, setContent] = useState<ContentItem>({});
  const [activeItem, setActiveItem] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [busy, setBusy] = useState<"loading" | "saving" | "publishing" | null>(
    "loading",
  );
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const selectedSection = sections.find((item) => item.section === selected);
  const items = Array.isArray(content.items)
    ? (content.items as ContentItem[])
    : [];
  const isListSection = [
    "departments",
    "comments",
    "achievements",
    "projects",
  ].includes(selected);
  const isCatalogSection =
    selected === "projects" || selected === "achievements";
  const pageSize = 5;
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const pageItems = items.slice((page - 1) * pageSize, page * pageSize);
  const itemOffset = (page - 1) * pageSize;
  const currentItem = activeItem === null ? undefined : items[activeItem];

  useEffect(() => {
    fetchCmsSections()
      .then((items) => {
        setSections(items);
        if (items[0]) setSelected("hero");
      })
      .catch((error: Error) =>
        setMessage({ type: "error", text: error.message }),
      )
      .finally(() => setBusy(null));
  }, []);

  useEffect(() => {
    let cancelled = false;
    setBusy("loading");
    setActiveItem(null);
    setPage(1);
    setMessage(null);

    const load = isCatalogSection
      ? Promise.all([
          fetchCmsCatalog(selected),
          selected === "achievements"
            ? fetchCmsSection("achievements")
            : Promise.resolve(null),
        ]).then(([catalog, achievementSection]) => ({
          section: selected,
          draft: {
            ...(achievementSection?.draft ?? achievementSection?.published ?? {}),
            items: catalog.map(catalogItemContent),
          },
          published: {
            ...(achievementSection?.published ?? {}),
            items: catalog.map(catalogItemContent),
          },
          publishedAt: achievementSection?.publishedAt ?? null,
          draftAt: achievementSection?.draftAt ?? null,
          status: achievementSection?.status ?? ("PUBLISHED" as const),
        }))
      : fetchCmsSection(selected);

    load
      .then((loaded) => {
        if (cancelled) return;
        setContent(loaded.draft ?? loaded.published ?? {});
        setSections((current) => {
          const exists = current.some((item) => item.section === selected);
          return exists
            ? current.map((item) =>
                item.section === selected ? { ...item, ...loaded } : item,
              )
            : [...current, loaded];
        });
      })
      .catch((error: Error) => {
        if (!cancelled) setMessage({ type: "error", text: error.message });
      })
      .finally(() => {
        if (!cancelled) setBusy(null);
      });

    return () => {
      cancelled = true;
    };
  }, [isCatalogSection, selected]);

  function updateContent(key: string, value: string) {
    setContent((current) => ({ ...current, [key]: value }));
  }

  function updateItem(
    index: number | null,
    key: string,
    value: string | boolean,
  ) {
    if (index === null) return;
    setContent((current) => {
      const nextItems = Array.isArray(current.items)
        ? [...(current.items as ContentItem[])]
        : [];
      const nextItem = { ...nextItems[index], [key]: value };
      if (selected === "departments" && key === "name")
        nextItem.nameKey = value;
      if (selected === "departments" && key === "description")
        nextItem.descKey = value;
      if (selected === "comments" && key === "name") nextItem.author = value;
      if (selected === "comments" && key === "description")
        nextItem.quote = value;
      if (
        (selected === "projects" || selected === "achievements") &&
        key === "description"
      )
        nextItem.desc = value;
      if (
        (selected === "projects" || selected === "achievements") &&
        key === "imageUrl"
      )
        nextItem.image = value;
      nextItems[index] = nextItem;
      return { ...current, items: nextItems };
    });
  }

  function updateStat(index: number, key: string, value: string) {
    setContent((current) => {
      const stats = Array.isArray(current.stats)
        ? [...(current.stats as ContentItem[])]
        : [];
      stats[index] = { ...stats[index], [key]: value };
      return { ...current, stats };
    });
  }

  function addItem() {
    const newItem: ContentItem =
      selected === "departments"
        ? {
            id: crypto.randomUUID(),
            nameKey: "",
            descKey: "",
            iconType: "square",
          }
        : selected === "comments"
          ? {
              id: crypto.randomUUID(),
              author: "",
              role: "",
              quote: "",
              img: "",
            }
          : {
              id: crypto.randomUUID(),
              title: "",
              description: "",
              content: "",
              imageUrl: "",
              imageAlt: "",
              category: "other",
              pinned: false,
              hidden: false,
            };
    setContent((current) => ({
      ...current,
      items: [...(Array.isArray(current.items) ? current.items : []), newItem],
    }));
    setActiveItem(items.length);
    setPage(Math.ceil((items.length + 1) / pageSize));
  }

  async function handlePublish() {
    setBusy("publishing");
    try {
      if (isCatalogSection) {
        const saved = await publishCmsCatalog(selected, items);
        const nextContent = {
          ...content,
          items: saved.map(catalogItemContent),
        };
        if (selected === "achievements") {
          const stats = Array.isArray(content.stats) ? content.stats : [];
          await saveCmsDraft("achievements", { stats });
          await publishCmsSection("achievements");
        }
        setContent(nextContent);
        setMessage({ type: "success", text: "Đã lưu bài viết vào database." });
        return;
      }
      await saveCmsDraft(selected, content);
      await publishCmsSection(selected);
      setSections((items) =>
        items.map((item) =>
          item.section === selected
            ? {
                ...item,
                published: content,
                draft: null,
                publishedAt: new Date().toISOString(),
                draftAt: null,
                status: "PUBLISHED",
              }
            : item,
        ),
      );
      setMessage({
        type: "success",
        text: "Đã xuất bản. Landing page công khai sẽ đọc bản mới ngay.",
      });
    } catch (error) {
      setMessage({ type: "error", text: (error as Error).message });
    } finally {
      setBusy(null);
    }
  }

  return (
    <PageFrame
      eyebrow="BCN / TRUYỀN THÔNG"
      title="Landing Page CMS"
      description="Biên tập nội dung landing page theo từng section, lưu nháp và xuất bản."
    >
      <div className="space-y-4">
        <Section
          title="Cây nội dung"
          subtitle="Các section đang được landing page sử dụng."
        >
          <div className="flex flex-wrap gap-2">
            {Object.keys(sectionLabels).map((section) => {
              const item = sections.find(
                (sectionItem) => sectionItem.section === section,
              );
              return (
                <button
                  key={section}
                  onClick={() => setSelected(section)}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-xs font-medium transition ${selected === section ? "border-rose-200 bg-rose-50 text-[#E11D48]" : "border-slate-200 bg-white text-[#18181B] hover:bg-slate-50"}`}
                >
                  <span>{sectionLabels[section]}</span>
                  {item?.status === "DRAFT" ? (
                    <Pencil className="h-4 w-4" />
                  ) : (
                    <></>
                  )}
                </button>
              );
            })}
          </div>
        </Section>

        <div className="grid gap-6">
          <Section
            title={sectionLabels[selected] ?? selected}
            subtitle="Chọn một mục để chỉnh sửa thông tin chi tiết."
            action={
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${selectedSection?.status === "DRAFT" ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}
              >
                {selectedSection?.status === "DRAFT"
                  ? "Bản nháp"
                  : "Đã xuất bản"}
              </span>
            }
          >
            {selected === "achievements" && Array.isArray(content.stats) ? (
              <div className="mb-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="mb-3 text-sm font-semibold text-[#18181B]">
                  Achievement statistics
                </p>
                <div className="grid gap-3 md:grid-cols-3">
                  {(content.stats as ContentItem[]).map((stat, index) => (
                    <div
                      key={String(stat.id ?? index)}
                      className="grid gap-2 rounded-lg bg-white p-3"
                    >
                      <Field
                        label="Value"
                        value={textValue(stat.value)}
                        onChange={(value) => updateStat(index, "value", value)}
                      />
                      <Field
                        label="Label"
                        value={textValue(stat.label)}
                        onChange={(value) => updateStat(index, "label", value)}
                      />
                      <Field
                        label="Icon"
                        value={textValue(stat.iconType)}
                        onChange={(value) => updateStat(index, "iconType", value)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
            {selected === "hero" || selected === "vision" ? (
              <div className="grid gap-3 md:grid-cols-2">
                <Field
                  label={selected === "hero" ? "Headline" : "Title line 1"}
                  value={
                    selected === "hero"
                      ? textValue(content.headline)
                      : textValue(content.title1)
                  }
                  onChange={(value) =>
                    updateContent(
                      selected === "hero" ? "headline" : "title1",
                      value,
                    )
                  }
                />
                <Field
                  label={selected === "hero" ? "Subtext" : "Description"}
                  multiline
                  value={
                    selected === "hero"
                      ? textValue(content.subtext)
                      : textValue(content.description)
                  }
                  onChange={(value) =>
                    updateContent(
                      selected === "hero" ? "subtext" : "description",
                      value,
                    )
                  }
                />
                {selected === "hero" ? (
                  <>
                    <Field
                      label="Slogan"
                      value={textValue(content.slogan)}
                      onChange={(value) => updateContent("slogan", value)}
                    />
                    <Field
                      label="CTA label"
                      value={textValue(content.ctaLabel)}
                      onChange={(value) => updateContent("ctaLabel", value)}
                    />
                    <Field
                      label="CTA link"
                      value={textValue(content.ctaLink)}
                      onChange={(value) => updateContent("ctaLink", value)}
                    />
                    <Field
                      label="Background image URL"
                      value={textValue(content.backgroundImageUrl)}
                      onChange={(value) =>
                        updateContent("backgroundImageUrl", value)
                      }
                    />
                  </>
                ) : (
                  <Field
                    label="Title line 2"
                    value={textValue(content.title2)}
                    onChange={(value) => updateContent("title2", value)}
                  />
                )}
              </div>
            ) : isListSection ? (
              <div className="grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)]">
                <div className="space-y-2">
                  {pageItems.map((item, index) => {
                    const actualIndex = itemOffset + index;
                    return (
                      <button
                        key={String(item.id ?? actualIndex)}
                        onClick={() => setActiveItem(actualIndex)}
                        className={`w-full overflow-hidden rounded-xl border text-left text-sm ${activeItem === actualIndex ? "border-rose-200 bg-rose-50 text-[#E11D48]" : "border-slate-200 bg-white text-[#18181B]"}`}
                      >
                        {isCatalogSection ? (
                          <div>
                            <div className="aspect-video bg-slate-100">
                              {textValue(item.imageUrl ?? item.image) ? (
                                <img
                                  src={textValue(item.imageUrl ?? item.image)}
                                  alt={textValue(item.imageAlt) || textValue(item.title)}
                                  className="h-full w-full object-cover"
                                />
                              ) : null}
                            </div>
                            <div className="space-y-1 px-3 py-2.5">
                              <p className="line-clamp-1 font-semibold">
                                {itemLabel(item, selected, actualIndex)}
                              </p>
                              <p className="line-clamp-2 text-xs text-slate-500">
                                {textValue(item.description ?? item.desc)}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <span className="block px-3 py-2.5">
                            {itemLabel(item, selected, actualIndex)}
                          </span>
                        )}
                      </button>
                    );
                  })}
                  <ActionButton
                    variant="outline"
                    icon={<Plus className="h-4 w-4" />}
                    onClick={addItem}
                  >
                    Thêm{" "}
                    {selected === "departments"
                      ? "ban"
                      : selected === "comments"
                        ? "comment"
                        : "bài"}
                  </ActionButton>
                  {pageCount > 1 ? (
                    <div className="flex items-center justify-between pt-2 text-xs text-slate-500">
                      <button
                        aria-label="Trang trước"
                        disabled={page === 1}
                        onClick={() => {
                          setPage(page - 1);
                          setActiveItem((page - 2) * pageSize);
                        }}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <span>
                        {page}/{pageCount}
                      </span>
                      <button
                        aria-label="Trang sau"
                        disabled={page === pageCount}
                        onClick={() => {
                          setPage(page + 1);
                          setActiveItem(page * pageSize);
                        }}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  ) : null}
                </div>
                {currentItem ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {selected === "departments" ? (
                      <>
                        <Field
                          label="Name translation key"
                          value={textValue(currentItem.nameKey)}
                          onChange={(value) =>
                            updateItem(activeItem, "nameKey", value)
                          }
                        />
                        <Field
                          label="Description translation key"
                          value={textValue(currentItem.descKey)}
                          onChange={(value) =>
                            updateItem(activeItem, "descKey", value)
                          }
                        />
                        <Field
                          label="Icon type"
                          value={textValue(currentItem.iconType)}
                          onChange={(value) =>
                            updateItem(activeItem, "iconType", value)
                          }
                        />
                      </>
                    ) : null}
                    {selected === "comments" ? (
                      <>
                        <Field
                          label="Tên"
                          value={textValue(currentItem.author)}
                          onChange={(value) =>
                            updateItem(activeItem, "author", value)
                          }
                        />
                        <Field
                          label="Chức vụ"
                          value={textValue(currentItem.role)}
                          onChange={(value) =>
                            updateItem(activeItem, "role", value)
                          }
                        />
                        <Field
                          label="Description"
                          multiline
                          value={textValue(currentItem.quote)}
                          onChange={(value) =>
                            updateItem(activeItem, "quote", value)
                          }
                        />
                        <Field
                          label="Image URL"
                          value={textValue(currentItem.img)}
                          onChange={(value) =>
                            updateItem(activeItem, "img", value)
                          }
                        />
                      </>
                    ) : null}
                    {selected === "achievements" || selected === "projects" ? (
                      <>
                        <Field
                          label="Title"
                          value={textValue(currentItem.title)}
                          onChange={(value) =>
                            updateItem(activeItem, "title", value)
                          }
                        />
                        <Field
                          label="Slug"
                          value={textValue(currentItem.slug)}
                          onChange={(value) =>
                            updateItem(activeItem, "slug", value)
                          }
                        />
                        <Field
                          label="Description"
                          value={textValue(
                            currentItem.description ?? currentItem.desc,
                          )}
                          onChange={(value) =>
                            updateItem(activeItem, "description", value)
                          }
                        />
                        <Field
                          label="Content"
                          multiline
                          value={textValue(currentItem.content)}
                          onChange={(value) =>
                            updateItem(activeItem, "content", value)
                          }
                        />
                        <div className="grid gap-3 sm:col-span-2 sm:grid-cols-2">
                          <Field
                            label="Image URL"
                            value={textValue(
                              currentItem.imageUrl ?? currentItem.image,
                            )}
                            onChange={(value) =>
                              updateItem(activeItem, "imageUrl", value)
                            }
                          />
                          <Field
                            label="Image alt"
                            value={textValue(currentItem.imageAlt)}
                            onChange={(value) =>
                              updateItem(activeItem, "imageAlt", value)
                            }
                          />
                        </div>
                        <label className="space-y-1 text-xs font-medium text-slate-700">
                          <span>Category</span>
                          <select
                            value={textValue(currentItem.category)}
                            onChange={(event) =>
                              updateItem(
                                activeItem,
                                "category",
                                event.target.value,
                              )
                            }
                            className={inputClassName()}
                          >
                            {(selected === "projects"
                              ? projectCategories
                              : achievementCategories
                            ).map((category) => (
                              <option key={category} value={category}>
                                {category}
                              </option>
                            ))}
                          </select>
                        </label>
                        <Field
                          label="Display order"
                          value={String(currentItem.displayOrder ?? "")}
                          onChange={(value) =>
                            updateItem(activeItem, "displayOrder", value)
                          }
                        />
                        <div className="flex flex-wrap gap-2 sm:col-span-2">
                          <button
                            type="button"
                            onClick={() =>
                              updateItem(
                                activeItem,
                                "pinned",
                                !currentItem.pinned,
                              )
                            }
                            className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm ${currentItem.pinned ? "border-amber-300 bg-amber-50 text-amber-700" : "border-slate-200 text-slate-600"}`}
                          >
                            <Pin className="h-4 w-4" /> Ghim
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              updateItem(
                                activeItem,
                                "hidden",
                                !currentItem.hidden,
                              )
                            }
                            className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm ${currentItem.hidden ? "border-slate-400 bg-slate-100 text-slate-700" : "border-slate-200 text-slate-600"}`}
                          >
                            <EyeOff className="h-4 w-4" />{" "}
                            {currentItem.hidden ? "Đang ẩn" : "Ẩn"}
                          </button>
                        </div>
                      </>
                    ) : null}
                  </div>
                ) : (
                  <p className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
                    Chưa có dữ liệu. Hãy thêm một mục.
                  </p>
                )}
              </div>
            ) : null}
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <ActionButton
                icon={<Upload className="h-4 w-4" />}
                onClick={handlePublish}
                disabled={busy !== null}
              >
                {busy === "publishing" ? "Đang xuất bản..." : "Xuất bản"}
              </ActionButton>
              {message ? (
                <span
                  className={`text-sm ${message.type === "error" ? "text-rose-600" : "text-emerald-600"}`}
                >
                  {message.text}
                </span>
              ) : null}
            </div>
          </Section>
        </div>
      </div>
    </PageFrame>
  );
}
