import { adminConfigured, isAdmin } from "@/lib/blog/auth";
import { listAdmin } from "@/lib/blog/store";
import { LoginForm, SetupNotice } from "@/components/blog/AdminGate";
import { PostList } from "@/components/blog/PostList";

export const dynamic = "force-dynamic";

export default async function AdminBlogs() {
  if (!adminConfigured()) return <SetupNotice />;
  if (!(await isAdmin())) return <LoginForm />;
  return <PostList initial={await listAdmin()} />;
}
