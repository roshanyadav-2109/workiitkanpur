"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import * as Icons from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Select, Field } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/card";
import { Tag, Difficulty } from "@/components/ui/tag";
import { StatusIndicator } from "@/components/ui/status";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { Tabs, SegmentedGroup, segmentedItemClass } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/toggle";
import { Stat } from "@/components/ui/stat";
import { TimerDisplay } from "@/components/ui/timer";
import { EmptyState } from "@/components/ui/empty-state";
import { BarColumnChart } from "@/components/charts/bar-column";
import { Sparkline } from "@/components/charts/sparkline";
import { StreakCalendar } from "@/components/charts/streak-calendar";
import { HBarList } from "@/components/charts/h-bar";

const ICON_SET: [string, React.ComponentType<Icons.IconProps>][] = [
  ["Dashboard", Icons.IconDashboard],
  ["Subjects", Icons.IconSubjects],
  ["Progress", Icons.IconProgress],
  ["Settings", Icons.IconSettings],
  ["Account", Icons.IconAccount],
  ["Search", Icons.IconSearch],
  ["Timer", Icons.IconTimer],
  ["Check", Icons.IconCheck],
  ["Circle", Icons.IconCircle],
  ["HalfCircle", Icons.IconHalfCircle],
  ["Chevron", Icons.IconChevron],
  ["Play", Icons.IconPlay],
  ["Plus", Icons.IconPlus],
  ["Sun", Icons.IconSun],
  ["Moon", Icons.IconMoon],
  ["Close", Icons.IconClose],
  ["ExternalLink", Icons.IconExternalLink],
  ["Menu", Icons.IconMenu],
  ["Logo", Icons.Logo],
];

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-hairline py-10">
      <h2 className="mb-6 text-[13px] font-medium uppercase tracking-[0.06em] text-fg-muted">
        {title}
      </h2>
      {children}
    </section>
  );
}

