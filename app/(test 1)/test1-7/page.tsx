"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft, Play } from "lucide-react";

export default function Test1_7EntryPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<"intro" | "starting">("intro");

  const handleBack = () => {
    router.push("/tests");
  };

  const handleStart = () => {
    setPhase("starting");
    // Set flag to indicate we're coming from test1-7 flow
    sessionStorage.setItem("fromTest7", "true");
    // Start test1-6 first, then automatically proceed to test1-7
    router.push("/test1-6/name-learn");
  };

  if (phase === "intro") {
    return (
      <div className="min-h-screen bg-background p-8" dir="rtl">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <Button variant="outline" size="icon" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-3xl font-bold">
              الاختبار السابع
            </h1>
          </div>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>تعليمات الاختبار</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-lg">
                مرحباً بك في الاختبار السابع من سلسلة اختبارات نيبسي الثاني.
              </p>
              <p className="text-lg">
                ستبدأ أولاً باختبار ذاكرة الأسماء 1، ثم ستنتقل تلقائياً إلى اختبار ذاكرة الأسماء 2 (الاختبار السابع).
              </p>
              <p className="text-lg">
                هذا الاختبار يهدف إلى تقييم قدرتك على حفظ وتذكر الأسماء.
              </p>
              <p className="text-lg font-semibold text-blue-600">
                ملاحظة: سيتم تشغيل الاختبارين تلقائياً دون عرض النتائج الوسطية.
              </p>
            </CardContent>
          </Card>

          <div className="flex justify-center gap-4">
            <Button onClick={handleStart} size="lg">
              <Play className="mr-2 h-5 w-5" />
              ابدأ الاختبار
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === "starting") {
    return (
      <div className="min-h-screen bg-background p-8 flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">جاري تشغيل الاختبارات...</h1>
          <p className="text-lg">يرجى الانتظار، سيتم تشغيل اختبار ذاكرة الأسماء 1 أولاً ثم اختبار ذاكرة الأسماء 2</p>
        </div>
      </div>
    );
  }

  return null;
}
