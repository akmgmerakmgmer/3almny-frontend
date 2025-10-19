import { cookies } from "next/headers";
import StudyRecordsClient from "./StudyRecordsClient";
import type { StudyRecord, StudyRecordListResponse } from "@/services/study-records";
import type { UserResponse } from "@/services/users";

type PageProps = {
  params: Promise<{ lang: string }>
};

export default async function StudyRecordsPage({ params }: PageProps) {
  const { lang } = await params;
  const resolvedLang = lang || "en";
  const base = process.env.NEXT_PUBLIC_API_BASE?.replace(/\/$/, "") || "";

  let initialUser: UserResponse["user"] | null = null;
  let initialRecords: StudyRecord[] = [];
  let unauthorized = false;

  if (base) {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();
    try {
      const meRes = await fetch(base + "/users/me", {
        headers: { Cookie: cookieHeader, "Content-Type": "application/json" },
        cache: "no-store",
      });
      if (meRes.ok) {
        const meJson = (await meRes.json()) as UserResponse;
        initialUser = meJson.user;
      } else if (meRes.status === 401) {
        unauthorized = true;
      }
    } catch {}

    try {
      const recRes = await fetch(base + "/users/records?limit=20&offset=0", {
        headers: { Cookie: cookieHeader, "Content-Type": "application/json" },
        cache: "no-store",
      });
      if (recRes.ok) {
        const recJson = (await recRes.json()) as StudyRecordListResponse;
        initialRecords = recJson.records || [];
      } else if (recRes.status === 401) {
        unauthorized = true;
      }
    } catch {}
  }

  return (
    <StudyRecordsClient
      lang={resolvedLang}
      initialUser={initialUser}
      initialRecords={initialRecords}
      initialUnauthorized={unauthorized}
    />
  );
}
