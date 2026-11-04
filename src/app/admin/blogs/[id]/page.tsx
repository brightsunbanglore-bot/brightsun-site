import Link from "next/link";
import { adminConfigured, isAdmin } from "@/lib/blog/auth";
import { getById } from "@/lib/blog/store";
import { LoginForm, SetupNotice } from "@/components/blog/AdminGate";
import { BlogEditor } from "@/components/blog/BlogEditor";

export const dynamic = "force-dynamic";

export default async function EditPost({ params }: { params: Promise<{ id: string }> }) {
  if (!adminConfigured()) return <SetupNotice />;
  if (!(await isAdmin())) return <LoginForm />;
  const post = await getById((await params).id);
  if (!post) {
    return (
      <div className="mx-auto max-w-md rounded-3xl bg-white p-8 text-center">
        <p className="font-hero text-xl font-extrabold text-espresso">That post was not found.</p>
        <Link href="/admin/blogs" className="mt-4 inline-block font-semibold text-flame underline">Back to all blogs</Link>
      </div>
    );
  }
  return <BlogEditor initial={post} />;
}
