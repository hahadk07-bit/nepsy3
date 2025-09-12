"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import { apiPost } from "@/lib/api";

type FaceMemoryTestResults = {
  testType: string;
  childName: string;
  childIQ: string;
  correct: number;
  incorrect: number;
  ignored: number;
  totalScore: number;
  totalPhotos: number;
  completedAt: string;
};

export default function FaceMemoryResultsPage() {
  const router = useRouter();
  const [results, setResults] = useState<FaceMemoryTestResults | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const savedResults = localStorage.getItem("fourthTestResults");
      if (savedResults) {
        const parsed = JSON.parse(savedResults);
        setResults(parsed);
        const child = JSON.parse(localStorage.getItem("childData") || "null");
        if (child?.id) {
          const guardKey = `resultPosted:test1-4:${child.id}`;
          if (sessionStorage.getItem(guardKey) !== "1") {
            const correct = parsed?.correct ?? 0;
            const incorrect = parsed?.incorrect ?? 0;
            const ignored = parsed?.ignored ?? 0;
            const total =
              parsed?.totalPhotos ??
              parsed?.total ??
              correct + incorrect + ignored;
            void apiPost("/results", {
              childId: child.id,
              testKey: "اختبار ذاكرة الوجوه 1",
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

  const { correct, incorrect, ignored, totalScore, totalPhotos } = results;

  return (
    <div
      className="min-h-screen bg-background p-8 flex flex-col items-center justify-center"
      dir="rtl"
    >
      <div className="max-w-6xl mx-auto w-full">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-3xl text-center">
              نتائج اختبار تحديد الجنس
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-muted/50 p-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-4">
                الجدول التالي يوضح كيفية تسجيل اختبار تحديد الجنس:
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-border">
                  <thead>
                    <tr className="bg-muted">
                      <th className="border border-border p-3 text-right">
                        البند
                      </th>
                      <th className="border border-border p-3 text-center">
                        الإجابات الصحيحة
                      </th>
                      <th className="border border-border p-3 text-center">
                        الإجابات الخاطئة
                      </th>
                      <th className="border border-border p-3 text-center">
                        الإجابات المنسية
                      </th>
                      <th className="border border-border p-3 text-center">
                        النقاط الخام
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-border p-3 font-medium">
                        اختبار تحديد الجنس
                      </td>
                      <td className="border border-border p-3 text-center">
                        {correct}/{totalPhotos}
                      </td>
                      <td className="border border-border p-3 text-center">
                        {incorrect}
                      </td>
                      <td className="border border-border p-3 text-center">
                        {ignored}
                      </td>
                      <td className="border border-border p-3 text-center font-bold">
                        {totalScore}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
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
