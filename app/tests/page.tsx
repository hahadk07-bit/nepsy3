"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiGet } from "@/lib/api";

type Result = {
  id: number;
  testKey: string;
  correct: number;
  incorrect: number;
  ignored: number;
  total: number;
  createdAt: string;
};

const tests = [
  {
    key: "test1-1",
    title: "اختبار الانتباه البصري1",
    testKey: "اختبار الانتباه البصري1",
    startHref: "/test1-1/visual-search",
    resultsHref: "/test1-1/results",
  },
  {
    key: "test1-2",
    title: "اختبار الانتباه البصري2",
    testKey: "اختبار الانتباه البصري2",
    startHref: "/test1-2/faces-search",
    resultsHref: "/test1-2/results",
  },
  {
    key: "test1-3",
    title: "اختبار الانتباه السمعي 1 و 2",

    testKey: "اختبار الانتباه السمعي1",
    startHref: "/test1-3/auditory-attention-test",
    resultsHref: "/test1-3/results",
  },

  {
    key: "test1-5",
    title: "اختبار ذاكرة الوجوه 1 و 2 و 3",

    testKey: "اختبار ذاكرة الوجوه 2 و 3",
    startHref: "/test1-5",
    resultsHref: "/test1-5/results",
  },

  {
    key: "test1-7",
    title: "اختبار ذاكرة الأسماء 1 و 2"
   ,
    testKey: "اختبار ذاكرة الأسماء 2",
    startHref: "/test1-7",
    resultsHref: "/test1-7/results",
  },
  // External tests hosted on rapport app
  {
    key: "test1-8",
    title: "اختبار الإدراك السمعي 1",
    external: true,
    screen: "test1-8",
  },
  {
    key: "test1-9",
    title: "اختبار الإدراك السمعي 2",
    external: true,
    screen: "test1-9",
  },
  {
    key: "test1-10",
    title: "اختبار الإدراك السمعي 3",
    external: true,
    screen: "test1-10",
  },
  {
    key: "test1-11",
    title: "اختبار الإدراك البصري 1",
    external: true,
    screen: "test1-11",
  },
  {
    key: "test1-12",
    title: "اختبار الإغلاق البصري 2",
    external: true,
    screen: "test1-12",
  },
  {
    key: "test1-13",
    title: "لاستقبال المعجمي",
    external: true,
    screen: "test1-13",
  },
  {
    key: "test1-14",
    title: "انتاج المعجمي 1",
    external: true,
    screen: "test1-14",
  },
  {
    key: "test1-15",
    title: "انتاج المعجمي2",
    external: true,
    screen: "test1-15",
  },
  {
    key: "test1-16",
    title: "تكرار الكلمات",
    external: true,
    screen: "test1-16",
  },
  {
    key: "test1-17",
    title: "اختبار الفهم1",
    external: true,
    screen: "test1-17",
  },
  {
    key: "test1-18",
    title: "اختبار فهم 2",
    external: true,
    screen: "test1-18",
  },
  {
    key: "test1-19",
    title: "اختبار تكرار كلمات",
    external: true,
    screen: "test1-19",
  },
];

export default function TestsHubPage() {
  const [byTestKey, setByTestKey] = useState<
    Record<string, Result | undefined>
  >({});
  const [childId, setChildId] = useState<number | null>(null);

  useEffect(() => {
    try {
      const child = JSON.parse(localStorage.getItem("childData") || "null");
      if (child?.id) {
        setChildId(child.id);
        apiGet<Result[]>(`/children/${child.id}/results`)
          .then((list) => {
            // keep latest per testKey
            const map: Record<string, Result> = {};
            for (const r of list) {
              const prev = map[r.testKey];
              if (!prev || new Date(r.createdAt) > new Date(prev.createdAt)) {
                map[r.testKey] = r;
              }
            }
            setByTestKey(map);
          })
          .catch(() => {});
      }
    } catch {}
  }, []);

  return (
    <div className="min-h-screen bg-background p-6" dir="rtl">
      <div className="max-w-6xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <CardTitle className="text-2xl">قائمة الاختبارات</CardTitle>
              <Link href="/children-results">
                <Button variant="outline">عرض جميع النتائج</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {tests.map((t) => {
                const r = byTestKey[t.testKey || t.key];
                const accDen = (r?.correct ?? 0) + (r?.incorrect ?? 0);
                const acc =
                  accDen > 0
                    ? Math.round(((r?.correct ?? 0) / accDen) * 100)
                    : null;
                return (
                  <Card key={t.key} className="flex flex-col">
                    <CardHeader>
                      <CardTitle className="text-lg">{t.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col gap-3">
                      {childId && r ? (
                        <div className="text-sm text-muted-foreground">
                          آخر نتيجة: صحيح {r.correct} / إجمالي {r.total}
                          {acc !== null ? ` — الدقة ${acc}%` : ""}
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground">
                          لا توجد نتائج محفوظة بعد.
                        </div>
                      )}
                      <div className="flex gap-2 mt-auto">
                        {"startHref" in t ? (
                          <Link href={(t as any).startHref} className="w-full">
                            <Button className="w-full">بدء</Button>
                          </Link>
                        ) : (
                          <Button
                            className="w-full"
                            disabled={!childId}
                            onClick={() => {
                              if (!childId || !("external" in t)) return;
                              const base = "https://rapport-8d84c.web.app/";
                              const url = `${base}?screen=${encodeURIComponent(
                                (t as any).screen
                              )}&childId=${encodeURIComponent(
                                String(childId)
                              )}&testKey=${encodeURIComponent(t.key)}`;
                              window.location.href = url;
                            }}
                          >
                            بدء
                          </Button>
                        )}
                        {"resultsHref" in t ? (
                          <Link
                            href={(t as any).resultsHref}
                            className="w-full"
                          >
                            <Button variant="outline" className="w-full">
                              عرض النتائج
                            </Button>
                          </Link>
                        ) : null}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
