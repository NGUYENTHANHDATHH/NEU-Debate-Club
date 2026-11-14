"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";
import { ActionButton } from "@/components/ui/Dashboard/ActionButton";
import { PageFrame } from "@/components/ui/Dashboard/PageFrame";
import { Section } from "@/components/ui/Dashboard/Section";

const PRESET_MINUTES = [4, 5, 7, 8];
/** Phút đầu và phút cuối của bài nói là thời gian bảo vệ: không được đặt POI. */
const PROTECTED_SECONDS = 60;

function beep(times: number) {
  const context = new AudioContext();
  for (let i = 0; i < times; i++) {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.frequency.value = 880;
    gain.gain.value = 0.25;
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(context.currentTime + i * 0.4);
    oscillator.stop(context.currentTime + i * 0.4 + 0.22);
  }
  setTimeout(() => void context.close(), times * 400 + 300);
}

function clock(totalSeconds: number) {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

export function DebateTimerPage() {
  const [minutes, setMinutes] = useState(7);
  // Tính theo đồng hồ hệ thống thay vì đếm tick: tab chạy nền bị trình duyệt làm chậm timer vẫn đúng giờ.
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [baseMs, setBaseMs] = useState(0);
  const [nowMs, setNowMs] = useState(0);
  const lastSecond = useRef(0);

  const duration = minutes * 60;
  const running = startedAt !== null;
  const elapsed = (baseMs + (running ? Math.max(0, nowMs - startedAt) : 0)) / 1000;
  const hasProtectedTime = duration > PROTECTED_SECONDS * 2;

  useEffect(() => {
    if (startedAt === null) return;
    const bells: [number, number][] = [[duration, 2]];
    if (duration > PROTECTED_SECONDS * 2) bells.push([PROTECTED_SECONDS, 1], [duration - PROTECTED_SECONDS, 1]);
    const id = setInterval(() => {
      const now = Date.now();
      setNowMs(now);
      const second = Math.floor((baseMs + now - startedAt) / 1000);
      // "Vừa vượt mốc" thay vì "bằng mốc": tick có thể nhảy qua đúng giây đó.
      for (const [mark, times] of bells) {
        if (lastSecond.current < mark && second >= mark) beep(times);
      }
      lastSecond.current = second;
    }, 250);
    return () => clearInterval(id);
  }, [startedAt, baseMs, duration]);

  function toggle() {
    const now = Date.now();
    if (running) {
      setBaseMs(baseMs + now - startedAt);
      setStartedAt(null);
    } else {
      setNowMs(now);
      setStartedAt(now);
    }
  }

  function reset() {
    setStartedAt(null);
    setBaseMs(0);
    lastSecond.current = 0;
  }

  const phase =
    elapsed >= duration
      ? { label: "Hết giờ", className: "bg-rose-50 text-rose-700" }
      : hasProtectedTime && (elapsed < PROTECTED_SECONDS || elapsed >= duration - PROTECTED_SECONDS)
        ? { label: "Thời gian bảo vệ: không đặt POI", className: "bg-amber-50 text-amber-800" }
        : { label: hasProtectedTime ? "Được đặt POI" : "Đang nói", className: "bg-emerald-50 text-emerald-700" };

  return (
    <PageFrame
      title="Đồng hồ tranh biện"
      description="Bấm giờ bài nói. Chuông 1 tiếng khi hết phút đầu và khi còn 1 phút, 2 tiếng khi hết giờ."
    >
      <Section title="Bài nói" subtitle="Chọn thời lượng rồi bấm Bắt đầu. Đổi thời lượng sẽ không làm mất thời gian đã chạy.">
        <div className="flex flex-wrap items-center gap-2">
          {PRESET_MINUTES.map((preset) => (
            <button
              key={preset}
              type="button"
              aria-pressed={minutes === preset}
              onClick={() => setMinutes(preset)}
              className={`rounded-full px-3.5 py-1.5 text-sm transition-colors ${
                minutes === preset
                  ? "bg-rose-50 text-[#E11D48]"
                  : "border border-slate-200 bg-white text-[#71717A] hover:bg-slate-50"
              }`}
            >
              {preset} phút
            </button>
          ))}
          <label className="flex items-center gap-2 text-sm text-[#71717A]">
            Khác:
            <input
              type="number"
              min={1}
              max={60}
              value={minutes}
              onChange={(event) => setMinutes(Math.min(60, Math.max(1, Math.round(Number(event.target.value)) || 1)))}
              className="w-20 rounded-2xl border border-slate-200 bg-white px-3 py-1.5 text-sm text-[#18181B] outline-none focus:border-[#E11D48]"
            />
            phút
          </label>
        </div>

        <div className="py-10 text-center">
          <p
            role="timer"
            aria-label="Thời gian đã nói"
            className={`font-mono text-7xl font-semibold tabular-nums tracking-tight sm:text-8xl ${
              elapsed >= duration ? "text-[#E11D48]" : "text-[#18181B]"
            }`}
          >
            {clock(elapsed)}
          </p>
          <p className="mt-2 text-sm text-[#71717A]">
            {elapsed >= duration ? `Quá ${clock(elapsed - duration)}` : `Còn ${clock(duration - Math.floor(elapsed))}`} · tổng{" "}
            {clock(duration)}
          </p>
          <p aria-live="polite" className={`mx-auto mt-5 inline-block rounded-full px-4 py-1.5 text-sm font-medium ${phase.className}`}>
            {phase.label}
          </p>
          <div className="mx-auto mt-6 h-2 max-w-xl overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-[#E11D48] transition-[width] duration-300"
              style={{ width: `${Math.min(100, (elapsed / duration) * 100)}%` }}
            />
          </div>
        </div>

        <div className="flex justify-center gap-3">
          <ActionButton icon={running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />} onClick={toggle}>
            {running ? "Tạm dừng" : elapsed > 0 ? "Tiếp tục" : "Bắt đầu"}
          </ActionButton>
          <ActionButton variant="outline" icon={<RotateCcw className="h-4 w-4" />} onClick={reset} disabled={elapsed === 0}>
            Đặt lại
          </ActionButton>
        </div>
      </Section>
    </PageFrame>
  );
}
