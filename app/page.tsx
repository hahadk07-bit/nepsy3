"use client";

import type React from "react";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { apiPost } from "@/lib/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiGet } from "@/lib/api";
import { clearAllDeduplicationFlags } from "@/lib/result-deduplication";
import Link from "next/link";

type Child = {
  id: number;
  firstName: string;
  lastName: string;
  iq: number;
};

export default function RegistrationPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [iq, setIq] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const router = useRouter();

  useEffect(() => {
    apiGet<Child[]>("/children")
      .then(setChildren)
      .catch(() => {});
  }, []);

  const selectedChild = useMemo(
    () => children.find((c) => String(c.id) === selectedId) || null,
    [children, selectedId]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsLoading(true);

    if (selectedChild) {
      // Use existing child
      localStorage.setItem(
        "childData",
        JSON.stringify({
          id: selectedChild.id,
          firstName: selectedChild.firstName,
          lastName: selectedChild.lastName,
          iq: selectedChild.iq,
          startTime: new Date().toISOString(),
        })
      );
      // Clear any previous test result deduplication flags
      clearAllDeduplicationFlags();
      router.push("/tests");
      return;
    }

    // Validate new child fields
    if (!firstName.trim() || !lastName.trim() || !iq.trim()) {
      alert("يرجى ملء جميع الحقول المطلوبة");
      setIsLoading(false);
      return;
    }

    const iqNumber = Number.parseInt(iq);
    if (isNaN(iqNumber) || iqNumber < 50 || iqNumber > 200) {
      alert("يرجى إدخال معدل ذكاء صحيح (50-200)");
      setIsLoading(false);
      return;
    }

    // Create child in backend and store child id locally
    try {
      const created = await apiPost("/children", {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        iq: iqNumber,
      });
      localStorage.setItem(
        "childData",
        JSON.stringify({
          id: created.id,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          iq: iqNumber,
          startTime: new Date().toISOString(),
        })
      );
      // Clear any previous test result deduplication flags
      clearAllDeduplicationFlags();
      router.push("/tests");
      return;
    } catch (err) {
      alert("فشل حفظ بيانات الطفل في الخادم");
      setIsLoading(false);
      return;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-800">
            تقييم الوظائف المعرفية و اللغة
          </CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">
                اختر طفلًا موجودًا
              </Label>
              <Select value={selectedId} onValueChange={setSelectedId}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر من القائمة (اختياري)" />
                </SelectTrigger>
                <SelectContent>
                  {children.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.firstName} {c.lastName} (IQ {c.iq})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedChild ? (
                <div className="text-sm text-blue-700">
                  تم اختيار: {selectedChild.firstName} {selectedChild.lastName}
                </div>
              ) : (
                <div className="text-sm text-gray-500">
                  أو أضف طفلًا جديدًا بالأسفل
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="firstName"
                className="text-sm font-medium text-gray-700"
              >
                الاسم الأول *
              </Label>
              <Input
                id="firstName"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="أدخل الاسم الأول للطفل"
                className="text-right"
                disabled={!!selectedChild}
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="lastName"
                className="text-sm font-medium text-gray-700"
              >
                اسم العائلة *
              </Label>
              <Input
                id="lastName"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="أدخل اسم العائلة"
                className="text-right"
                disabled={!!selectedChild}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="iq" className="text-sm font-medium text-gray-700">
                معدل الذكاء (IQ) *
              </Label>
              <Input
                id="iq"
                type="number"
                min="50"
                max="200"
                value={iq}
                onChange={(e) => setIq(e.target.value)}
                placeholder="أدخل معدل الذكاء (50-200)"
                className="text-right"
                disabled={!!selectedChild}
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3"
              disabled={isLoading}
            >
              {isLoading ? "جاري التحضير..." : "بدء الاختبار"}
            </Button>
          </form>

          <div className="mt-4 flex justify-center">
            <Link href="/children-results">
              <Button variant="outline">عرض جميع النتائج</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
