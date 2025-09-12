"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import { apiPost } from "@/lib/api";

type AuditoryTestResults = {
  testType: string;
  childName: string;
  childIQ: string;
  stageA: {
    correct: number;
    incorrect: number;
    forgotten: number;
  };
  stageB: {
    correct: number;
    incorrect: number;
    forgotten: number;
  };
  targetWords: {
    stageA: number;
    stageB: number;
  };
  completedAt: string;
};

export default function AuditoryAttentionResultsPage() {
  const router = useRouter();
  const [results, setResults] = useState<AuditoryTestResults | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const savedResults = localStorage.getItem("thirdTestResults");
      if (savedResults) {
        const parsed = JSON.parse(savedResults);
        setResults(parsed);
        const child = JSON.parse(localStorage.getItem("childData") || "null");
        if (child?.id) {
          // Save Stage A results
          const guardKeyA = `resultPosted:test1-3-stageA:${child.id}`;
          if (sessionStorage.getItem(guardKeyA) !== "1") {
            apiPost("/results", {
              childId: child.id,
              testKey: "اختبار الانتباه السمعي1",
              correct: parsed.stageA.correct,
              incorrect: parsed.stageA.incorrect,
              ignored: parsed.stageA.forgotten,
              total: parsed.targetWords.stageA,
            })
              .then(() => sessionStorage.setItem(guardKeyA, "1"))
              .catch(() => {});
          }

          // Save Stage B results
          const guardKeyB = `resultPosted:test1-3-stageB:${child.id}`;
          if (sessionStorage.getItem(guardKeyB) !== "1") {
            apiPost("/results", {
              childId: child.id,
              testKey: "اختبار الانتباه السمعي2",
              correct: parsed.stageB.correct,
              incorrect: parsed.stageB.incorrect,
              ignored: parsed.stageB.forgotten,
              total: parsed.targetWords.stageB,
            })
              .then(() => sessionStorage.setItem(guardKeyB, "1"))
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

  const { stageA, stageB, targetWords } = results;
  const stageARawPoints = stageA.correct - stageA.incorrect;
  const stageBRawPoints = stageB.correct - stageB.incorrect;
  const totalRawPoints = stageARawPoints + stageBRawPoints;

  return (
    <div
      className="min-h-screen bg-background p-8 flex flex-col items-center justify-center"
      dir="rtl"
    >
      <div className="max-w-6xl mx-auto w-full">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-3xl text-center">
              نتائج اختبار الانتباه السمعي
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-muted/50 p-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-4">
                الجدول التالي يوضح كيفية تسجيل اختبار الانتباه السمعي:
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
                        البند 1 (أ) - المرحلة الأولى
                      </td>
                      <td className="border border-border p-3 text-center">
                        {stageA.correct}/{targetWords.stageA}
                      </td>
                      <td className="border border-border p-3 text-center">
                        {stageA.incorrect}
                      </td>
                      <td className="border border-border p-3 text-center">
                        {stageA.forgotten}
                      </td>
                      <td className="border border-border p-3 text-center font-bold">
                        {stageARawPoints}
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-border p-3 font-medium">
                        البند 2 (ب) - المرحلة الثانية
                      </td>
                      <td className="border border-border p-3 text-center">
                        {stageB.correct}/{targetWords.stageB}
                      </td>
                      <td className="border border-border p-3 text-center">
                        {stageB.incorrect}
                      </td>
                      <td className="border border-border p-3 text-center">
                        {stageB.forgotten}
                      </td>
                      <td className="border border-border p-3 text-center font-bold">
                        {stageBRawPoints}
                      </td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr className="bg-muted font-bold">
                      <td className="border border-border p-3">
                        المجموع الكلي
                      </td>
                      <td className="border border-border p-3 text-center">
                        {stageA.correct + stageB.correct}
                      </td>
                      <td className="border border-border p-3 text-center">
                        {stageA.incorrect + stageB.incorrect}
                      </td>
                      <td className="border border-border p-3 text-center">
                        {stageA.forgotten + stageB.forgotten}
                      </td>
                      <td className="border border-border p-3 text-center text-lg">
                        {totalRawPoints}
                      </td>
                    </tr>
                  </tfoot>
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
