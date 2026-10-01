import { siteConfig } from "@/lib/site";

// Temporary foundation page. The real homepage is built in Phase 3.
export default function Home() {
  return (
    <main className="flex flex-1 items-center justify-center px-6">
      <div className="max-w-md text-center">
        <h1 className="text-4xl font-semibold tracking-tight">{siteConfig.name}</h1>
        <p className="mt-4 text-base leading-relaxed text-stone-600">
          Foundation is in place. The storefront arrives in the next phases.
        </p>
      </div>
    </main>
  );
}