export function StyleGuide() {
  const [tab, setTab] = useState("overview");
  const [seg, setSeg] = useState("all");
  const [switchOn, setSwitchOn] = useState(true);

  return (
    <div className="min-h-dvh">
      <header className="flex h-14 items-center justify-between border-b border-hairline px-5 sm:px-8">
        <div className="flex items-center gap-2.5">
          <Icons.Logo size={22} className="text-fg" />
          <span className="text-[15px] font-medium tracking-[-0.01em]">
            Style guide
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="text-[13px] text-fg-muted transition-colors hover:text-fg"
          >
            Home
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[880px] px-5 pb-24 sm:px-8">
        <div className="pt-12">
          <h1 className="text-[24px] font-medium tracking-[-0.01em]">
            OPPE Practice — design system
          </h1>
          <p className="mt-2 max-w-[60ch] text-[14px] leading-relaxed text-fg-muted">
            Near-monochrome with a single accent applied uniformly, hairline
            depth, weight discipline. Everything below is drawn or built in-repo
            — no icon library.
          </p>
        </div>

        <Section title="Colour — one accent, applied uniformly">
          <div className="flex flex-wrap gap-4">
            {[
              ["Canvas", "bg-canvas border border-hairline"],
              ["Surface", "bg-surface border border-hairline"],
              ["Foreground", "bg-fg"],
              ["Hairline", "bg-hairline"],
              ["Accent", "bg-accent"],
              ["Accent weak", "bg-accent-weak border border-accent-border"],
            ].map(([name, cls]) => (
              <div key={name} className="flex flex-col items-center gap-2">
                <div className={cn("h-12 w-12 rounded-md", cls)} />
                <span className="text-[11px] text-fg-muted">{name}</span>
              </div>
            ))}
          </div>
          <p className="mt-4 max-w-[62ch] text-[13px] leading-relaxed text-fg-muted">
            Colour appears only on interactive elements (primary actions, active
            nav, focus, selected controls, links), the positive state (solved),
            and data visualisation. Everything else stays monochrome — one hue,
            one meaning.
          </p>
        </Section>

        <Section title="Icons — one hand, drawn in-repo">
          <div className="grid grid-cols-3 gap-px overflow-hidden rounded-md border border-hairline bg-hairline sm:grid-cols-5">
            {ICON_SET.map(([name, Icon]) => (
              <div
                key={name}
                className="flex flex-col items-center gap-3 bg-canvas py-6"
              >
                <Icon size={20} className="text-fg" />
                <span className="text-[11px] text-fg-muted">{name}</span>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Typography — Inter, weight discipline">
          <div className="space-y-4">
            <div className="text-[36px] font-semibold leading-none tracking-[-0.02em] tnum">
              128 · display / 600
            </div>
            <div className="text-[24px] font-medium tracking-[-0.01em]">
              Page title · 24 / 500
            </div>
            <div className="text-[18px] font-medium">
              Section heading · 18 / 500
            </div>
            <p className="max-w-[68ch] text-[15px] leading-relaxed">
              Body copy is 400 at 15px with a 1.6 line-height and a comfortable
              measure. Hierarchy comes from size and spacing, never colour.
            </p>
            <div className="text-[12px] font-medium uppercase tracking-[0.06em] text-fg-muted">
              Eyebrow · 12 / 500 / tracked
            </div>
            <code className="inline-block rounded border border-hairline bg-surface px-2 py-1 font-mono text-[13px]">
              mono · JetBrains Mono · 09:42
            </code>
          </div>
        </Section>

        <Section title="Buttons">
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="primary" size="sm">
              Small
            </Button>
            <Button variant="primary" size="lg">
              Large
            </Button>
            <Button variant="primary" disabled>
              Disabled
            </Button>
          </div>
        </Section>

        <Section title="Form controls">
          <div className="grid max-w-md gap-4">
            <Field label="Email" htmlFor="sg-email" hint="We never share it.">
              <Input id="sg-email" placeholder="you@example.com" />
            </Field>
            <Field label="Notes" htmlFor="sg-notes">
              <Textarea id="sg-notes" placeholder="Type here…" />
            </Field>
            <Field label="Difficulty" htmlFor="sg-select">
              <Select id="sg-select" defaultValue="all">
                <option value="all">All</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </Select>
            </Field>
          </div>
        </Section>

        <Section title="Tags, difficulty, status">
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-2">
              <Tag>loops</Tag>
              <Tag>strings</Tag>
              <Tag solid>MCQ</Tag>
            </div>
            <div className="flex items-center gap-4">
              <Difficulty level="easy" />
              <Difficulty level="medium" />
              <Difficulty level="hard" />
            </div>
            <div className="flex items-center gap-4">
              <StatusIndicator status="solved" showLabel />
              <StatusIndicator status="attempted" showLabel />
              <StatusIndicator status="unsolved" showLabel />
            </div>
          </div>
        </Section>

        <Section title="Table">
          <div className="overflow-hidden rounded-md border border-hairline">
            <Table>
              <THead>
                <TR>
                  <TH className="w-10 pl-4" />
                  <TH>Question</TH>
                  <TH>Difficulty</TH>
                  <TH className="pr-4 text-right">Best time</TH>
                </TR>
              </THead>
              <TBody>
                {[
                  ["solved", "Rectangle perimeter and area", "easy", "01:12"],
                  ["attempted", "Split a bill evenly", "medium", "—"],
                  ["unsolved", "Temperature conversion report", "hard", "—"],
                ].map(([s, title, d, t]) => (
                  <TR key={title} className="hover:bg-surface">
                    <TD className="pl-4">
                      <StatusIndicator status={s as never} />
                    </TD>
                    <TD className="text-[14px] font-medium">{title}</TD>
                    <TD>
                      <Difficulty level={d as never} showLabel={false} />
                    </TD>
                    <TD className="pr-4 text-right text-[13px] tnum text-fg-muted">
                      {t}
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </div>
        </Section>

        <Section title="Tabs, segmented, switch">
          <div className="space-y-6">
            <Tabs
              value={tab}
              onValueChange={setTab}
              items={[
                { value: "overview", label: "Overview" },
                { value: "topics", label: "Topics" },
                { value: "notes", label: "Notes" },
              ]}
            />
            <SegmentedGroup>
              {["all", "easy", "medium", "hard"].map((v) => (
                <button
                  key={v}
                  onClick={() => setSeg(v)}
                  className={segmentedItemClass(seg === v)}
                >
                  {v[0].toUpperCase() + v.slice(1)}
                </button>
              ))}
            </SegmentedGroup>
            <div className="flex items-center gap-3">
              <Switch checked={switchOn} onCheckedChange={setSwitchOn} />
              <span className="text-[14px]">
                {switchOn ? "On" : "Off"}
              </span>
            </div>
          </div>
        </Section>

        <Section title="Stats & timer">
          <div className="grid gap-6 sm:grid-cols-4">
            <Stat label="Solved" value={42} focal hint="of 120" />
            <Stat label="Streak" value={7} hint="days" />
            <Stat label="Time" value="6h 12m" />
            <Stat label="Accuracy" value="88%" />
          </div>
          <div className="mt-6 flex items-center gap-6">
            <TimerDisplay seconds={582} running size="lg" />
            <TimerDisplay seconds={582} running={false} />
          </div>
        </Section>

        <Section title="Charts — hand-rolled SVG">
          <div className="grid gap-6 sm:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Solved per day</CardTitle>
              </CardHeader>
              <CardBody>
                <BarColumnChart
                  data={[3, 1, 4, 2, 5, 0, 2, 3].map((v, i) => ({
                    label: ["M", "T", "W", "T", "F", "S", "S", "M"][i],
                    value: v,
                  }))}
                />
              </CardBody>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Time per solve</CardTitle>
              </CardHeader>
              <CardBody>
                <Sparkline values={[320, 280, 300, 210, 240, 180, 150]} />
              </CardBody>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Activity</CardTitle>
              </CardHeader>
              <CardBody>
                <div className="overflow-x-auto">
                  <StreakCalendar
                    counts={{}}
                    weeks={10}
                  />
                </div>
              </CardBody>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Accuracy by topic</CardTitle>
              </CardHeader>
              <CardBody>
                <HBarList
                  items={[
                    { label: "Basics & I/O", pct: 90, value: "9/10" },
                    { label: "Loops", pct: 60, value: "6/10" },
                    { label: "Strings", pct: 75, value: "3/4" },
                  ]}
                />
              </CardBody>
            </Card>
          </div>
        </Section>

        <Section title="Empty state">
          <EmptyState
            title="No matching questions"
            description="Try a different search term or clear the filters."
            action={<Button variant="primary">Browse subjects</Button>}
          />
        </Section>
      </main>
    </div>
  );
}
