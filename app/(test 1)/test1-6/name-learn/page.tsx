"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation"; // Added
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CircularProgress } from "@/components/ui/circular-progress";

interface AudioVisualTestProps {
  onBack: () => void;
}

interface TestImage {
  id: number;
  src: string;
  audioKey: string; // key in audioMap
  name: string;
}

export default function AudioVisualTest({ onBack }: AudioVisualTestProps) {
  const router = useRouter(); // Added
  const [phase, setPhase] = useState<"instructions" | "running">(
    "instructions"
  ); // "results" removed

  const BASE = "/facetTest2"; // adjust if needed
  const BASE2 = "/audio/test1-6"; // adjust if needed

  const testImages: TestImage[] = [
    { id: 1, src: `${BASE}/boy18.jpeg`, audioKey: "boy18", name: "boy18" },
    { id: 2, src: `${BASE}/boy25.jpeg`, audioKey: "boy25", name: "boy25" },
    { id: 3, src: `${BASE}/boy34.jpeg`, audioKey: "boy34", name: "boy34" },
    { id: 4, src: `${BASE}/boy9.jpeg`, audioKey: "boy9", name: "boy9" },
    { id: 5, src: `${BASE}/girl22.jpeg`, audioKey: "girl22", name: "girl22" },
    { id: 6, src: `${BASE}/girl2.jpeg`, audioKey: "girl2", name: "girl2" },
    { id: 7, src: `${BASE}/girl33.jpeg`, audioKey: "girl33", name: "girl33" },
    { id: 8, src: `${BASE}/girl6.jpeg`, audioKey: "girl6", name: "girl6" },
  ];

  const instructionKey = "instruction";
  const audioFiles = [...testImages.map((t) => t.audioKey), instructionKey];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(5);
  const [audioPlayCount, setAudioPlayCount] = useState(0);
  const [responses, setResponses] = useState<
    { imageId: number; heard: boolean }[]
  >([]);
  const [introPlaying, setIntroPlaying] = useState(false);
  const [introPlayed, setIntroPlayed] = useState(false);
  const [locked, setLocked] = useState(false);

  const audioMapRef = useRef<Record<string, HTMLAudioElement | null>>({});
  // track all repeat/unlock timeout ids
  const repeatTimeoutsRef = useRef<number[]>([]);
  // track the single advance timeout id (for advancing image after N seconds)
  const advanceTimeoutRef = useRef<number | null>(null);
  // track countdown interval id (for UI second-by-second remaining). We keep this optional.
  const countdownIntervalRef = useRef<number | null>(null);
  // track auto response timeout id
  const autoResponseTimeoutRef = useRef<number | null>(null);

  // preload audio
  useEffect(() => {
    audioFiles.forEach((key) => {
      const src =
        key === instructionKey
          ? `${BASE2}/instruction.ogg`
          : `${BASE2}/${key}.ogg`;
      try {
        const a = new Audio(src);
        a.preload = "auto";
        audioMapRef.current[key] = a;
      } catch {
        audioMapRef.current[key] = null;
      }
    });

    return () => {
      Object.values(audioMapRef.current).forEach((a) => {
        try {
          a?.pause();
          if (a) a.src = "";
        } catch {}
      });
      audioMapRef.current = {};
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // robust clearing: clear all repeat/unlock timeouts and the advance timeout and countdown interval
  const clearAllScheduled = () => {
    // clear repeats/unlock
    repeatTimeoutsRef.current.forEach((id) => {
      try {
        window.clearTimeout(id);
      } catch {}
    });
    repeatTimeoutsRef.current = [];

    // clear advance
    if (advanceTimeoutRef.current) {
      try {
        window.clearTimeout(advanceTimeoutRef.current);
      } catch {}
      advanceTimeoutRef.current = null;
    }

    // clear countdown interval
    if (countdownIntervalRef.current) {
      try {
        window.clearInterval(countdownIntervalRef.current);
      } catch {}
      countdownIntervalRef.current = null;
    }

    // clear auto response timeout
    if (autoResponseTimeoutRef.current) {
      try {
        window.clearTimeout(autoResponseTimeoutRef.current);
      } catch {}
      autoResponseTimeoutRef.current = null;
    }

    // reset play counter
    setAudioPlayCount(0);
  };

  const stopAllAudio = () => {
    Object.values(audioMapRef.current).forEach((a) => {
      try {
        a?.pause();
        if (a) a.currentTime = 0;
      } catch {}
    });
  };

  // start test -> play intro first then set to running
  const startTest = async () => {
    setResponses([]);
    setCurrentIndex(0);
    setTimeRemaining(5);
    setAudioPlayCount(0);
    await playIntroThenRun();
  };

  const playIntroThenRun = async () => {
    const instr = audioMapRef.current[instructionKey];
    if (!instr) {
      setPhase("running");
      return;
    }

    setIntroPlaying(true);
    setLocked(true);
    setIntroPlayed(false);

    await new Promise<void>((resolve) => {
      const onEnded = () => {
        instr.removeEventListener("ended", onEnded);
        resolve();
      };
      instr.addEventListener("ended", onEnded, { once: true });

      instr.currentTime = 0;
      instr.play().catch(() => {
        instr.removeEventListener("ended", onEnded);
        resolve();
      });
    });

    setIntroPlaying(false);
    setIntroPlayed(true);
    setLocked(false);
    setPhase("running");
  };

  // Show image and schedule audio repeats and advance
  const showCurrentImage = () => {
    // debug
    // eslint-disable-next-line no-console
    console.log("showCurrentImage for index:", currentIndex);

    // cleanup previous schedules & audio
    clearAllScheduled();
    stopAllAudio();

    if (currentIndex >= testImages.length) {
      finishTest();
      return;
    }

    setTimeRemaining(5);
    setAudioPlayCount(0);

    // create a lightweight per-second countdown for UI (optional)
    // clear prior interval just in case (clearAllScheduled already did it)
    countdownIntervalRef.current = window.setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          return 0; // will be reset by advance handler
        }
        return prev - 1;
      });
    }, 1000);

    // automatically record response as true after a short delay
    autoResponseTimeoutRef.current = window.setTimeout(() => {
      handleResponse(true);
    }, 1000); // respond after 1 second

    // schedule the advance to next image in exactly 5000ms
    advanceTimeoutRef.current = window.setTimeout(() => {
      // ensure countdown interval cleared
      if (countdownIntervalRef.current) {
        window.clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
      setTimeRemaining(5); // reset (not mandatory)
      setCurrentIndex((i) => i + 1);
    }, 5000);

    // lock UI while audio sequence plays (we will schedule unlock)
    setLocked(true);

    const img = testImages[currentIndex];
    const audioEl = audioMapRef.current[img.audioKey];
    if (!audioEl) {
      // no audio -> unlock immediately (user can respond while countdown runs)
      setLocked(false);
      return;
    }

    // play sequence: immediate + two repeats (timings relative to start)
    const playOnce = async () => {
      try {
        audioEl.pause();
        audioEl.currentTime = 0;
        await audioEl.play();
        setAudioPlayCount((c) => c + 1);
      } catch {
        // ignore errors
      }
    };

    // immediate play
    playOnce();

    // schedule repeats and record their ids so they can be cleared
    const t1 = window.setTimeout(() => {
      playOnce();
    }, 1600);
    const t2 = window.setTimeout(() => {
      playOnce();
      // schedule the unlock shortly after last repeat AND track this unlock timeout so it can be cleared
      const unlockId = window.setTimeout(() => {
        setLocked(false);
      }, 300);
      repeatTimeoutsRef.current.push(unlockId);
    }, 3200);

    // keep the repeat ids tracked
    repeatTimeoutsRef.current.push(t1, t2);
  };

  // automatically set all responses as true
  const handleResponse = (heard: boolean) => {
    if (locked) return;
    const img = testImages[currentIndex];
    if (!img) return;
    setResponses((prev) => {
      const without = prev.filter((r) => r.imageId !== img.id);
      return [...without, { imageId: img.id, heard: true }]; // always true
    });
  };

  // effect to start showing images when running
  useEffect(() => {
    if (phase !== "running") return;
    if (currentIndex < testImages.length) {
      showCurrentImage();
    } else {
      finishTest();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, phase]);

  const finishTest = () => {
    clearAllScheduled();
    stopAllAudio();
    setLocked(false);
    const results = calculateResults();
    try {
      localStorage.setItem("sixthTestResults", JSON.stringify(results));
    } catch (error) {
      console.error("Failed to save results to localStorage", error);
    }
    
    // Check if we came from test1-7 flow
    const fromTest7 = sessionStorage.getItem("fromTest7");
    if (fromTest7 === "true") {
      // Clear the flag and proceed to test1-7 without showing results
      sessionStorage.removeItem("fromTest7");
      router.push("/test1-7/name-memo");
    } else {
      // Normal flow - show results
      router.push("/test1-6/results");
    }
  };

  // cleanup on unmount
  useEffect(() => {
    return () => {
      clearAllScheduled();
      Object.values(audioMapRef.current).forEach((a) => {
        try {
          a?.pause();
          if (a) a.src = "";
        } catch {}
      });
      audioMapRef.current = {};
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const calculateResults = () => {
    const totalImages = testImages.length;
    const responsesGiven = responses.length;
    const heardResponses = responses.filter((r) => r.heard).length;
    const notHeardResponses = responses.filter((r) => !r.heard).length;
    const noResponses = totalImages - responsesGiven;

    return {
      totalImages,
      responsesGiven,
      heardResponses,
      notHeardResponses,
      noResponses,
      completionRate: Math.round((responsesGiven / totalImages) * 100),
    };
  };

  // ---------- RENDER ----------
  if (phase === "instructions") {
    return (
      <div className="min-h-screen bg-background p-8" dir="rtl">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl text-center">
                الاختبار السادس: الربط السمعي البصري
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-lg space-y-4">
                <p>في هذا الاختبار:</p>
                <ul className="list-disc list-inside space-y-2 mr-4">
                  <li>ستظهر لك 8 صور، كل صورة لمدة 5 ثوانٍ</li>
                  <li>خلال الـ 5 ثوانٍ، ستسمع اسم الصورة 3 مرات</li>
                  <li>يمكنك الضغط على "سمعت" إذا سمعت الصوت بوضوح</li>
                  <li>أو الضغط على "لم أسمع" إذا لم تسمع الصوت جيداً</li>
                </ul>
              </div>

              <div className="flex gap-4 justify-center">
                <Button
                  onClick={onBack}
                  variant="outline"
                  className="bg-gray-100 text-gray-700 hover:bg-gray-200"
                >
                  العودة للقائمة الرئيسية
                </Button>
                <Button
                  onClick={startTest}
                  className="bg-blue-600 text-white hover:bg-blue-700"
                >
                  ابدأ الاختبار
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }


  if (phase === "running") {
    const progress = (currentIndex / testImages.length) * 100;
    const currentImage = testImages[currentIndex];

    return (
      <div className="min-h-screen bg-background p-8" dir="rtl">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <div className="flex justify-start items-start mb-4">
                <CircularProgress
                  timeLeft={timeRemaining}
                  totalTime={5}
                  size={80}
                  strokeWidth={6}
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {currentImage && (
                <div className="text-center">
                  <div className="mb-6">
                    <img
                      key={currentImage.id}
                      src={currentImage.src}
                      alt={currentImage.name}
                      onError={(e) => {
                        // eslint-disable-next-line no-console
                        console.error(
                          "image failed to load:",
                          currentImage.src
                        );
                        const el = e.currentTarget as HTMLImageElement;
                        el.src = "/placeholder.png";
                      }}
                      className="w-64 h-64 mx-auto object-cover rounded-lg border-2 border-gray-300"
                    />
                  </div>

                  <div className="text-center">
                    <p className="text-lg text-gray-600">
                      يتم تسجيل الاستجابة تلقائياً
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return null;
}
