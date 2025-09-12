"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import { apiPost } from "@/lib/api";
import {
  isResultAlreadyPosted,
  markResultPosting,
  markResultPosted,
} from "@/lib/result-deduplication";

export default function TestResultsPage() {
  const [childData, setChildData] = useState<any>(null);
  const [testResults, setTestResults] = useState<any>(null);
  const [notes, setNotes] = useState<string[]>([]);
  const [newNote, setNewNote] = useState("");
  const router = useRouter();

  useEffect(() => {
    const child = localStorage.getItem("childData");
    const results = localStorage.getItem("test1Results");
    const savedNotes = localStorage.getItem("expertNotes");

    if (!child || !results) {
      router.push("/");
      return;
    }

    setChildData(JSON.parse(child));
    const parsed = JSON.parse(results);
    setTestResults(parsed);
    // Persist to backend
    try {
      const childObj = JSON.parse(child);
      const correct = parsed?.correctSelections ?? parsed?.correctAnswers ?? 0;
      const incorrect =
        parsed?.incorrectSelections ?? parsed?.incorrectAnswers ?? 0;
      const total =
        parsed?.totalCats ?? parsed?.totalTargets ?? correct + incorrect;
      const ignored = Math.max(
        0,
        (typeof total === "number" ? total : 0) - correct - incorrect
      );
      if (childObj?.id) {
        const testKey = "اختبار الانتباه البصري1";
        if (!isResultAlreadyPosted(childObj.id, testKey)) {
          markResultPosting(childObj.id, testKey);
          void apiPost("/results", {
            childId: childObj.id,
            testKey,
            correct,
            incorrect,
            ignored,
            total: typeof total === "number" ? total : correct + incorrect,
          })
            .then(() => markResultPosted(childObj.id, testKey))
            .catch(() => {
              // If posting fails, remove the posting flag so it can be retried
              sessionStorage.removeItem(
                `postingResult:${testKey}:${childObj.id}`
              );
            });
        }
      }
    } catch {}
    if (savedNotes) setNotes(JSON.parse(savedNotes));
  }, [router]);

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    const updatedNotes = [...notes, newNote];
    setNotes(updatedNotes);
    localStorage.setItem("expertNotes", JSON.stringify(updatedNotes));
    setNewNote("");
  };

  const restartTest = () => {
    localStorage.removeItem("test1Results");
    router.push("/test-instructions");
  };

  if (!childData || !testResults) {
    return <div>جار التحميل...</div>;
  }

  const getPerformanceLevel = (accuracy: number) => {
    if (accuracy >= 90) return { level: "ممتاز", color: "text-green-600" };
    if (accuracy >= 75) return { level: "جيد جدا", color: "text-blue-600" };
    if (accuracy >= 60) return { level: "جيد", color: "text-yellow-600" };
    return { level: "يحتاج إلى تحسين", color: "text-red-600" };
  };

  const performance = getPerformanceLevel(testResults.accuracy);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-3xl shadow-lg" dir="ltr">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gray-800">
            نتائج الاختبار الأول
          </CardTitle>
          <p className="text-gray-600 mt-2">
            الطفل: {childData.firstName} {childData.lastName}
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* جدول النتائج */}
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-200 rounded-lg">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-3 border text-left">البند</th>
                  <th className="p-3 border text-left">إجابات صحيحة</th>
                  <th className="p-3 border text-left">إجابات خاطئة</th>
                  <th className="p-3 border text-left">المتوقع</th>
                  <th className="p-3 border text-left">المدة</th>
                  <th className="p-3 border text-left">الأداء</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="p-3 border">القطط</td>
                  <td className="p-3 border">
                    {testResults.correctSelections}
                  </td>
                  <td className="p-3 border">
                    {testResults.incorrectSelections}
                  </td>
                  <td className="p-3 border">{testResults.totalCats}</td>
                  <td className="p-3 border">
                    {Math.floor(testResults.timeUsed / 60)}:
                    {(testResults.timeUsed % 60).toString().padStart(2, "0")}
                  </td>
                  <td className={`p-3 border font-medium ${performance.color}`}>
                    {performance.level} ({testResults.accuracy}%)
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* الملاحظات */}
          <div className="bg-gray-50 p-4 rounded-lg border">
            <h3 className="font-semibold mb-2">ملاحظات الخبير</h3>
            {notes.length === 0 ? (
              <p className="text-sm text-gray-500">لا توجد ملاحظات بعد.</p>
            ) : (
              <ul className="list-disc pl-6 space-y-1">
                {notes.map((note, i) => (
                  <li key={i} className="text-sm text-gray-700">
                    {note}
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-3 space-y-2">
              <Textarea
                placeholder="أضف ملاحظة جديدة..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
              />
              <Button
                onClick={handleAddNote}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                حفظ الملاحظة
              </Button>
            </div>
          </div>

          {/* إجراء واحد: العودة لصفحة الاختبارات */}
          <div className="flex justify-center pt-4">
            <Button
              className="bg-black text-white"
              onClick={() => router.push("/tests")}
            >
              الذهاب إلى صفحة الاختبارات
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
