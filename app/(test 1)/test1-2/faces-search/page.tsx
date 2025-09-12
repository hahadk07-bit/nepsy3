"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { CircularProgress } from "@/components/ui/circular-progress";

type FaceImage = {
  id: number;
  src: string;
  isCorrect: boolean;
  emotion: string;
  folder: number;
  filename: string;
  isSelected?: boolean;
  targetType?: "first" | "second" | "none";
};

export default function FaceRecognitionTest() {
  const router = useRouter();

  // ---- UI / test state ----
  const [childData, setChildData] = useState<any>(null);
  const [testImages, setTestImages] = useState<FaceImage[]>([]);
  const [selectedImages, setSelectedImages] = useState<Set<number>>(
    () => new Set()
  );
  const [feedback, setFeedback] = useState<
    Record<number, "correct" | "incorrect">
  >({});
  //ellel
  const [correctSelections, setCorrectSelections] = useState(0);
  const [incorrectSelections, setIncorrectSelections] = useState(0);

  // timer / test control

  const [timeLeft, setTimeLeft] = useState(180);
  const [isTestActive, setIsTestActive] = useState(false);
  const [initialAudioPlayed, setInitialAudioPlayed] = useState(false);
  const [testCompleted, setTestCompleted] = useState(false);

  // ---- audio refs & playback flags ----
  const audioSrcs = ["/audio/face/testface1.ogg", "/audio/face/testface2.ogg"];
  const audioRefs = useRef<HTMLAudioElement[]>([]);
  const autoplayTriggered = useRef(false);
  const clickSoundRef = useRef<HTMLAudioElement | null>(null);
  const finishSoundRef = useRef<HTMLAudioElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [hasPlayedInstructions, setHasPlayedInstructions] = useState(false);
  const [playbackBlocked, setPlaybackBlocked] = useState(false);

  const totalCorrectFaces = useRef<number>(0);

  // files present in each folder (based on your listing)
  const folderFiles: Record<number, string[]> = {
    1: ["happy.jpeg", "normal.jpeg", "sad.jpeg"],
    2: ["happy.jpeg", "normal.jpeg", "sad.jpeg"],
    3: ["happy.jpeg", "normal.jpeg", "sad.jpeg"],
    4: [
      "open-eyes/happy.jpeg",
      "open-eyes/normal.jpeg",
      "close-eyes/happy.jpeg",
      "close-eyes/sad.jpeg",
    ],
  };

  // helper to infer emotion from filename
  const emotionFromFilename = (filename: string) => {
    const fn = filename.toLowerCase();
    if (fn.includes("happy")) return "happy";
    if (fn.includes("sad")) return "sad";
    if (fn.includes("normal") || fn.includes("neutral")) return "neutral";
    return "unknown";
  };

  // build src for a given folder + filename
  const buildSrc = (folder: number, filename: string) =>
    `/images/faces/face${folder}v2/${filename}`;

  // Fisher-Yates shuffle
  const shuffleArray = <T,>(arr: T[]) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  // initialize images and child data — create 10 correct faces (5 for each target) and 66 incorrect faces
  useEffect(() => {
    const testImages: FaceImage[] = [];
    let nextId = 1;

    // Create 5 faces similar to first target (face2 happy)
    const target1Faces = [];
    for (let i = 0; i < 5; i++) {
      target1Faces.push({
        id: nextId++,
        src: buildSrc(2, "happy.jpeg"),
        isCorrect: true,
        emotion: "happy",
        folder: 2,
        filename: "happy.jpeg",
        isSelected: false,
        targetType: "first", // to identify which target this belongs to
      });
    }

    // Create 5 faces similar to second target (face4 sad)
    const target2Faces = [];
    for (let i = 0; i < 5; i++) {
      target2Faces.push({
        id: nextId++,
        src: buildSrc(4, "close-eyes/sad.jpeg"),
        isCorrect: true,
        emotion: "sad",
        folder: 4,
        filename: "close-eyes/sad.jpeg",
        isSelected: false,
        targetType: "second", // to identify which target this belongs to
      });
    }

    // Create 66 incorrect faces from other folders and emotions
    const incorrectFaces = [];
    const incorrectSources = [
      { folder: 1, filename: "happy.jpeg" },
      { folder: 1, filename: "normal.jpeg" },
      { folder: 1, filename: "sad.jpeg" },
      { folder: 2, filename: "normal.jpeg" },
      { folder: 2, filename: "sad.jpeg" },
      { folder: 3, filename: "happy.jpeg" },
      { folder: 3, filename: "normal.jpeg" },
      { folder: 3, filename: "sad.jpeg" },
      { folder: 4, filename: "open-eyes/happy.jpeg" },
      { folder: 4, filename: "open-eyes/normal.jpeg" },
      { folder: 4, filename: "close-eyes/happy.jpeg" },
    ];

    // Repeat incorrect sources to get 66 faces
    for (let i = 0; i < 70; i++) {
      const source = incorrectSources[i % incorrectSources.length];
      const emotion = emotionFromFilename(source.filename);
      incorrectFaces.push({
        id: nextId++,
        src: buildSrc(source.folder, source.filename),
        isCorrect: false,
        emotion,
        folder: source.folder,
        filename: source.filename,
        isSelected: false,
        targetType: "none",
      });
    }

    // Arrange faces: shuffle correct and incorrect images, but keep target groups together
    const allFaces = [
      ...target1Faces, // 5 faces similar to first target
      ...target2Faces, // 5 faces similar to second target
      ...incorrectFaces.slice(0, 60), // 56 incorrect faces
    ];

    // Shuffle the entire array to mix correct and incorrect faces
    const arrangedFaces = shuffleArray(allFaces);

    setTestImages(arrangedFaces);
    totalCorrectFaces.current = 10; // 5 + 5 correct faces

    // load childData safely
    try {
      const data = localStorage.getItem("childData");
      if (!data) {
        router.push("/");
        return;
      }
      setChildData(JSON.parse(data));
    } catch (e) {
      console.warn("Could not parse childData from localStorage", e);
      router.push("/");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // prepare audio elements on mount (and cleanup)
  useEffect(() => {
    if (typeof window === "undefined") return;

    audioRefs.current = audioSrcs.map((src) => {
      const a = new Audio();
      a.src = src;
      a.preload = "auto";
      try {
        a.load();
      } catch {}
      return a;
    });

    try {
      clickSoundRef.current = new Audio("/audio/click.wav");
      clickSoundRef.current.preload = "auto";
      try {
        clickSoundRef.current.load();
      } catch {}
    } catch (e) {
      clickSoundRef.current = null;
      console.warn("Click sound could not be created", e);
    }

    try {
      finishSoundRef.current = new Audio("/audio/finish.wav");
      finishSoundRef.current.preload = "auto";
      try {
        finishSoundRef.current.load();
      } catch {}
    } catch (e) {
      finishSoundRef.current = null;
      console.warn("Finish sound could not be created", e);
    }

    return () => {
      audioRefs.current.forEach((a) => {
        try {
          a.pause();
          a.src = "";
          a.onended = null;
          a.onerror = null;
        } catch {}
      });
      audioRefs.current = [];

      if (clickSoundRef.current) {
        try {
          clickSoundRef.current.pause();
          clickSoundRef.current.src = "";
        } catch {}
        clickSoundRef.current = null;
      }
      if (finishSoundRef.current) {
        try {
          finishSoundRef.current.pause();
          finishSoundRef.current.src = "";
        } catch {}
        finishSoundRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // audio sequence player
  const playSequence = useCallback((start = 0, onFinish?: () => void) => {
    if (!audioRefs.current || audioRefs.current.length === 0) {
      alert("لم يتم العثور على ملفات الصوت.");
      return;
    }

    setIsPlaying(true);
    setHasPlayedInstructions(false);
    setPlaybackBlocked(false);

    let anyPlayed = false;
    let finalErrorCount = 0;

    const tryPlayAt = (index: number) => {
      const audio = audioRefs.current[index];
      if (!audio) {
        setIsPlaying(false);
        setHasPlayedInstructions(anyPlayed);
        if (onFinish) onFinish();
        return;
      }

      audio.onended = null;
      audio.onerror = null;

      audio.onended = () => {
        const next = index + 1;
        if (next < audioRefs.current.length) {
          tryPlayAt(next);
        } else {
          setIsPlaying(false);
          setHasPlayedInstructions(true);
          if (onFinish) onFinish();
        }
      };

      audio.onerror = (ev) => {
        console.error(`Audio error for ${audio.src}`, ev);
        finalErrorCount += 1;
        const next = index + 1;
        if (next < audioRefs.current.length) {
          tryPlayAt(next);
        } else {
          setIsPlaying(false);
          setHasPlayedInstructions(anyPlayed);
          if (finalErrorCount >= audioRefs.current.length && !anyPlayed) {
            alert(
              "تعذر تشغيل ملفات التعليمات الصوتية. تأكد من وجود الملفات وبصيغة مدعومة."
            );
          }
          if (onFinish) onFinish();
        }
      };

      try {
        audio.currentTime = 0;
      } catch {}
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            anyPlayed = true;
          })
          .catch((err) => {
            console.warn(`play() rejected for ${audio.src}`, err);
            setPlaybackBlocked(true);
            setIsPlaying(false);
          });
      } else {
        anyPlayed = true;
      }
    };

    tryPlayAt(start);
  }, []);

  const stopSequence = useCallback(() => {
    audioRefs.current.forEach((a) => {
      try {
        a.pause();
        a.currentTime = 0;
        a.onended = null;
        a.onerror = null;
      } catch {}
    });
    setIsPlaying(false);
  }, []);

  // attempt autoplay once on mount
  useEffect(() => {
    if (!autoplayTriggered.current) {
      autoplayTriggered.current = true;
      setTimeout(() => {
        playSequence(0, () => {
          if (!initialAudioPlayed) {
            setInitialAudioPlayed(true);
            setIsTestActive(true);
          }
        });
      }, 80);
    }
  }, [playSequence, initialAudioPlayed]);

  // timer
  useEffect(() => {
    if (!isTestActive || timeLeft <= 0) return;
    const id = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsTestActive(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [isTestActive, timeLeft]);

  // handle image click
  const handleImageClick = useCallback(
    (imageId: number) => {
      if (!isTestActive || testCompleted) return;
      if (selectedImages.has(imageId)) return;

      const image = testImages.find((i) => i.id === imageId);
      if (!image) return;

      try {
        const cs = clickSoundRef.current;
        if (cs) {
          try {
            cs.currentTime = 0;
          } catch {}
          const p = cs.play();
          if (p !== undefined) p.catch(() => {});
        }
      } catch {}

      setSelectedImages((prev) => {
        const next = new Set(prev);
        next.add(imageId);
        return next;
      });

      setTestImages((prev) =>
        prev.map((img) =>
          img.id === imageId ? { ...img, isSelected: true } : img
        )
      );

      if (image.isCorrect) {
        setCorrectSelections((prev) => {
          const nv = prev + 1;
          if (nv >= totalCorrectFaces.current) {
            setIsTestActive(false);
          }
          return nv;
        });
        setFeedback((prev) => ({ ...prev, [imageId]: "correct" }));
      } else {
        setIncorrectSelections((prev) => prev + 1);
        setFeedback((prev) => ({ ...prev, [imageId]: "incorrect" }));
      }
    },
    [isTestActive, selectedImages, testImages, testCompleted]
  );

  // when test finishes
  useEffect(() => {
    if (!isTestActive && initialAudioPlayed && !testCompleted) {
      stopSequence();
      try {
        const fs = finishSoundRef.current;
        if (fs) {
          try {
            fs.currentTime = 0;
          } catch {}
          const p = fs.play();
          if (p !== undefined) p.catch(() => {});
        }
      } catch {}

      setTestCompleted(true);

      const accuracy =
        correctSelections + incorrectSelections > 0
          ? Math.round(
              (correctSelections / (correctSelections + incorrectSelections)) *
                100
            )
          : 0;

      const results = {
        testType: "face-recognition",
        childName: `${childData?.firstName || ""} ${childData?.lastName || ""}`,
        childIQ: childData?.iq || "",
        correctAnswers: correctSelections,
        incorrectAnswers: incorrectSelections,
        totalTargets: totalCorrectFaces.current,
        accuracy,
        timeUsed: 180 - timeLeft,
        completedAt: new Date().toISOString(),
      };

      try {
        localStorage.setItem("secondTestResults", JSON.stringify(results));
      } catch (e) {
        console.warn("Could not save results to localStorage", e);
      }

      setTimeout(() => {
        router.push("/test1-2/results");
      }, 2000);
    }
  }, [
    isTestActive,
    initialAudioPlayed,
    correctSelections,
    incorrectSelections,
    timeLeft,
    childData,
    stopSequence,
    testCompleted,
    router,
  ]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // targets: still show representative examples (face4 sad + face2 happy)
  const targetSadSrc = buildSrc(4, "close-eyes/sad.jpeg");
  const targetHappySrc = buildSrc(2, "happy.jpeg");

  // UI guard
  if (!childData && testImages.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        جاري التحميل...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4" dir="rtl">
      <div className=" mx-auto">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center mb-6">
              <CircularProgress
                timeLeft={timeLeft}
                totalTime={50}
                size={80}
                strokeWidth={6}
              />

              {/* Target images */}
              <div className="flex-1 flex justify-center">
                <div className="inline-flex gap-3 items-center bg-white p-3 rounded-lg border-2 border-purple-200">
                  <div className="inline-block p-2 bg-white rounded-lg">
                    <Image
                      src={targetSadSrc}
                      alt="Target sad"
                      width={66}
                      height={66}
                      className="mx-auto object-cover"
                    />
                  </div>

                  <div className="inline-block p-2 bg-white rounded-lg">
                    <Image
                      src={targetHappySrc}
                      alt="Target happy"
                      width={66}
                      height={66}
                      className="mx-auto object-cover"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Face grid area */}
            <div className="mt-6 max-w-4xl relative mx-auto bg-white rounded-lg overflow-hidden p-4">
              {/* Mixed grid: shuffled correct and incorrect faces */}
              <div>
                <div className="grid grid-cols-10 gap-3">
                  {testImages.map((image) => {
                    const selected = selectedImages.has(image.id);
                    const fb = feedback[image.id];
                    return (
                      <button
                        key={image.id}
                        onClick={() => handleImageClick(image.id)}
                        disabled={!isTestActive || selected || testCompleted}
                        aria-pressed={selected}
                        aria-label={`وجه رقم ${image.id} - ${image.emotion} (folder ${image.folder})`}
                        className={`relative w-20 h-20 border-2 rounded-lg transition-all duration-200 p-0
                          ${
                            selected
                              ? fb === "correct"
                                ? "border-green-500 bg-green-50"
                                : "border-red-500 bg-red-50"
                              : "border-gray-300 hover:border-purple-400 bg-white"
                          }
                          ${
                            !isTestActive
                              ? "opacity-50 cursor-not-allowed"
                              : "cursor-pointer"
                          }`}
                        style={{ overflow: "hidden" }}
                      >
                        <Image
                          src={image.src || "/placeholder.svg"}
                          alt={`Face ${image.id}`}
                          width={100}
                          height={100}
                          className="w-full h-full object-cover"
                        />

                        {selected && (
                          <div className="absolute -top-1 -right-1">
                            {fb === "correct" ? (
                              <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center">
                                <CheckCircle className="w-4 h-4 text-green-600" />
                              </div>
                            ) : (
                              <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center">
                                <XCircle className="w-4 h-4 text-red-600" />
                              </div>
                            )}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* completion overlay */}
        {testCompleted && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md mx-4">
              <CardHeader>
                <CardTitle className="text-center text-xl">
                  انتهى الاختبار!
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <div className="text-lg">
                  <p>الإجابات الصحيحة: {correctSelections}</p>
                  <p>الإجابات الخاطئة: {incorrectSelections}</p>
                  <p>
                    الدقة:{" "}
                    {Math.round(
                      (correctSelections /
                        (correctSelections + incorrectSelections)) *
                        100
                    ) || 0}
                    %
                  </p>
                </div>
                <p className="text-gray-600">جاري الانتقال للنتائج...</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
