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

export default function Test1_5EntryPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<"intro" | "starting">("intro");

  const handleBack = () => {
    router.push("/tests");
  };

  const handleStart = () => {
    setPhase("starting");
    // Set flag to indicate we're coming from test1-5 flow
    sessionStorage.setItem("fromTest5", "true");
    // Start test1-4 first, then automatically proceed to test1-5
    router.push("/test1-4/face-memory");
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
              الاختبار الخامس
            </h1>
          </div>

           <Card className="mb-8">
             <CardHeader>
               <CardTitle>تعليمات الاختبار</CardTitle>
             </CardHeader>
             <CardContent className="space-y-4">
               <p className="text-lg">
                 مرحباً بك في الاختبار الخامس من سلسلة اختبارات نيبسي الثاني.
               </p>
               <p className="text-lg">
                 ستبدأ أولاً باختبار تحديد الجنس ، ثم ستنتقل تلقائياً إلى اختبار التعرف على الوجوه (الاختبار الخامس).
               </p>
               <p className="text-lg">
                 هذا الاختبار يهدف إلى تقييم قدرتك على التعرف على الوجوه التي
                 شاهدتها في الاختبار السابق.
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
          <p className="text-lg">يرجى الانتظار، سيتم تشغيل اختبار تحديد الجنس أولاً ثم اختبار التعرف على الوجوه</p>
        </div>
      </div>
    );
  }

  return null;
}
