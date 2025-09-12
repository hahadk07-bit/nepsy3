"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import { apiPost } from "@/lib/api";

export default function TestResultsPage() {
  const [childData, setChildData] = useState<any>(null);
  const [test1Results, setTest1Results] = useState<any>(null);
  const [lastTestResults, setLastTestResults] = useState<any>(null); // second test
  const [notes, setNotes] = useState<string[]>([]);
  const [newNote, setNewNote] = useState("");
  const router = useRouter();

  useEffect(() => {
    const child = localStorage.getItem("childData");
    const results1 = localStorage.getItem("test1Results");
    const results2 = localStorage.getItem("secondTestResults"); // last test
    const savedNotes = localStorage.getItem("expertNotes");

    if (!child || !results1) {
      router.push("/");
      return;
    }

    setChildData(JSON.parse(child));
    const parsed1 = JSON.parse(results1);
    setTest1Results(parsed1);
    if (results2) {
      const parsed2 = JSON.parse(results2);
      setLastTestResults(parsed2);
      try {
        const childObj = JSON.parse(child);
        const correct = parsed2?.correct ?? parsed2?.correctAnswers ?? 0;
        const incorrect = parsed2?.incorrect ?? parsed2?.incorrectAnswers ?? 0;
        const ignored = parsed2?.ignored ?? 0;
        const total =
          parsed2?.totalRounds ??
          parsed2?.total ??
          correct + incorrect + ignored;
        if (childObj?.id) {
          const guardKey = `resultPosted:test1-2:${childObj.id}`;
          if (sessionStorage.getItem(guardKey) !== "1") {
            void apiPost("/results", {
              childId: childObj.id,
              testKey: "اختبار الانتباه البصري2",
              correct,
              incorrect,
              ignored,
              total,
            })
              .then(() => sessionStorage.setItem(guardKey, "1"))
              .catch(() => {});
          }
        }
      } catch {}
    }
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

  const restartLastTest = () => {
    localStorage.removeItem("secondTestResults");
    router.push("/second-test-instructions");
  };

  if (!childData || !test1Results) {
    return <div>جار التحميل...</div>;
  }

  const getPerformanceLevel = (accuracy: number) => {
    if (accuracy >= 90) return { level: "ممتاز", color: "text-green-600" };
    if (accuracy >= 75) return { level: "جيد جدا", color: "text-blue-600" };
    if (accuracy >= 60) return { level: "جيد", color: "text-yellow-600" };
    return { level: "يحتاج إلى تحسين", color: "text-red-600" };
  };

  // helper to read various possible keys with sensible fallbacks
  const readCorrect = (r: any) =>
    r?.correctSelections ?? r?.correctAnswers ?? r?.correctAnswersCount ?? 0;
  const readIncorrect = (r: any) =>
    r?.incorrectSelections ??
    r?.incorrectAnswers ??
    r?.incorrectAnswersCount ??
    0;
  const readTotal = (r: any) =>
    r?.totalCats ?? r?.totalTargets ?? r?.total ?? null;
  const readTimeUsed = (r: any) => r?.timeUsed ?? r?.duration ?? 0;
  const readAccuracy = (r: any) =>
    typeof r?.accuracy === "number"
      ? r.accuracy
      : (() => {
          const c = readCorrect(r);
          const i = readIncorrect(r);
          const denom = c + i;
          return denom > 0 ? Math.round((c / denom) * 100) : 0;
        })();

  const performance1 = getPerformanceLevel(readAccuracy(test1Results));
  const performance2 = lastTestResults
    ? getPerformanceLevel(readAccuracy(lastTestResults))
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-3xl shadow-lg" dir="ltr">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gray-800">
            نتائج الاختبار
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
                {/* First test row (test1Results) */}
                <tr>
                  <td className="p-3 border">الاختبار الأول (القطط)</td>
                  <td className="p-3 border">{readCorrect(test1Results)}</td>
                  <td className="p-3 border">{readIncorrect(test1Results)}</td>
                  <td className="p-3 border">
                    {readTotal(test1Results) ?? "—"}
                  </td>
                  <td className="p-3 border">
                    {Math.floor(readTimeUsed(test1Results) / 60)}:
                    {String(readTimeUsed(test1Results) % 60).padStart(2, "0")}
                  </td>
                  <td
                    className={`p-3 border font-medium ${performance1.color}`}
                  >
                    {performance1.level} ({readAccuracy(test1Results)}%)
                  </td>
                </tr>

                {/* Last / second test row (if present) */}
                {lastTestResults ? (
                  <tr>
                    <td className="p-3 border">
                      الاختبار الثاني (التعرف على الوجوه)
                    </td>
                    <td className="p-3 border">
                      {readCorrect(lastTestResults)}
                    </td>
                    <td className="p-3 border">
                      {readIncorrect(lastTestResults)}
                    </td>
                    <td className="p-3 border">
                      {readTotal(lastTestResults) ?? "—"}
                    </td>
                    <td className="p-3 border">
                      {Math.floor(readTimeUsed(lastTestResults) / 60)}:
                      {String(readTimeUsed(lastTestResults) % 60).padStart(
                        2,
                        "0"
                      )}
                    </td>
                    <td
                      className={`p-3 border font-medium ${
                        performance2 ? performance2.color : ""
                      }`}
                    >
                      {performance2
                        ? `${performance2.level} (${readAccuracy(
                            lastTestResults
                          )}%)`
                        : "—"}
                    </td>
                  </tr>
                ) : (
                  <tr>
                    <td className="p-3 border italic text-gray-500" colSpan={6}>
                      لا توجد نتيجة للاختبار الثاني بعد.
                    </td>
                  </tr>
                )}
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
