"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { apiGet } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Child = {
  id: number;
  firstName: string;
  lastName: string;
  iq: number;
};

type Result = {
  id: number;
  testKey: string;
  correct: number;
  incorrect: number;
  ignored: number;
  total: number;
  createdAt: string;
};

export default function ChildrenResultsPage() {
  const router = useRouter();
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [results, setResults] = useState<Result[] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let ignore = false;
    apiGet<Child[]>("/children")
      .then((data) => {
        if (!ignore) setChildren(data);
      })
      .catch(() => {})
      .finally(() => {});
    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setResults(null);
      return;
    }
    setLoading(true);
    apiGet<Result[]>(`/children/${selectedId}/results`)
      .then((data) => setResults(data))
      .catch(() => setResults([]))
      .finally(() => setLoading(false));
  }, [selectedId]);

  const selectedChild = useMemo(
    () => children.find((c) => String(c.id) === selectedId) || null,
    [children, selectedId]
  );

  // Deduplicate results - remove duplicates with same values and timestamps within 1 second
  const deduplicatedResults = useMemo(() => {
    if (!results || results.length === 0) return results;

    const deduplicated: Result[] = [];
    const seen = new Set<string>();

    for (const result of results) {
      // Create a key based on all values except timestamp
      const valueKey = `${result.testKey}-${result.correct}-${result.incorrect}-${result.ignored}-${result.total}`;

      // Check if we've seen this exact combination before
      if (!seen.has(valueKey)) {
        seen.add(valueKey);
        deduplicated.push(result);
      } else {
        // Check if this is a duplicate within 1 second of an existing result
        const existingResult = deduplicated.find(
          (r) =>
            r.testKey === result.testKey &&
            r.correct === result.correct &&
            r.incorrect === result.incorrect &&
            r.ignored === result.ignored &&
            r.total === result.total
        );

        if (existingResult) {
          const timeDiff = Math.abs(
            new Date(result.createdAt).getTime() -
              new Date(existingResult.createdAt).getTime()
          );

          // If within 1 second (1000ms), skip this duplicate
          if (timeDiff <= 1000) {
            continue;
          }
        }

        // If not a duplicate, add it
        deduplicated.push(result);
      }
    }

    // Sort by creation date (newest first)
    return deduplicated.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [results]);

  return (
    <div className="min-h-screen bg-background p-6" dir="rtl">
      <div className="max-w-5xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <CardTitle className="text-2xl">نتائج طفل محدد</CardTitle>
              <Button
                variant="outline"
                onClick={() => router.back()}
                className="flex items-center gap-2"
              >
                ← العودة للصفحة السابقة
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="max-w-sm">
              <Select value={selectedId} onValueChange={setSelectedId}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر طفلًا" />
                </SelectTrigger>
                <SelectContent>
                  {children.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.firstName} {c.lastName} (IQ {c.iq})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedChild && (
              <div className="text-sm text-muted-foreground">
                عرض نتائج: {selectedChild.firstName} {selectedChild.lastName}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">قائمة النتائج</CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedId ? (
              <div className="text-muted-foreground">
                الرجاء اختيار طفل لعرض النتائج.
              </div>
            ) : loading ? (
              <div>جارٍ التحميل...</div>
            ) : !deduplicatedResults || deduplicatedResults.length === 0 ? (
              <div className="text-muted-foreground">لا توجد نتائج.</div>
            ) : (
              <div className="space-y-4">
                {results && results.length !== deduplicatedResults.length && (
                  <div className="text-sm text-muted-foreground bg-blue-50 p-3 rounded-lg border">
                    تم إزالة {results.length - deduplicatedResults.length} نتيجة
                    مكررة من {results.length} نتيجة إجمالية
                  </div>
                )}
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-border text-sm">
                    <thead>
                      <tr className="bg-muted">
                        <th className="border border-border p-2 text-center">
                          التاريخ
                        </th>
                        <th className="border border-border p-2 text-center">
                          الاختبار
                        </th>
                        <th className="border border-border p-2 text-center">
                          صحيح
                        </th>
                        <th className="border border-border p-2 text-center">
                          خطأ
                        </th>
                        <th className="border border-border p-2 text-center">
                          متجاهل
                        </th>
                        <th className="border border-border p-2 text-center">
                          الإجمالي
                        </th>
                        <th className="border border-border p-2 text-center">
                          الدقة
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {deduplicatedResults.map((r) => {
                        const accDen = r.correct + r.incorrect;
                        const acc =
                          accDen > 0
                            ? Math.round((r.correct / accDen) * 100)
                            : 0;
                        return (
                          <tr key={r.id}>
                            <td className="border border-border p-2 text-center">
                              {new Date(r.createdAt).toLocaleString()}
                            </td>
                            <td className="border border-border p-2 text-center">
                              {r.testKey}
                            </td>
                            <td className="border border-border p-2 text-center">
                              {r.correct}
                            </td>
                            <td className="border border-border p-2 text-center">
                              {r.incorrect}
                            </td>
                            <td className="border border-border p-2 text-center">
                              {r.ignored}
                            </td>
                            <td className="border border-border p-2 text-center">
                              {r.total}
                            </td>
                            <td className="border border-border p-2 text-center">
                              {acc}%
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
