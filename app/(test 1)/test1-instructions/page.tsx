"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";

export default function TestInstructionsPage() {
  const [childData, setChildData] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasPlayedInstructions, setHasPlayedInstructions] = useState(false);
  const [audioSupported, setAudioSupported] = useState(true);
  const router = useRouter();

  // audio sources in public/
  const audioSrcs = ["/audio/testCat1.ogg", "/audio/testCat2.ogg"];

  const audioRefs = useRef<HTMLAudioElement[]>([]);
  const currentIndex = useRef<number>(0);

  useEffect(() => {
    const data = localStorage.getItem("childData");
    if (!data) {
      router.push("/");
      return;
    }
    setChildData(JSON.parse(data));

    if (typeof window === "undefined") return;

    // create Audio objects and preload
    audioRefs.current = audioSrcs.map((src) => {
      const a = new Audio(src);
      a.preload = "auto";
      return a;
    });

    // basic support check for ogg (best-effort)
    const testAudio = document.createElement("audio");
    const canPlayOgg =
      !!testAudio.canPlayType &&
      testAudio.canPlayType('audio/ogg; codecs="vorbis"') !== "";
    setAudioSupported(canPlayOgg || true); // set true as fallback because many browsers support ogg

    // cleanup on unmount
    return () => {
      audioRefs.current.forEach((a) => {
        a.pause();
        a.src = "";
      });
      audioRefs.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const playSequence = async (start = 0) => {
    if (!audioRefs.current || audioRefs.current.length === 0) {
      alert("لم يتم العثور على ملفات الصوت.");
      return;
    }

    setIsPlaying(true);
    setHasPlayedInstructions(false);
    currentIndex.current = start;

    const playAt = (index: number) => {
      if (!audioRefs.current[index]) {
        // nothing to play
        setIsPlaying(false);
        setHasPlayedInstructions(true);
        return;
      }

      const audio = audioRefs.current[index];
      audio.currentTime = 0;

      // remove previous handlers to avoid duplicates
      audio.onended = null;
      audio.onerror = null;

      audio.onended = () => {
        const next = index + 1;
        if (next < audioRefs.current.length) {
          currentIndex.current = next;
          playAt(next);
        } else {
          setIsPlaying(false);
          setHasPlayedInstructions(true);
        }
      };

      audio.onerror = () => {
        setIsPlaying(false);
        alert("حدث خطأ أثناء تشغيل ملف الصوت.");
      };

      // attempt to play (user clicked so should be allowed)
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          setIsPlaying(false);
          alert(
            "المتصفح منع التشغيل التلقائي — الرجاء الضغط مجدداً لتشغيل التعليمات الصوتية."
          );
        });
      }
    };

    playAt(start);
  };

  const stopSequence = () => {
    audioRefs.current.forEach((a) => {
      try {
        a.pause();
        a.currentTime = 0;
        a.onended = null;
        a.onerror = null;
      } catch (e) {
        // ignore
      }
    });
    setIsPlaying(false);
  };

  const startTest = () => {
    if (isPlaying) {
      stopSequence();
    }
    router.push("/test1-1/visual-search");
  };

  if (!childData) {
    return <div>جاري التحميل...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gray-800">
            مرحباً {childData.firstName}!
          </CardTitle>
          <p className="text-gray-600 mt-2">
            استعد لبدء الاختبار الأول - الانتباه
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Rich RTL instructions block — replace the old blue box with this */}
          <div
            className="bg-gradient-to-r from-blue-50 to-white p-6 rounded-2xl shadow-sm border border-blue-100 text-right"
            dir="rtl"
            role="region"
            aria-label="تعليمات الاختبار المفصلة"
          >
            <h3 className="font-bold text-blue-800 mb-4 text-lg">
              تعليمات الاختبار:
            </h3>

            <div className="space-y-3 text-blue-700 text-sm leading-relaxed">
              <p className="font-semibold">
                1- اختبار الانتباه : يحتوي هذا الاختبار على جزئين:
              </p>

              <div className="space-y-2 pl-4">
                <div>
                  <p className="font-medium">
                    1-1- اختبار الانتباه البصري (Test d'attention visuelle) :
                  </p>
                  <ul className="list-disc list-inside text-gray-700 mt-1 space-y-1">
                    <li>
                      البند الثاني : البند الخاص بانتقاء القطط (Item des chats).
                    </li>
                    <li>
                      البند الثالث : بند اختيار الوجوه (Item des visages).
                    </li>
                  </ul>
                </div>

                <div className="mt-2">
                  <p className="font-medium">
                    1-2- اختبار الانتباه السمعي (Test d'attention auditive) :
                  </p>
                  <ul className="list-disc list-inside text-gray-700 mt-1 space-y-1">
                    <li>البند (أ) : بند المربعات 1.</li>
                    <li>البند (ب) : بند المربعات 2.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-center pt-4">
            <Button
              onClick={startTest}
              className="bg-green-600 hover:bg-green-700 text-white px-12 py-4 text-lg font-medium"
            >
              بدء اختبار الانتباه البصري
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
