import { AboutForm } from "@/components/admin/AboutForm";
import { getAboutForAdmin } from "@/lib/admin/data";

export default async function AdminAboutPage() {
  const about = await getAboutForAdmin();

  return (
    <>
      <h1 className="mb-6 text-xl font-bold text-slate-100">소개 섹션</h1>
      <AboutForm about={about} />
    </>
  );
}
