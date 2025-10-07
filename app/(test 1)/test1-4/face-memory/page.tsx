"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Play } from "lucide-react";
import { CircularProgress } from "@/components/ui/circular-progress";

interface GenderIdentificationTestProps {
  onBack: () => void;
}

interface PhotoData {
  id: number;
  src: string;
  correctGender: "boy" | "girl";
}

interface TestResult {
  photoId: number;
  selectedGender: "boy" | "girl" | null;
  isCorrect: boolean | null;
  responseTime: number;
}

export default function GenderIdentificationTest({
  onBack,
}: GenderIdentificationTestProps) {
  const router = useRouter();
  const [phase, setPhase] = useState<
    "instructions" | "running" | "photo-display" | "complete"
  >("instructions");

  const photos: PhotoData[] = [
    // Only images numbered 1..16 (ordered by their numeric part)
    { id: 1, src: "/facetTest2/girl1.jpeg", correctGender: "girl" },
    { id: 2, src: "/facetTest2/girl2.jpeg", correctGender: "girl" },
    { id: 3, src: "/facetTest2/girl3.jpeg", correctGender: "girl" },
    { id: 4, src: "/facetTest2/girl4.jpeg", correctGender: "girl" },
    { id: 5, src: "/facetTest2/boy5.jpeg", correctGender: "boy" },
    { id: 6, src: "/facetTest2/girl6.jpeg", correctGender: "girl" },
    { id: 7, src: "/facetTest2/boy7.jpeg", correctGender: "boy" },
    { id: 8, src: "/facetTest2/boy8.jpeg", correctGender: "boy" },
    { id: 9, src: "/facetTest2/boy9.jpeg", correctGender: "boy" },
    { id: 10, src: "/facetTest2/girl10.jpeg", correctGender: "girl" },
    { id: 11, src: "/facetTest2/girl11.jpeg", correctGender: "girl" },
    { id: 12, src: "/facetTest2/boy12.jpeg", correctGender: "boy" },
    { id: 13, src: "/facetTest2/girl13.jpeg", correctGender: "girl" },
    { id: 14, src: "/facetTest2/boy14.jpeg", correctGender: "boy" },
    { id: 15, src: "/facetTest2/girl15.png", correctGender: "girl" },
    { id: 16, src: "/facetTest2/girl16.png", correctGender: "girl" },
  ];

  // UI / results state
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [results, setResults] = useState<TestResult[]>([]);
  const [introPlaying, setIntroPlaying] = useState(false); // intro audio playing
  const [facememPlaying, setFacememPlaying] = useState(false); // per-photo play indicator

  // seconds since the *current* photo started. null means timer stopped/not started.
  const [photoElapsed, setPhotoElapsed] = useState<number | null>(null);

  // derived display for remaining seconds (1..5)
  const displayedTimeRemaining = (() => {
    if (photoElapsed === null) return 5;
    const rem = 5 - Math.floor(photoElapsed);
    return rem <= 0 ? 1 : rem;
  })();

  // timers & audio refs
  const globalIntervalRef = useRef<number | null>(null); // global second ticker
  const photoStartTimesRef = useRef<number[]>(Array(photos.length).fill(0)); // photo start timestamps in ms
  const answeredFlagsRef = useRef<boolean[]>(Array(photos.length).fill(false)); // ensure single response per photo
  const currentIndexRef = useRef<number>(0);

  const clickAudioRef = useRef<HTMLAudioElement | null>(null);
  const finishAudioRef = useRef<HTMLAudioElement | null>(null);
  const facememAudioRef = useRef<HTMLAudioElement | null>(null); // used both as intro and per-photo source

  const introPlayedRef = useRef<boolean>(false);

  // setup audio elements on client mount
  useEffect(() => {
    clickAudioRef.current = new Audio("/audio/click.wav");
    finishAudioRef.current = new Audio("/audio/finish.wav");
    facememAudioRef.current = new Audio("/audio/face_gendre.opus");

    if (clickAudioRef.current) clickAudioRef.current.volume = 0.9;
    if (finishAudioRef.current) finishAudioRef.current.volume = 0.9;
    if (facememAudioRef.current) facememAudioRef.current.volume = 0.95;

    return () => {
      // cleanup references
      clickAudioRef.current = null;
      finishAudioRef.current = null;
      facememAudioRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // keep currentIndexRef synced
  useEffect(() => {
    currentIndexRef.current = currentPhotoIndex;
  }, [currentPhotoIndex]);

  // start the global timer and photo flow after intro ends
  const startGlobalTimer = () => {
    // guard no double-start
    if (globalIntervalRef.current !== null) return;

    // mark first photo start time
    photoStartTimesRef.current = photoStartTimesRef.current.map(() => 0);
    photoStartTimesRef.current[0] = Date.now();
    setPhotoElapsed(0);

    // increment seconds every 200ms to make displayed countdown responsive (but we'll floor when showing)
    globalIntervalRef.current = window.setInterval(() => {
      setPhotoElapsed((s) => {
        if (s === null) return 0;
        return s + 0.2; // increment by 0.2s for smoother UI
      });
    }, 200) as unknown as number;
  };

  // stop global timer (when test completes)
  const stopGlobalTimer = () => {
    if (globalIntervalRef.current !== null) {
      window.clearInterval(globalIntervalRef.current);
      globalIntervalRef.current = null;
    }
    setPhotoElapsed(null);
  };

  // when photoElapsed changes, compute auto-advance after 5s
  useEffect(() => {
    if (photoElapsed === null) return;

    if (photoElapsed >= 5) {
      // time's up for current photo
      const idx = currentIndexRef.current;

      if (!answeredFlagsRef.current[idx]) {
        const responseTime =
          Date.now() - (photoStartTimesRef.current[idx] || Date.now());
        const ignoredResult: TestResult = {
          photoId: photos[idx].id,
          selectedGender: null,
          isCorrect: null,
          responseTime,
        };
        setResults((prev) => [...prev, ignoredResult]);
        answeredFlagsRef.current[idx] = true;
      }

      const nextIndex = idx + 1;
      if (nextIndex < photos.length) {
        setCurrentPhotoIndex(nextIndex);
        photoStartTimesRef.current[nextIndex] = Date.now();
        setPhotoElapsed(0);
      } else {
        // complete
        stopGlobalTimer();
        setPhase("complete");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photoElapsed]);

  // play intro once and start timer AFTER it finishes naturally
  const startTest = async () => {
    setResults([]);
    // reset answered flags and photo start times
    answeredFlagsRef.current = Array(photos.length).fill(false);
    photoStartTimesRef.current = Array(photos.length).fill(0);
    setCurrentPhotoIndex(0);
    currentIndexRef.current = 0;
    setPhase("running");

    const fm = facememAudioRef.current;
    if (!introPlayedRef.current && fm) {
      introPlayedRef.current = true;
      setIntroPlaying(true);

      const onIntroEnded = () => {
        setIntroPlaying(false);
        // start global timer immediately
        startGlobalTimer();
      };

      fm.addEventListener("ended", onIntroEnded, { once: true });

      try {
        await fm.play().catch(() => {
          // autoplay blocked -> start immediately
          setIntroPlaying(false);
          try {
            fm.removeEventListener("ended", onIntroEnded as EventListener);
          } catch {}
          startGlobalTimer();
        });
      } catch {
        setIntroPlaying(false);
        try {
          fm.removeEventListener("ended", onIntroEnded as EventListener);
        } catch {}
        startGlobalTimer();
      }

      // show first photo immediately (while intro plays)
      photoStartTimesRef.current[0] = Date.now();
      setCurrentPhotoIndex(0);
    } else {
      // intro already played or missing -> start straight away
      startGlobalTimer();
      photoStartTimesRef.current[0] = Date.now();
      setCurrentPhotoIndex(0);
    }
    setPhase("photo-display");
  };

  // play per-photo audio but DO NOT pause the global timer
  const playFacememForCurrentPhoto = async () => {
    const fm = facememAudioRef.current;
    if (!fm) {
      // nothing to do
      return;
    }

    // If intro still playing, we don't attempt per-photo playback
    if (introPlaying) return;

    try {
      // If facemem is currently playing (unlikely after intro ended), use a clone so timer isn't interrupted
      if (!fm.paused) {
        const clone = fm.cloneNode(true) as HTMLAudioElement;
        clone.volume = fm.volume;
        setFacememPlaying(true);
        clone.addEventListener(
          "ended",
          () => {
            setFacememPlaying(false);
            try {
              clone.pause();
              clone.src = "";
            } catch {}
          },
          { once: true }
        );
        await clone.play().catch(() => {
          setFacememPlaying(false);
        });
        return;
      }

      setFacememPlaying(true);
      const onEnded = () => {
        setFacememPlaying(false);
      };
      fm.addEventListener("ended", onEnded, { once: true });
      fm.currentTime = 0;
      await fm.play();
    } catch {
      setFacememPlaying(false);
    }
  };

  // handle user answer — only once per photo, only after intro finished (i.e., photoElapsed !== null)
  const handleAnswer = (selectedGender: "boy" | "girl") => {
    // test hasn't started counting yet -> ignore
    if (photoElapsed === null) return;
    const idx = currentIndexRef.current;
    if (answeredFlagsRef.current[idx]) return; // already answered

    answeredFlagsRef.current[idx] = true;

    // play click
    if (clickAudioRef.current) {
      clickAudioRef.current.currentTime = 0;
      clickAudioRef.current.play().catch(() => {});
    }

    const responseTime =
      Date.now() - (photoStartTimesRef.current[idx] || Date.now());
    const isCorrect = selectedGender === photos[idx].correctGender;

    const res: TestResult = {
      photoId: photos[idx].id,
      selectedGender,
      isCorrect,
      responseTime,
    };

    setResults((prev) => [...prev, res]);

    // Immediately advance to next photo and restart the 5s counter
    const nextIndex = idx + 1;
    if (nextIndex < photos.length) {
      setCurrentPhotoIndex(nextIndex);
      photoStartTimesRef.current[nextIndex] = Date.now();
      setPhotoElapsed(0);
    } else {
      // finished all photos
      stopGlobalTimer();
      setPhase("complete");
    }
  };

  // result calculations
  const calculateResults = () => {
    const correct = results.filter((r) => r.isCorrect === true).length;
    const incorrect = results.filter((r) => r.isCorrect === false).length;
    const ignored = results.filter((r) => r.isCorrect === null).length;
    const totalScore = correct - incorrect;
    return { correct, incorrect, ignored, totalScore };
  };

  // when test completes play finish audio and save results
  useEffect(() => {
    if (phase === "complete") {
      if (finishAudioRef.current) {
        try {
          finishAudioRef.current.currentTime = 0;
          finishAudioRef.current.play().catch(() => {});
        } catch {}
      }

      const { correct, incorrect, ignored, totalScore } = calculateResults();
      const childDataString = localStorage.getItem("childData");
      const childData = childDataString ? JSON.parse(childDataString) : {};

      const resultsToSave = {
        testType: "gender-identification",
        correct,
        incorrect,
        ignored,
        totalScore,
        totalPhotos: photos.length,
        childName: `${childData?.firstName || ""} ${childData?.lastName || ""}`,
        childIQ: childData?.iq || "",
        completedAt: new Date().toISOString(),
      };

      localStorage.setItem("fourthTestResults", JSON.stringify(resultsToSave));

      // Check if we came from test1-5 flow
      const fromTest5 = sessionStorage.getItem("fromTest5");
      if (fromTest5 === "true") {
        // Clear the flag and proceed to test1-5 without showing results
        sessionStorage.removeItem("fromTest5");
        setTimeout(() => {
          router.push("/test1-5/face-choose");
        }, 2000);
      } else {
        // Normal flow - show results
        setTimeout(() => {
          router.push("/test1-4/results");
        }, 2000);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, results]);

  // cleanup on unmount
  useEffect(() => {
    return () => {
      if (globalIntervalRef.current !== null) {
        window.clearInterval(globalIntervalRef.current);
        globalIntervalRef.current = null;
      }
    };
  }, []);

  const getCurrentResults = () => {
    const { correct, incorrect, ignored } = calculateResults();
    return { correct, incorrect, ignored };
  };

  // sanity check: ensure counts sum up
  useEffect(() => {
    const { correct, incorrect, ignored } = calculateResults();
    if (correct + incorrect + ignored !== results.length) {
      console.warn("Result counts mismatch", {
        correct,
        incorrect,
        ignored,
        total: results.length,
      });
    }
  }, [results]);

  // ---------- RENDER ----------
  if (phase === "instructions") {
    return (
      <div className="min-h-screen bg-background p-8" dir="rtl">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <Button variant="outline" size="icon" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-3xl font-bold">الاختبار الخامس: تحديد الجنس</h1>
          </div>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>تعليمات الاختبار</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-lg">
                عند الضغط على "ابدأ الاختبار" سيُشغّل صوت تعريفي واحد تلقائياً
                مرة واحدة.
              </p>
              <p className="text-lg">
                عندما ينتهي هذا الصوت يبدأ المؤقت العام مباشرة — الصور تتغيّر كل
                5 ثوانٍ تلقائياً ولا يتوقف المؤقت أبداً.
              </p>
              <p className="text-lg">
                يمكنك تشغيل صوت لكل صورة إذا رغبت، لكن ذلك لن يوقف أو يعطل
                المؤقت العام.
              </p>
              <p className="text-lg font-semibold text-blue-600">
                انتبه: لديك 5 ثوانٍ لكل صورة — إن لم تُجب تُسجّل الصورة كمنسية.
              </p>
            </CardContent>
          </Card>

          <div className="flex justify-center gap-4">
            <Button onClick={startTest} size="lg">
              <Play className="mr-2 h-5 w-5" />
              ابدأ الاختبار
            </Button>
          </div>
        </div>
      </div>
    );
  }


  if (phase === "photo-display") {
    const currentPhoto = photos[currentPhotoIndex];
    const progress = ((currentPhotoIndex + 1) / photos.length) * 100;
    const { correct, incorrect, ignored } = getCurrentResults();

    return (
      <div className="min-h-screen bg-background p-8" dir="rtl">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <Button variant="outline" size="icon" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex justify-start items-start mb-6">
            <CircularProgress
              timeLeft={displayedTimeRemaining}
              totalTime={10}
              size={80}
              strokeWidth={6}
            />
          </div>

          <div className="text-center mb-8">
            <div className="inline-block p-4 bg-white rounded-lg shadow-lg mb-4">
              <img
                src={currentPhoto.src || "/placeholder.svg"}
                alt={`صورة طفل ${currentPhotoIndex + 1}`}
                className="w-64 h-64 object-cover rounded-lg"
              />
            </div>


            <div className="mb-4">
              <Button
                onClick={playFacememForCurrentPhoto}
                size="sm"
                className="px-4 py-2 mb-2"
                disabled={facememPlaying || introPlaying}
              >
                🔊
              </Button>

              {introPlaying ? (
                <div className="text-sm text-yellow-600">
                  الصوت التعريفي يعمل — لا يمكنك الإجابة الآن.
                </div>
              ) : facememPlaying ? (
                <div className="text-sm text-yellow-600">الصوت يعمل...</div>
              ) : photoElapsed === null ? (
                <div className="text-sm text-gray-500">
                  الاختبار سيبدأ بعد انتهاء الصوت التعريفي.
                </div>
              ) : (
                <div className="text-sm text-green-600">يمكنك الآن الإجابة</div>
              )}
            </div>

            <div className="flex justify-center gap-8">
              <div className="flex flex-col items-center">
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => handleAnswer("boy")}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleAnswer("boy");
                    }
                  }}
                  className={`p-2 rounded-md mb-2 cursor-pointer focus:outline-none focus:ring-2 ${
                    introPlaying || photoElapsed === null
                      ? "bg-gray-300 cursor-not-allowed"
                      : "bg-blue-600 focus:ring-blue-400"
                  }`}
                  style={{ display: "inline-block" }}
                >
                  <img
                    src="/boy.png"
                    alt="ولد"
                    className="w-16 h-16 object-cover rounded"
                  />
                </div>
              </div>

              <div className="flex flex-col items-center">
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => handleAnswer("girl")}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleAnswer("girl");
                    }
                  }}
                  className={`p-2 rounded-md mb-2 cursor-pointer focus:outline-none focus:ring-2 ${
                    introPlaying || photoElapsed === null
                      ? "bg-gray-300 cursor-not-allowed"
                      : "bg-pink-600 focus:ring-pink-400"
                  }`}
                  style={{ display: "inline-block" }}
                >
                  <img
                    src="/girl.png"
                    alt="بنت"
                    className="w-16 h-16 object-cover rounded"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 mx-auto border-4 border-blue-500 rounded-full flex items-center justify-center text-xl font-bold">
              {displayedTimeRemaining}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (phase === "complete") {
    return (
      <div
        className="min-h-screen bg-background p-8 flex items-center justify-center"
        dir="rtl"
      >
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">الاختبار انتهى</h1>
          <p className="text-lg">...يتم الآن توجيهك إلى صفحة النتائج</p>
        </div>
      </div>
    );
  }

  return null;
}
