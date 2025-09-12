"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";

// This type should match the summary saved in name-memo/page.tsx
type Test7Results = {
  totalImages: number;
  heardResponses: number; // Corresponds to "remembered"
  notHeardResponses: number; // Corresponds to "not remembered"
  noResponses: number; // Corresponds to "timed out"
  completionRate: number;
};

export default function NameMemoResultsPage() {
  const router = useRouter();
  const [results, setResults] = useState<Test7Results | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const savedResults = localStorage.getItem("seventhTestResults");
      if (savedResults) {
        setResults(JSON.parse(savedResults));
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
              نتائج اختبار تذكر الأسماء
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
                      إجابات صحيحة (تذكر)
                    </th>
                    <th className="border border-border p-3 text-center">
                      إجابات خاطئة (لم يتذكر)
                    </th>
                    <th className="border border-border p-3 text-center">
                      انتهى الوقت
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
