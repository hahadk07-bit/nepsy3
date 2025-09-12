"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import { apiPost } from "@/lib/api";

type Test6Results = {
  totalImages: number;
  heardResponses: number;
  notHeardResponses: number;
  noResponses: number;
  completionRate: number;
};

export default function NameLearnResultsPage() {
  const router = useRouter();
  const [results, setResults] = useState<Test6Results | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const savedResults = localStorage.getItem("sixthTestResults");
      if (savedResults) {
        const parsed = JSON.parse(savedResults);
        setResults(parsed);
        const child = JSON.parse(localStorage.getItem("childData") || "null");
        if (child?.id) {
          const guardKey = `resultPosted:test1-6:${child.id}`;
          if (sessionStorage.getItem(guardKey) !== "1") {
            const correct = parsed?.heardResponses ?? 0;
            const incorrect = parsed?.notHeardResponses ?? 0;
            const ignored = parsed?.noResponses ?? 0;
            const total = parsed?.totalImages ?? correct + incorrect + ignored;
            void apiPost("/results", {
              childId: child.id,
              testKey: "اختبار ذاكرة الأسماء 1",
              correct,
              incorrect,
              ignored,
              total,
            })
              .then(() => sessionStorage.setItem(guardKey, "1"))
              .catch(() => {});
          }
        }
      }
    } catch (error) {
      console.error("Failed to parse results from localStorage", error);
    } finally {
      setLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        جاري تحميل النتائج...
      </div>
    );
  }

  if (!results) {
    return (
      <div className="min-h-screen flex items-center justify-center" dir="rtl">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>خطأ</CardTitle>
          </CardHeader>
          <CardContent>
            <p>لم يتم العثور على نتائج الاختبار.</p>
            <Button onClick={() => router.push("/")} className="mt-4">
              العودة إلى البداية
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-background p-8 flex flex-col items-center justify-center"
      dir="rtl"
    >
      <div className="max-w-6xl mx-auto w-full">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-3xl text-center">
              نتائج الاختبار السادس: الربط السمعي البصري
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-border">
                <thead>
                  <tr className="bg-muted">
                    <th className="border border-border p-3 text-center">
                      إجمالي الصور
                    </th>
                    <th className="border border-border p-3 text-center">
                      الاستجابات المسموعة
                    </th>
                    <th className="border border-border p-3 text-center">
                      الاستجابات غير المسموعة
                    </th>
                    <th className="border border-border p-3 text-center">
                      عدم الاستجابة
                    </th>
                    <th className="border border-border p-3 text-center">
                      معدل الإكمال
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-border p-3 text-center">
                      {results.totalImages}
                    </td>
                    <td className="border border-border p-3 text-center">
                      {results.heardResponses}
                    </td>
                    <td className="border border-border p-3 text-center">
                      {results.notHeardResponses}
                    </td>
                    <td className="border border-border p-3 text-center">
                      {results.noResponses}
                    </td>
                    <td className="border border-border p-3 text-center font-bold">
                      {results.completionRate}%
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
        <div className="flex justify-center mt-6">
          <Button
            onClick={() => router.push("/tests")}
            size="lg"
            className="bg-black text-white hover:bg-gray-800"
          >
            الذهاب إلى صفحة الاختبارات
            <ArrowRight className="w-4 h-4 mr-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}
