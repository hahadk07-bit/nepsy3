"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import { apiPost } from "@/lib/api";
import { CircularProgress } from "@/components/ui/circular-progress";

// Changed to Test7Results
type Test7Results = {
  totalImages: number;
  heardResponses: number;
  notHeardResponses: number;
  noResponses: number;
  completionRate: number;
};

type PerImageResult = {
  imageId: number;
  selected: boolean | null; // true = remembered, false = not, null = timed out
  responseTimeMs: number;
};

export default function NameRecallTest() {
  const router = useRouter();

  const images = [
    { id: 9, src: "/facetTest2/boy9.jpeg" },
    { id: 10, src: "/facetTest2/girl10.jpeg" },
    { id: 11, src: "/facetTest2/girl11.jpeg" },
    { id: 12, src: "/facetTest2/boy12.jpeg" },
    { id: 13, src: "/facetTest2/girl13.jpeg" },
    { id: 14, src: "/facetTest2/boy14.jpeg" },
    { id: 15, src: "/facetTest2/girl15.png" },
    { id: 16, src: "/facetTest2/girl16.png" },
  ];

  const totalImages = images.length;
  const IMAGE_DURATION_SEC = 5;

  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [running, setRunning] = useState<boolean>(false); // Start as false
  const [phase, setPhase] = useState<"instructions" | "running">(
    "instructions"
  );
  const [results, setResults] = useState<PerImageResult[]>([]);
  const imageStartRef = useRef<number>(Date.now());
  const [introPlaying, setIntroPlaying] = useState(false);
  const [introPlayed, setIntroPlayed] = useState(false);
  const [readyCountdown, setReadyCountdown] = useState(3);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const readyTimerRef = useRef<number | null>(null);

  const [loadedMap, setLoadedMap] = useState<Record<number, boolean>>({});
  const [errorMap, setErrorMap] = useState<Record<number, boolean>>({});

  // Initialize audio
  useEffect(() => {
    try {
      const audio = new Audio("/audio/test1-6/instruction.ogg");
      audio.preload = "auto";
      audioRef.current = audio;
    } catch (error) {
      console.error("Failed to load instruction audio:", error);
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
    };
  }, []);

  // Play instruction audio and start test
  const playInstructionsAndStart = async () => {
    if (!audioRef.current || introPlaying || introPlayed) return;

    setIntroPlaying(true);
    try {
      audioRef.current.currentTime = 0;
      await audioRef.current.play();

      audioRef.current.onended = () => {
        setIntroPlaying(false);
        setIntroPlayed(true);
        setPhase("running");
        // Auto-start the test after instructions
        setTimeout(() => {
          startTest();
        }, 1000);
      };
    } catch (error) {
      console.error("Failed to play instruction audio:", error);
      setIntroPlaying(false);
      setIntroPlayed(true);
      setPhase("running");
      // Auto-start the test even if audio fails
      setTimeout(() => {
        startTest();
      }, 1000);
    }
  };

  // Start the actual test
  const startTest = () => {
    setPhase("running");
    setReadyCountdown(3);

    // Start countdown
    readyTimerRef.current = window.setInterval(() => {
      setReadyCountdown((prev) => {
        if (prev <= 1) {
          // Countdown finished, start the test
          if (readyTimerRef.current) {
            clearInterval(readyTimerRef.current);
            readyTimerRef.current = null;
          }
          setPhase("running");
          setRunning(true);
          setCurrentIndex(0);
          setResults([]);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    const loaders: HTMLImageElement[] = [];
    images.forEach((img) => {
      const i = new Image();
      loaders.push(i);
      i.onload = () => setLoadedMap((prev) => ({ ...prev, [img.id]: true }));
      i.onerror = () => {
        console.error("Image load failed:", img.src, " (id:", img.id, ")");
        setErrorMap((prev) => ({ ...prev, [img.id]: true }));
      };
      i.src = img.src;
    });
    return () =>
      loaders.forEach((i) => ((i.onload = null), (i.onerror = null)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!running) return;
    imageStartRef.current = Date.now();
  }, [currentIndex, running]);

  const recordResponse = (selected: boolean | null) => {
    if (!running) return;

    const responseTimeMs = Date.now() - imageStartRef.current;
    const newEntry: PerImageResult = {
      imageId: images[currentIndex].id,
      selected,
      responseTimeMs,
    };
    const updatedResults = [...results, newEntry];
    setResults(updatedResults);

    const next = currentIndex + 1;
    if (next < totalImages) {
      setCurrentIndex(next);
    } else {
      setRunning(false);
      saveSummaryAndFinish(updatedResults);
    }
  };

  const handleChoice = (choice: boolean) => {
    if (running) recordResponse(choice);
  };

  const saveSummaryAndFinish = async (finalResults: PerImageResult[]) => {
    const heardResponses = finalResults.filter(
      (r) => r.selected === true
    ).length;
    const notHeardResponses = finalResults.filter(
      (r) => r.selected === false
    ).length;
    const noResponses = finalResults.filter((r) => r.selected === null).length;
    const completionRate = Math.round(
      ((heardResponses + notHeardResponses) / totalImages) * 100
    );

    // Changed to Test7Results
    const summary: Test7Results = {
      totalImages,
      heardResponses,
      notHeardResponses,
      noResponses,
      completionRate,
    };

    try {
      // Persist to backend once per child per test
      const child = JSON.parse(localStorage.getItem("childData") || "null");
      if (child?.id) {
        const guardKey = `resultPosted:test1-7:${child.id}`;
        if (sessionStorage.getItem(guardKey) !== "1") {
          await apiPost("/results", {
            childId: child.id,
            testKey: "اختبار ذاكرة الأسماء 2",
            correct: heardResponses,
            incorrect: notHeardResponses,
            ignored: noResponses,
            total: totalImages,
          });
          sessionStorage.setItem(guardKey, "1");
        }
      }
      localStorage.setItem("seventhTestResults", JSON.stringify(summary));
      localStorage.setItem("seventhTestPerImage", JSON.stringify(finalResults));
    } catch (err) {
      console.warn(
        "Failed to save seventhTestResults to backend/localStorage",
        err
      );
    }

    // Navigate to results page
    router.push("/test1-7/results");
  };

  const liveCorrect = results.filter((r) => r.selected === true).length;
  const liveIncorrect = results.filter((r) => r.selected === false).length;
  const liveIgnored = results.filter((r) => r.selected === null).length;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (readyTimerRef.current) {
        clearInterval(readyTimerRef.current);
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
    };
  }, []);

  // Show instructions phase
  if (phase === "instructions") {
    return (
      <div
        className="min-h-screen bg-background p-8 flex items-center justify-center"
        dir="rtl"
      >
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle className="text-2xl text-center">
              الاختبار السابع: تذكّر الأسماء
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <p className="text-lg">
              سوف تسمع تعليمات الاختبار الآن. يرجى الاستماع بعناية والانتظار حتى
              انتهاء التعليمات.
            </p>
            <Button
              onClick={playInstructionsAndStart}
              disabled={introPlaying}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg"
            >
              {introPlaying ? "جاري تشغيل التعليمات..." : "بدء الاختبار"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show ready phase (after instructions, before test starts)

  // Show test completion message
  if (!running) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        انتهى الاختبار، جاري حفظ النتائج...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8" dir="rtl">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">الاختبار السابع: تذكّر الأسماء</h1>
        </div>

        <div className="flex justify-start items-start mb-6">
          <div className="text-lg font-semibold">
            الصورة {currentIndex + 1} من {totalImages}
          </div>
        </div>

        <div>
          <div className="flex justify-center mb-2">
            <div className="relative inline-block bg-white rounded-lg shadow p-4">
              {errorMap[images[currentIndex].id] ? (
                <div className="w-64 h-64 flex items-center justify-center bg-red-50 border border-red-200 rounded-lg">
                  <div className="text-red-600 text-center">ملف غير موجود</div>
                </div>
              ) : (
                <img
                  src={images[currentIndex].src}
                  alt={`صورة ${currentIndex + 1}`}
                  className="w-64 h-64 object-cover rounded-lg"
                  onError={() =>
                    setErrorMap((p) => ({
                      ...p,
                      [images[currentIndex].id]: true,
                    }))
                  }
                  onLoad={() =>
                    setLoadedMap((p) => ({
                      ...p,
                      [images[currentIndex].id]: true,
                    }))
                  }
                />
              )}
            </div>
          </div>

          <div className="flex justify-center gap-6 mb-8">
            <Button
              onClick={() => handleChoice(true)}
              size="lg"
              className="bg-green-600 text-white hover:bg-green-700 w-10 h-10"
            ></Button>
            <Button
              onClick={() => handleChoice(false)}
              size="lg"
              className="bg-red-600 text-white hover:bg-red-700 w-10 h-10"
            ></Button>
          </div>
          
          <div className="flex justify-center mb-8">
            <Button
              onClick={() => handleChoice(null)}
              size="lg"
              className="bg-blue-600 text-white hover:bg-blue-700 px-8 py-3"
            >
              التالي
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
