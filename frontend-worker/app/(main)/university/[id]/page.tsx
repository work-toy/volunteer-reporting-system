import UniDetailPage from "./page-client";

export async function generateStaticParams() {
  return Array.from({ length: 112 }, (_, i) => ({ id: String(i + 1) }));
}

export default function Page() {
  return <UniDetailPage />;
}
