"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { CircularProgress } from "@/components/ui/circular-progress";

interface TestImage {
  id: string;
  src: string;
  isCat: boolean;
  isSelected: boolean;
  isCorrect?: boolean;
  position: { top: string; left: string };
}

export default function VisualSearchTest() {
  const [childData, setChildData] = useState<any>(null);

  // Timer (starts only after initial audio finishes)
  const [timeLeft, setTimeLeft] = useState(180); // 3 minutes
  const [isTestActive, setIsTestActive] = useState(false); // disabled until initial audio done
  const [initialAudioPlayed, setInitialAudioPlayed] = useState(false); // first full playback flag

  // Test state
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [correctSelections, setCorrectSelections] = useState(0);
  const [incorrectSelections, setIncorrectSelections] = useState(0);
  const [testImages, setTestImages] = useState<TestImage[]>([]);

  const router = useRouter();

  // Instruction Audio (sequence)
  const audioSrcs = [
    "/audio/testCat1.ogg",
    "/audio/testCat2.ogg",
    "/audio/finish.wav",
  ];
  const audioRefs = useRef<HTMLAudioElement[]>([]);
  const currentIndex = useRef(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasPlayedInstructions, setHasPlayedInstructions] = useState(false);
  const [playbackBlocked, setPlaybackBlocked] = useState(false);
  const autoplayTriggered = useRef(false);

  // Click sound for image clicks
  const clickSoundRef = useRef<HTMLAudioElement | null>(null);
  // Finish sound to play when test ends
  const finishSoundRef = useRef<HTMLAudioElement | null>(null);

  // Initialize test images (long list as in your snippet)
  useEffect(() => {
    const images: TestImage[] = [
      // Row 1
      {
        id: "img-1",
        src: "/images/v1Test1/apple.png",
        isCat: false,
        isSelected: false,
        position: { top: "5%", left: "8%" },
      },
      {
        id: "img-2",
        src: "/images/v1Test1/face.png",
        isCat: false,
        isSelected: false,
        position: { top: "5%", left: "15%" },
      },
      {
        id: "img-3",
        src: "/images/v1Test1/tree.png",
        isCat: false,
        isSelected: false,
        position: { top: "5%", left: "22%" },
      },
      {
        id: "img-4",
        src: "/images/v1Test1/rabbit.png",
        isCat: false,
        isSelected: false,
        position: { top: "5%", left: "29%" },
      },
      {
        id: "img-5",
        src: "/images/v1Test1/cat.png",
        isCat: true,
        isSelected: false,
        position: { top: "5%", left: "36%" },
      },
      {
        id: "img-6",
        src: "/images/v1Test1/home.png",
        isCat: false,
        isSelected: false,
        position: { top: "5%", left: "43%" },
      },
      {
        id: "img-7",
        src: "/images/v1Test1/train.png",
        isCat: false,
        isSelected: false,
        position: { top: "5%", left: "50%" },
      },
      {
        id: "img-8",
        src: "/images/v1Test1/via.png",
        isCat: false,
        isSelected: false,
        position: { top: "5%", left: "57%" },
      },
      {
        id: "img-9",
        src: "/images/v1Test1/flower.png",
        isCat: false,
        isSelected: false,
        position: { top: "5%", left: "64%" },
      },
      {
        id: "img-10",
        src: "/images/v1Test1/rabbit.png",
        isCat: false,
        isSelected: false,
        position: { top: "5%", left: "71%" },
      },
      {
        id: "img-11",
        src: "/images/v1Test1/cat.png",
        isCat: true,
        isSelected: false,
        position: { top: "5%", left: "78%" },
      },

      // Row 2
      {
        id: "img-12",
        src: "/images/v1Test1/cat.png",
        isCat: true,
        isSelected: false,
        position: { top: "13%", left: "5%" },
      },
      {
        id: "img-13",
        src: "/images/v1Test1/rabbit.png",
        isCat: false,
        isSelected: false,
        position: { top: "13%", left: "12%" },
      },
      {
        id: "img-14",
        src: "/images/v1Test1/home.png",
        isCat: false,
        isSelected: false,
        position: { top: "13%", left: "19%" },
      },
      {
        id: "img-15",
        src: "/images/v1Test1/rabbit.png",
        isCat: false,
        isSelected: false,
        position: { top: "13%", left: "26%" },
      },
      {
        id: "img-16",
        src: "/images/v1Test1/cat.png",
        isCat: true,
        isSelected: false,
        position: { top: "13%", left: "33%" },
      },
      {
        id: "img-17",
        src: "/images/v1Test1/home.png",
        isCat: false,
        isSelected: false,
        position: { top: "13%", left: "40%" },
      },
      {
        id: "img-18",
        src: "/images/v1Test1/rabbit.png",
        isCat: false,
        isSelected: false,
        position: { top: "13%", left: "47%" },
      },
      {
        id: "img-19",
        src: "/images/v1Test1/face.png",
        isCat: false,
        isSelected: false,
        position: { top: "13%", left: "54%" },
      },
      {
        id: "img-20",
        src: "/images/v1Test1/rabbit.png",
        isCat: false,
        isSelected: false,
        position: { top: "13%", left: "61%" },
      },
      {
        id: "img-21",
        src: "/images/v1Test1/cat.png",
        isCat: true,
        isSelected: false,
        position: { top: "13%", left: "68%" },
      },
      {
        id: "img-22",
        src: "/images/v1Test1/home.png",
        isCat: false,
        isSelected: false,
        position: { top: "13%", left: "75%" },
      },

      // Row 3
      {
        id: "img-23",
        src: "/images/v1Test1/apple.png",
        isCat: false,
        isSelected: false,
        position: { top: "21%", left: "8%" },
      },
      {
        id: "img-24",
        src: "/images/v1Test1/tree.png",
        isCat: false,
        isSelected: false,
        position: { top: "21%", left: "15%" },
      },
      {
        id: "img-25",
        src: "/images/v1Test1/apple.png",
        isCat: false,
        isSelected: false,
        position: { top: "21%", left: "22%" },
      },
      {
        id: "img-26",
        src: "/images/v1Test1/flower.png",
        isCat: false,
        isSelected: false,
        position: { top: "21%", left: "29%" },
      },
      {
        id: "img-27",
        src: "/images/v1Test1/apple.png",
        isCat: false,
        isSelected: false,
        position: { top: "21%", left: "36%" },
      },
      {
        id: "img-28",
        src: "/images/v1Test1/rabbit.png",
        isCat: false,
        isSelected: false,
        position: { top: "21%", left: "43%" },
      },
      {
        id: "img-29",
        src: "/images/v1Test1/cat.png",
        isCat: true,
        isSelected: false,
        position: { top: "21%", left: "50%" },
      },
      {
        id: "img-30",
        src: "/images/v1Test1/tree.png",
        isCat: false,
        isSelected: false,
        position: { top: "21%", left: "57%" },
      },
      {
        id: "img-31",
        src: "/images/v1Test1/home.png",
        isCat: false,
        isSelected: false,
        position: { top: "21%", left: "64%" },
      },
      {
        id: "img-32",
        src: "/images/v1Test1/tree.png",
        isCat: false,
        isSelected: false,
        position: { top: "21%", left: "71%" },
      },
      {
        id: "img-33",
        src: "/images/v1Test1/cat.png",
        isCat: true,
        isSelected: false,
        position: { top: "21%", left: "78%" },
      },

      // Row 4
      {
        id: "img-34",
        src: "/images/v1Test1/home.png",
        isCat: false,
        isSelected: false,
        position: { top: "29%", left: "5%" },
      },
      {
        id: "img-35",
        src: "/images/v1Test1/rabbit.png",
        isCat: false,
        isSelected: false,
        position: { top: "29%", left: "12%" },
      },
      {
        id: "img-36",
        src: "/images/v1Test1/cat.png",
        isCat: true,
        isSelected: false,
        position: { top: "29%", left: "19%" },
      },
      {
        id: "img-37",
        src: "/images/v1Test1/home.png",
        isCat: false,
        isSelected: false,
        position: { top: "29%", left: "26%" },
      },
      {
        id: "img-38",
        src: "/images/v1Test1/apple.png",
        isCat: false,
        isSelected: false,
        position: { top: "29%", left: "33%" },
      },
      {
        id: "img-39",
        src: "/images/v1Test1/rabbit.png",
        isCat: false,
        isSelected: false,
        position: { top: "29%", left: "40%" },
      },
      {
        id: "img-40",
        src: "/images/v1Test1/cat.png",
        isCat: true,
        isSelected: false,
        position: { top: "29%", left: "47%" },
      },
      {
        id: "img-41",
        src: "/images/v1Test1/tree.png",
        isCat: false,
        isSelected: false,
        position: { top: "29%", left: "54%" },
      },
      {
        id: "img-42",
        src: "/images/v1Test1/rabbit.png",
        isCat: false,
        isSelected: false,
        position: { top: "29%", left: "61%" },
      },
      {
        id: "img-43",
        src: "/images/v1Test1/apple.png",
        isCat: false,
        isSelected: false,
        position: { top: "29%", left: "68%" },
      },
      {
        id: "img-44",
        src: "/images/v1Test1/home.png",
        isCat: false,
        isSelected: false,
        position: { top: "29%", left: "75%" },
      },

      // Row 5
      {
        id: "img-45",
        src: "/images/v1Test1/tree.png",
        isCat: false,
        isSelected: false,
        position: { top: "37%", left: "8%" },
      },
      {
        id: "img-46",
        src: "/images/v1Test1/rabbit.png",
        isCat: false,
        isSelected: false,
        position: { top: "37%", left: "15%" },
      },
      {
        id: "img-47",
        src: "/images/v1Test1/cat.png",
        isCat: true,
        isSelected: false,
        position: { top: "37%", left: "22%" },
      },
      {
        id: "img-48",
        src: "/images/v1Test1/home.png",
        isCat: false,
        isSelected: false,
        position: { top: "37%", left: "29%" },
      },
      {
        id: "img-49",
        src: "/images/v1Test1/apple.png",
        isCat: false,
        isSelected: false,
        position: { top: "37%", left: "36%" },
      },
      {
        id: "img-50",
        src: "/images/v1Test1/rabbit.png",
        isCat: false,
        isSelected: false,
        position: { top: "37%", left: "43%" },
      },
      {
        id: "img-51",
        src: "/images/v1Test1/tree.png",
        isCat: false,
        isSelected: false,
        position: { top: "37%", left: "50%" },
      },
      {
        id: "img-52",
        src: "/images/v1Test1/home.png",
        isCat: false,
        isSelected: false,
        position: { top: "37%", left: "57%" },
      },
      {
        id: "img-53",
        src: "/images/v1Test1/flower.png",
        isCat: false,
        isSelected: false,
        position: { top: "37%", left: "64%" },
      },
      {
        id: "img-54",
        src: "/images/v1Test1/rabbit.png",
        isCat: false,
        isSelected: false,
        position: { top: "37%", left: "71%" },
      },
      {
        id: "img-55",
        src: "/images/v1Test1/apple.png",
        isCat: false,
        isSelected: false,
        position: { top: "37%", left: "78%" },
      },

      // Row 6
      {
        id: "img-56",
        src: "/images/v1Test1/apple.png",
        isCat: false,
        isSelected: false,
        position: { top: "45%", left: "5%" },
      },
      {
        id: "img-57",
        src: "/images/v1Test1/tree.png",
        isCat: false,
        isSelected: false,
        position: { top: "45%", left: "12%" },
      },
      {
        id: "img-58",
        src: "/images/v1Test1/flower.png",
        isCat: false,
        isSelected: false,
        position: { top: "45%", left: "19%" },
      },
      {
        id: "img-59",
        src: "/images/v1Test1/home.png",
        isCat: false,
        isSelected: false,
        position: { top: "45%", left: "26%" },
      },
      {
        id: "img-60",
        src: "/images/v1Test1/apple.png",
        isCat: false,
        isSelected: false,
        position: { top: "45%", left: "33%" },
      },
      {
        id: "img-61",
        src: "/images/v1Test1/rabbit.png",
        isCat: false,
        isSelected: false,
        position: { top: "45%", left: "40%" },
      },
      {
        id: "img-62",
        src: "/images/v1Test1/cat.png",
        isCat: true,
        isSelected: false,
        position: { top: "45%", left: "47%" },
      },
      {
        id: "img-63",
        src: "/images/v1Test1/tree.png",
        isCat: false,
        isSelected: false,
        position: { top: "45%", left: "54%" },
      },
      {
        id: "img-64",
        src: "/images/v1Test1/rabbit.png",
        isCat: false,
        isSelected: false,
        position: { top: "45%", left: "61%" },
      },
      {
        id: "img-65",
        src: "/images/v1Test1/home.png",
        isCat: false,
        isSelected: false,
        position: { top: "45%", left: "68%" },
      },
      {
        id: "img-66",
        src: "/images/v1Test1/apple.png",
        isCat: false,
        isSelected: false,
        position: { top: "45%", left: "75%" },
      },

      // Row 7
      {
        id: "img-67",
        src: "/images/v1Test1/cat.png",
        isCat: true,
        isSelected: false,
        position: { top: "53%", left: "8%" },
      },
      {
        id: "img-68",
        src: "/images/v1Test1/rabbit.png",
        isCat: false,
        isSelected: false,
        position: { top: "53%", left: "15%" },
      },
      {
        id: "img-69",
        src: "/images/v1Test1/tree.png",
        isCat: false,
        isSelected: false,
        position: { top: "53%", left: "22%" },
      },
      {
        id: "img-70",
        src: "/images/v1Test1/home.png",
        isCat: false,
        isSelected: false,
        position: { top: "53%", left: "29%" },
      },
      {
        id: "img-71",
        src: "/images/v1Test1/apple.png",
        isCat: false,
        isSelected: false,
        position: { top: "53%", left: "36%" },
      },
      {
        id: "img-72",
        src: "/images/v1Test1/rabbit.png",
        isCat: false,
        isSelected: false,
        position: { top: "53%", left: "43%" },
      },
      {
        id: "img-73",
        src: "/images/v1Test1/cat.png",
        isCat: true,
        isSelected: false,
        position: { top: "53%", left: "50%" },
      },
      {
        id: "img-74",
        src: "/images/v1Test1/home.png",
        isCat: false,
        isSelected: false,
        position: { top: "53%", left: "57%" },
      },
      {
        id: "img-75",
        src: "/images/v1Test1/flower.png",
        isCat: false,
        isSelected: false,
        position: { top: "53%", left: "64%" },
      },
      {
        id: "img-76",
        src: "/images/v1Test1/tree.png",
        isCat: false,
        isSelected: false,
        position: { top: "53%", left: "71%" },
      },
      {
        id: "img-77",
        src: "/images/v1Test1/rabbit.png",
        isCat: false,
        isSelected: false,
        position: { top: "53%", left: "78%" },
      },

      // Row 8
      {
        id: "img-78",
        src: "/images/v1Test1/apple.png",
        isCat: false,
        isSelected: false,
        position: { top: "61%", left: "5%" },
      },
      {
        id: "img-79",
        src: "/images/v1Test1/home.png",
        isCat: false,
        isSelected: false,
        position: { top: "61%", left: "12%" },
      },
      {
        id: "img-80",
        src: "/images/v1Test1/rabbit.png",
        isCat: false,
        isSelected: false,
        position: { top: "61%", left: "19%" },
      },
      {
        id: "img-81",
        src: "/images/v1Test1/tree.png",
        isCat: false,
        isSelected: false,
        position: { top: "61%", left: "26%" },
      },
      {
        id: "img-82",
        src: "/images/v1Test1/cat.png",
        isCat: true,
        isSelected: false,
        position: { top: "61%", left: "33%" },
      },
      {
        id: "img-83",
        src: "/images/v1Test1/apple.png",
        isCat: false,
        isSelected: false,
        position: { top: "61%", left: "40%" },
      },
      {
        id: "img-84",
        src: "/images/v1Test1/rabbit.png",
        isCat: false,
        isSelected: false,
        position: { top: "61%", left: "47%" },
      },
      {
        id: "img-85",
        src: "/images/v1Test1/home.png",
        isCat: false,
        isSelected: false,
        position: { top: "61%", left: "54%" },
      },
      {
        id: "img-86",
        src: "/images/v1Test1/tree.png",
        isCat: false,
        isSelected: false,
        position: { top: "61%", left: "61%" },
      },
      {
        id: "img-87",
        src: "/images/v1Test1/flower.png",
        isCat: false,
        isSelected: false,
        position: { top: "61%", left: "68%" },
      },
      {
        id: "img-88",
        src: "/images/v1Test1/cat.png",
        isCat: true,
        isSelected: false,
        position: { top: "61%", left: "75%" },
      },

      // Row 9
      {
        id: "img-89",
        src: "/images/v1Test1/rabbit.png",
        isCat: false,
        isSelected: false,
        position: { top: "69%", left: "8%" },
      },
      {
        id: "img-90",
        src: "/images/v1Test1/apple.png",
        isCat: false,
        isSelected: false,
        position: { top: "69%", left: "15%" },
      },
      {
        id: "img-91",
        src: "/images/v1Test1/home.png",
        isCat: false,
        isSelected: false,
        position: { top: "69%", left: "22%" },
      },
      {
        id: "img-92",
        src: "/images/v1Test1/tree.png",
        isCat: false,
        isSelected: false,
        position: { top: "69%", left: "29%" },
      },
      {
        id: "img-93",
        src: "/images/v1Test1/rabbit.png",
        isCat: false,
        isSelected: false,
        position: { top: "69%", left: "36%" },
      },
      {
        id: "img-94",
        src: "/images/v1Test1/apple.png",
        isCat: false,
        isSelected: false,
        position: { top: "69%", left: "43%" },
      },
      {
        id: "img-95",
        src: "/images/v1Test1/cat.png",
        isCat: true,
        isSelected: false,
        position: { top: "69%", left: "50%" },
      },
      {
        id: "img-96",
        src: "/images/v1Test1/home.png",
        isCat: false,
        isSelected: false,
        position: { top: "69%", left: "57%" },
      },
      {
        id: "img-97",
        src: "/images/v1Test1/rabbit.png",
        isCat: false,
        isSelected: false,
        position: { top: "69%", left: "64%" },
      },
      {
        id: "img-98",
        src: "/images/v1Test1/tree.png",
        isCat: false,
        isSelected: false,
        position: { top: "69%", left: "71%" },
      },
      {
        id: "img-99",
        src: "/images/v1Test1/apple.png",
        isCat: false,
        isSelected: false,
        position: { top: "69%", left: "78%" },
      },

      // Row 10
      {
        id: "img-100",
        src: "/images/v1Test1/cat.png",
        isCat: true,
        isSelected: false,
        position: { top: "77%", left: "5%" },
      },
      {
        id: "img-101",
        src: "/images/v1Test1/home.png",
        isCat: false,
        isSelected: false,
        position: { top: "77%", left: "12%" },
      },
      {
        id: "img-102",
        src: "/images/v1Test1/rabbit.png",
        isCat: false,
        isSelected: false,
        position: { top: "77%", left: "19%" },
      },
      {
        id: "img-103",
        src: "/images/v1Test1/tree.png",
        isCat: false,
        isSelected: false,
        position: { top: "77%", left: "26%" },
      },
      {
        id: "img-104",
        src: "/images/v1Test1/apple.png",
        isCat: false,
        isSelected: false,
        position: { top: "77%", left: "33%" },
      },
      {
        id: "img-105",
        src: "/images/v1Test1/rabbit.png",
        isCat: false,
        isSelected: false,
        position: { top: "77%", left: "40%" },
      },
      {
        id: "img-106",
        src: "/images/v1Test1/home.png",
        isCat: false,
        isSelected: false,
        position: { top: "77%", left: "47%" },
      },
      {
        id: "img-107",
        src: "/images/v1Test1/flower.png",
        isCat: false,
        isSelected: false,
        position: { top: "77%", left: "54%" },
      },
      {
        id: "img-108",
        src: "/images/v1Test1/rabbit.png",
        isCat: false,
        isSelected: false,
        position: { top: "77%", left: "61%" },
      },
      {
        id: "img-109",
        src: "/images/v1Test1/tree.png",
        isCat: false,
        isSelected: false,
        position: { top: "77%", left: "68%" },
      },
      {
        id: "img-110",
        src: "/images/v1Test1/cat.png",
        isCat: true,
        isSelected: false,
        position: { top: "77%", left: "75%" },
      },
    ];

    const shiftedImages = images.map((img) => ({
      ...img,
      position: {
        ...img.position,
        left: `${parseFloat(img.position.left) + 8}%`,
      },
    }));
    setTestImages(shiftedImages);
  }, []);

  // Load child data
  useEffect(() => {
    const data = localStorage.getItem("childData");
    if (!data) {
      router.push("/");
      return;
    }
    setChildData(JSON.parse(data));
  }, [router]);

  // Prepare audio elements on mount
  useEffect(() => {
    if (typeof window === "undefined") return;

    // instruction audio files
    audioRefs.current = audioSrcs.map((src) => {
      const a = new Audio();
      a.src = src;
      a.preload = "auto";
      try {
        a.load();
      } catch (e) {}
      return a;
    });

    // click sound
    try {
      clickSoundRef.current = new Audio("/audio/click.wav");
      clickSoundRef.current.preload = "auto";
      try {
        clickSoundRef.current.load();
      } catch (e) {}
    } catch (e) {
      clickSoundRef.current = null;
      console.warn("Click sound could not be created", e);
    }

    // finish sound (played when test ends)
    try {
      finishSoundRef.current = new Audio("/audio/finish.wav");
      finishSoundRef.current.preload = "auto";
      try {
        finishSoundRef.current.load();
      } catch (e) {}
    } catch (e) {
      finishSoundRef.current = null;
      console.warn("Finish sound could not be created", e);
    }

    // cleanup on unmount
    return () => {
      audioRefs.current.forEach((a) => {
        try {
          a.pause();
          a.src = "";
          a.onended = null;
          a.onerror = null;
        } catch (e) {}
      });
      audioRefs.current = [];
      if (clickSoundRef.current) {
        try {
          clickSoundRef.current.pause();
          clickSoundRef.current.src = "";
        } catch (e) {}
        clickSoundRef.current = null;
      }
      if (finishSoundRef.current) {
        try {
          finishSoundRef.current.pause();
          finishSoundRef.current.src = "";
        } catch (e) {}
        finishSoundRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Play instruction audio sequence; optional onFinish called when sequence completes
  const playSequence = useCallback((start = 0, onFinish?: () => void) => {
    if (!audioRefs.current || audioRefs.current.length === 0) {
      alert("لم يتم العثور على ملفات الصوت.");
      return;
    }

    setIsPlaying(true);
    setHasPlayedInstructions(false);
    setPlaybackBlocked(false);
    currentIndex.current = start;

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
      } catch (e) {}
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
      } catch (e) {}
    });
    setIsPlaying(false);
  }, []);

  // Attempt autoplay once when component mounts — if successful, start test after audio finishes.
  useEffect(() => {
    if (!autoplayTriggered.current) {
      autoplayTriggered.current = true;
      setTimeout(() => {
        playSequence(0, () => {
          if (!initialAudioPlayed) {
            setInitialAudioPlayed(true);
            setIsTestActive(true); // start timer & enable clicks
          }
        });
      }, 80);
    }
  }, [playSequence, initialAudioPlayed]);

  // Timer countdown — only runs when isTestActive is true
  useEffect(() => {
    if (!isTestActive || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsTestActive(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isTestActive, timeLeft]);

  // Handle image selection (disabled until isTestActive true)
  const handleImageClick = useCallback(
    (imageId: string) => {
      if (!isTestActive) return;
      const image = testImages.find((img) => img.id === imageId);
      if (!image || selectedImages.includes(imageId)) return;

      // play click sound (user gesture -> usually allowed)
      try {
        const cs = clickSoundRef.current;
        if (cs) {
          try {
            cs.currentTime = 0;
          } catch (e) {}
          const p = cs.play();
          if (p !== undefined) {
            p.catch(() => {});
          }
        }
      } catch (e) {}

      setSelectedImages((prev) => [...prev, imageId]);

      if (image.isCat) {
        setCorrectSelections((prev) => prev + 1);
        const totalCats = testImages.filter((img) => img.isCat).length;
        if (correctSelections + 1 >= totalCats) {
          setIsTestActive(false);
        }
      } else {
        setIncorrectSelections((prev) => prev + 1);
      }

      setTestImages((prev) =>
        prev.map((img) =>
          img.id === imageId
            ? { ...img, isSelected: true, isCorrect: img.isCat }
            : img
        )
      );
    },
    [isTestActive, selectedImages, testImages, correctSelections]
  );

  // When test finishes: stop audio, play finish sound, store results, navigate
  useEffect(() => {
    if (!isTestActive && initialAudioPlayed) {
      // stop any instruction audio
      stopSequence();

      // try play finish sound (ignore errors)
      try {
        const fs = finishSoundRef.current;
        if (fs) {
          try {
            fs.currentTime = 0;
          } catch (e) {}
          const p = fs.play();
          if (p !== undefined) {
            p.catch(() => {
              /* ignore playback errors */
            });
          }
        }
      } catch (e) {
        /* ignore */
      }

      const accuracy =
        (correctSelections / (correctSelections + incorrectSelections)) * 100 ||
        0;
      const testResults = {
        correctSelections,
        incorrectSelections,
        accuracy: Math.round(accuracy),
        timeUsed: 180 - timeLeft,
        totalCats: testImages.filter((img) => img.isCat).length,
        completedAt: new Date().toISOString(),
      };
      localStorage.setItem("test1Results", JSON.stringify(testResults));

      setTimeout(() => {
        router.push("/test1-1/results");
      }, 2000);
    }
  }, [
    isTestActive,
    correctSelections,
    incorrectSelections,
    timeLeft,
    testImages,
    router,
    stopSequence,
    initialAudioPlayed,
  ]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (!childData) {
    return <div>جاري التحميل...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center mb-6">
              <CircularProgress
                timeLeft={timeLeft}
                totalTime={180}
                size={80}
                strokeWidth={6}
              />

              {/* Target image */}
              <div className="flex-1 flex justify-center">
                <div className="inline-block p-3 bg-white border-2 border-blue-500 rounded-lg shadow-lg">
                  <Image
                    src="/images/v1Test1/cat.png"
                    alt="Target cat"
                    width={60}
                    height={60}
                    className="mx-auto"
                  />
                </div>
              </div>
            </div>

            <div
              className="relative w-full aspect-[2.2/1] bg-white max-w-full min-h-[300px] rounded-lg overflow-hidden"
              style={{ height: "auto", minHeight: "300px" }}
            >
              {testImages.map((image) => (
                <button
                  key={image.id}
                  onClick={() => handleImageClick(image.id)}
                  disabled={!isTestActive || selectedImages.includes(image.id)}
                  className={`
                    absolute p-1 rounded-lg border-2 transition-all duration-200
                    ${
                      selectedImages.includes(image.id)
                        ? image.isCorrect
                          ? "border-green-500 bg-green-100"
                          : "border-red-500 bg-red-100"
                        : "border-gray-300 bg-white hover:border-blue-400 hover:bg-blue-50"
                    }
                    ${
                      !isTestActive
                        ? "opacity-50 cursor-not-allowed"
                        : "cursor-pointer"
                    }
                  `}
                  style={{
                    top: image.position.top,
                    left: image.position.left,
                    width: "7vw",
                    maxWidth: "60px",
                    minWidth: "36px",
                    height: "7vw",
                    maxHeight: "60px",
                    minHeight: "36px",
                  }}
                >
                  <Image
                    src={image.src || "/placeholder.svg"}
                    alt={`Test image ${image.id}`}
                    width={50}
                    height={50}
                    className="w-full h-auto"
                  />
                  {selectedImages.includes(image.id) && (
                    <div className="absolute -top-1 -right-1">
                      {image.isCorrect ? (
                        <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                          <svg
                            className="w-3 h-3 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        </div>
                      ) : (
                        <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                          <svg
                            className="w-3 h-3 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </div>
                      )}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Test completion overlay */}
      {!isTestActive && initialAudioPlayed && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle className="text-center text-xl">
                انتهى الاختبار الأول!
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
              <p className="text-gray-600">جاري الانتقال للاختبار التالي...</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
