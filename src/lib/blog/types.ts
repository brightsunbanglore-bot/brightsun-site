export type PostStatus = "draft" | "published";

export type Post = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  /** Clean HTML written in the editor (sanitised on save). */
  content: string;
  coverImage: string;
  coverAlt: string;
  category: string;
  tags: string[];
  author: string;
  status: PostStatus;
  /** ISO date shown on the post. Set the first time it is published. A future date keeps it hidden until then. */
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
  seo: {
    metaTitle: string;
    metaDescription: string;
    focusKeyword: string;
    canonical: string;
    ogImage: string;
    noindex: boolean;
  };
};

export type PostSummary = Pick<Post, "id" | "slug" | "title" | "excerpt" | "coverImage" | "coverAlt" | "category" | "tags" | "author" | "status" | "publishedAt" | "updatedAt">;
