"use client";

import React, { useEffect, useRef, useState } from "react";
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

interface FaceRecognitionTestProps {
  onBack: () => void;
}

interface PhotoData {
  id: number;
  src: string;
  correctGender: "boy" | "girl";
}

interface TestResult {
  roundNumber: number;
  selectedPhotoId: number | null;
  correctPhotoId: number;
  isCorrect: boolean | null;
  responseTime: number;
}

export default function FaceRecognitionTest({
  onBack,
}: FaceRecognitionTestProps) {
  const router = useRouter();
  // phases
  const [phase, setPhase] = useState<
    "instructions" | "running" | "photo-display" | "complete"
  >("instructions");

  // rounds & timing
  const totalRounds = 16;
  const [currentRound, setCurrentRound] = useState<number>(0);
  const currentRoundRef = useRef<number>(0);
  useEffect(() => {
    currentRoundRef.current = currentRound;
  }, [currentRound]);

  const [timeRemaining, setTimeRemaining] = useState<number>(5);
  const [startTime, setStartTime] = useState<number>(0);

  // photos for current round + target id
  const [currentPhotos, setCurrentPhotos] = useState<PhotoData[]>([]);
  const [targetPhotoId, setTargetPhotoId] = useState<number>(0);

  // results
  const [results, setResults] = useState<TestResult[]>([]);

  // timers
  const intervalRef = useRef<number | null>(null);
  const audioIntervalRef = useRef<number | null>(null);

  // choose-face intro audio (play when user clicks "ابدأ الاختبار")
  const chooseAudioRef = useRef<HTMLAudioElement | null>(null);
  const clickAudioRef = useRef<HTMLAudioElement | null>(null);
  const [introPlaying, setIntroPlaying] = useState<boolean>(false);
  const introPlayedRef = useRef<boolean>(false);

  // keep a persistent banner visible once audio play has been attempted
  const [introBannerVisible, setIntroBannerVisible] = useState<boolean>(false);

  // protect against double-clicks in a single round
  const roundLockedRef = useRef<boolean>(false);

  // ---------- images ----------
  const allPhotos: PhotoData[] = [
    // targets 1..16
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

    // distractors 17..49 (ensure they exist)
    { id: 17, src: "/facetTest2/boy17.jpeg", correctGender: "boy" },
    { id: 18, src: "/facetTest2/boy18.jpeg", correctGender: "boy" },
    { id: 19, src: "/facetTest2/boy19.jpeg", correctGender: "boy" },
    { id: 20, src: "/facetTest2/boy24.jpeg", correctGender: "boy" },
    { id: 21, src: "/facetTest2/boy25.jpeg", correctGender: "boy" },
    { id: 22, src: "/facetTest2/boy28.jpeg", correctGender: "boy" },
    { id: 23, src: "/facetTest2/boy29.jpeg", correctGender: "boy" },
    { id: 24, src: "/facetTest2/boy30.jpeg", correctGender: "boy" },
    { id: 25, src: "/facetTest2/boy31.jpeg", correctGender: "boy" },
    { id: 26, src: "/facetTest2/boy34.jpeg", correctGender: "boy" },
    { id: 27, src: "/facetTest2/boy35.jpeg", correctGender: "boy" },
    { id: 28, src: "/facetTest2/boy40.jpeg", correctGender: "boy" },
    { id: 29, src: "/facetTest2/boy41.jpeg", correctGender: "boy" },
    { id: 30, src: "/facetTest2/boy44.jpeg", correctGender: "boy" },
    { id: 31, src: "/facetTest2/boy45.jpeg", correctGender: "boy" },
    { id: 32, src: "/facetTest2/boy46.jpeg", correctGender: "boy" },
    { id: 33, src: "/facetTest2/boy47.jpeg", correctGender: "boy" },
    { id: 34, src: "/facetTest2/boy5.jpeg", correctGender: "boy" },
    { id: 35, src: "/facetTest2/boy7.jpeg", correctGender: "boy" },
    { id: 36, src: "/facetTest2/boy8.jpeg", correctGender: "boy" },
    { id: 37, src: "/facetTest2/boy9.jpeg", correctGender: "boy" },
    { id: 38, src: "/facetTest2/girl20.jpeg", correctGender: "girl" },
    { id: 39, src: "/facetTest2/girl21.jpeg", correctGender: "girl" },
    { id: 40, src: "/facetTest2/girl22.jpeg", correctGender: "girl" },
    { id: 41, src: "/facetTest2/girl23.jpeg", correctGender: "girl" },
    { id: 42, src: "/facetTest2/girl26.jpeg", correctGender: "girl" },
    { id: 43, src: "/facetTest2/girl27.jpeg", correctGender: "girl" },
    { id: 44, src: "/facetTest2/girl32.jpeg", correctGender: "girl" },
    { id: 45, src: "/facetTest2/girl33.jpeg", correctGender: "girl" },
    { id: 46, src: "/facetTest2/girl36.jpeg", correctGender: "girl" },
    { id: 47, src: "/facetTest2/girl37.jpeg", correctGender: "girl" },
    { id: 48, src: "/facetTest2/girl38.jpeg", correctGender: "girl" },
    { id: 49, src: "/facetTest2/girl39.jpeg", correctGender: "girl" },
  ];

  // init choose-face audio on mount (we will call play() inside startTest user-click)
  useEffect(() => {
    try {
      chooseAudioRef.current = new Audio("/audio/choose-face.ogg");
      if (chooseAudioRef.current) chooseAudioRef.current.volume = 0.95;
    } catch {
      chooseAudioRef.current = null;
    }

    try {
      clickAudioRef.current = new Audio("/audio/click.wav");
      if (clickAudioRef.current) clickAudioRef.current.volume = 0.9;
    } catch {
      clickAudioRef.current = null;
    }

    return () => {
      try {
        if (chooseAudioRef.current) {
          chooseAudioRef.current.pause();
          chooseAudioRef.current.src = "";
        }
      } catch {}
      chooseAudioRef.current = null;
      
      try {
        if (clickAudioRef.current) {
          clickAudioRef.current.pause();
          clickAudioRef.current.src = "";
        }
      } catch {}
      clickAudioRef.current = null;
    };
  }, []);

  // small helper: speak TTS question (optional)
  const speakText = (text: string) => {
    if (typeof window === "undefined") return;
    if ("speechSynthesis" in window) {
      try {
        const ut = new SpeechSynthesisUtterance(text);
        ut.lang = "ar-SA";
        ut.rate = 0.9;
        ut.pitch = 1;
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(ut);
      } catch {}
    }
  };

  // -------------------------
  // generate photos for the current round (without starting timers)
  // -------------------------
  const prepareRound = () => {
    const round = currentRoundRef.current; // 0-based
    const targetId = round + 1; // 1..16
    const d1Id = 17 + round * 2;
    const d2Id = d1Id + 1;

    const target = allPhotos.find((p) => p.id === targetId);
    const d1 = allPhotos.find((p) => p.id === d1Id);
    const d2 = allPhotos.find((p) => p.id === d2Id);

    const arr: PhotoData[] = [];
    if (target) arr.push(target);
    if (d1) arr.push(d1);
    if (d2) arr.push(d2);

    // shuffle positions
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = arr[i];
      arr[i] = arr[j];
      arr[j] = tmp;
    }

    setCurrentPhotos(arr);
    setTargetPhotoId(targetId);
  };

  // timers management
  const clearTimers = () => {
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (audioIntervalRef.current !== null) {
      window.clearInterval(audioIntervalRef.current);
      audioIntervalRef.current = null;
    }
  };

  // start timers & TTS for the current prepared round (assumes prepareRound already called)
  const startTimersForPreparedRound = () => {
    clearTimers();

    setPhase("photo-display");
    setTimeRemaining(5);
    setStartTime(Date.now());
    roundLockedRef.current = false;

    // // speak question immediately and every 5s while the round is active
    // speakText("أي من هذه الوجوه رأيته من قبل في الاختبار السابق؟");
    // audioIntervalRef.current = window.setInterval(() => {
    //   speakText("أي من هذه الوجوه رأيته من قبل في الاختبار السابق؟");
    // }, 5000);

    // countdown timer (1s)
    intervalRef.current = window.setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          // time up -> record ignored and advance
          handleResponse(null);
          return 5; // reset (will be set again by next round)
        }
        return prev - 1;
      });
    }, 1000);
  };

  // show next round: prepare photos and start timers immediately (used after intro)
  const showNextRound = () => {
    clearTimers();

    if (currentRoundRef.current >= totalRounds) {
      setPhase("complete");
      return;
    }

    prepareRound();
    // start timers immediately
    startTimersForPreparedRound();
  };

  // -----------------------------
  // START THE TEST: play intro audio inside this user-initiated handler,
  // show photos immediately (prepareRound) but DON'T start the countdown until audio ends.
  // -----------------------------
  const startTest = async () => {
    // reset results & round index
    setResults([]);
    currentRoundRef.current = 0;
    setCurrentRound(0);
    setPhase("running");

    // mark banner visible (persist)
    setIntroBannerVisible(true);

    // prepare round photos and show them (photo-display view) but keep timers paused
    prepareRound();
    setPhase("photo-display");
    setTimeRemaining(5);
    roundLockedRef.current = true; // lock clicks until audio ends

    // play audio (user gesture)
    const audio = chooseAudioRef.current;
    if (!audio) {
      // no audio -> start timers right away
      roundLockedRef.current = false;
      startTimersForPreparedRound();
      return;
    }

    // if already played before, just start timers
    if (introPlayedRef.current) {
      startTimersForPreparedRound();
      return;
    }

    setIntroPlaying(true);

    const onIntroEnded = () => {
      setIntroPlaying(false);
      introPlayedRef.current = true;
      // unlock clicks and start the countdown for this prepared round
      roundLockedRef.current = false;
      startTimersForPreparedRound();
    };

    audio.addEventListener("ended", onIntroEnded, { once: true });
    audio.currentTime = 0;

    try {
      // this is invoked inside a user click -> browsers should allow it
      await audio.play();
    } catch (err) {
      // play blocked or error -> proceed anyway
      console.warn("choose-face audio play blocked or failed:", err);
      setIntroPlaying(false);
      try {
        audio.removeEventListener("ended", onIntroEnded as EventListener);
      } catch {}
      introPlayedRef.current = true;
      roundLockedRef.current = false;
      startTimersForPreparedRound();
    }
  };

  // handle a selection (or null when ignored)
  const handleResponse = (selectedPhotoId: number | null) => {
    // ignore clicks while intro is playing / locked
    if (introPlaying || roundLockedRef.current) return;
    if (roundLockedRef.current) return;

    roundLockedRef.current = true; // prevent double responses

    // play click audio
    if (clickAudioRef.current) {
      clickAudioRef.current.currentTime = 0;
      clickAudioRef.current.play().catch(() => {});
    }

    // stop timers for this round
    clearTimers();

    const responseTime = Date.now() - startTime;
    const isCorrect = selectedPhotoId === targetPhotoId;

    const result: TestResult = {
      roundNumber: currentRoundRef.current + 1,
      selectedPhotoId,
      correctPhotoId: targetPhotoId,
      isCorrect: selectedPhotoId === null ? null : isCorrect,
      responseTime,
    };

    setResults((prev) => [...prev, result]);

    // advance round
    const next = currentRoundRef.current + 1;
    currentRoundRef.current = next;
    setCurrentRound(next);

    // short delay to allow brief feedback
    window.setTimeout(() => {
      if (next < totalRounds) showNextRound();
      else setPhase("complete");
    }, 250);
  };

  const calculateResults = () => {
    const correct = results.filter((r) => r.isCorrect === true).length;
    const incorrect = results.filter((r) => r.isCorrect === false).length;
    const ignored = results.filter((r) => r.selectedPhotoId === null).length;
    const totalScore = correct - incorrect;
    return { correct, incorrect, ignored, totalScore };
  };

  useEffect(() => {
    if (phase === "complete") {
      const { correct, incorrect, ignored, totalScore } = calculateResults();
      const childDataString = localStorage.getItem("childData");
      const childData = childDataString ? JSON.parse(childDataString) : {};

      const resultsToSave = {
        testType: "face-recognition",
        correct,
        incorrect,
        ignored,
        totalScore,
        totalRounds: totalRounds,
        childName: `${childData?.firstName || ""} ${childData?.lastName || ""}`,
        childIQ: childData?.iq || "",
        completedAt: new Date().toISOString(),
      };

      localStorage.setItem("fifthTestResults", JSON.stringify(resultsToSave));

      setTimeout(() => {
        router.push("/test1-5/results");
      }, 500);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimers();
      try {
        if (chooseAudioRef.current) {
          chooseAudioRef.current.pause();
          chooseAudioRef.current.src = "";
        }
      } catch {}
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- RENDER ----------
  // small shared banner element (visible once introBannerVisible becomes true)
  const IntroBanner = () =>
    introBannerVisible ? (
      <div className="mb-4 p-3 rounded-lg text-center">
        {introPlaying ? (
          <div className="text-yellow-700 font-semibold">
            الصوت التعريفي يعمل — لا يمكنك البدء حتى ينتهي.
          </div>
        ) : (
          <div className="text-green-700 font-semibold">
            الصوت التعريفي تم تشغيله.
          </div>
        )}
      </div>
    ) : null;

  if (phase === "instructions") {
    return (
      <div className="min-h-screen bg-background p-8" dir="rtl">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <Button variant="outline" size="icon" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-3xl font-bold">
              اختبار الخامس: التعرف على الوجوه
            </h1>
          </div>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>تعليمات الاختبار</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-lg">
                سوف تشاهد {totalRounds} مجموعات، كل مجموعة تحتوي على 3 وجوه
                أطفال.
              </p>
              <p className="text-lg">كل مجموعة ستظهر لمدة 5 ثوانٍ.</p>
              <p className="text-lg">
                عليك أن تختار الوجه الذي رأيته من قبل في الاختبار السابق (اختبار
                تحديد الجنس).
              </p>
              <p className="text-lg">
                ستسمع السؤال: "أي من هذه الوجوه رأيته من قبل في الاختبار
                السابق؟"
              </p>
              <p className="text-lg font-semibold text-blue-600">
                انتبه: لديك 5 ثوانٍ فقط للإجابة على كل مجموعة!
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
    const progress = ((currentRound + 1) / totalRounds) * 100;
    const { correct, incorrect, ignored } = calculateResults();

    return (
      <div className="min-h-screen bg-background p-8" dir="rtl">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <Button variant="outline" size="icon" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </div>

          {/* keep showing the persistent intro banner in the rounds view too */}
          <IntroBanner />

          <div className="flex justify-start items-start mb-6">
            <CircularProgress
              timeLeft={timeRemaining}
              totalTime={5}
              size={80}
              strokeWidth={6}
            />
          </div>

          <div className="text-center mb-8">
            <div className="flex justify-center gap-8 mb-6">
              {currentPhotos.map((photo, index) => (
                <div key={photo.id} className="flex flex-col items-center">
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => handleResponse(photo.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleResponse(photo.id);
                      }
                    }}
                    className="p-2 bg-white border-2 border-gray-300 hover:border-blue-500 hover:bg-blue-50 rounded-lg cursor-pointer"
                    style={{ display: "inline-block" }}
                  >
                    <img
                      src={photo.src || "/placeholder.svg"}
                      alt={`وجه ${index + 1}`}
                      className="w-48 h-48 object-cover rounded-lg"
                    />
                  </div>
                  <span className="text-lg font-semibold mt-2">
                    {index + 1}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 mx-auto border-4 border-purple-500 rounded-full flex items-center justify-center text-xl font-bold">
              {timeRemaining}
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
