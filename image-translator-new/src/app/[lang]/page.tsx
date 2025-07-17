import Link from 'next/link';

// This is now a very simple Server Component.
// It does not import any other custom components.
// If this page compiles, the error lies within one of the section components.
export default async function HomePage({ params }: { params: { lang: string } }) {
  return (
    <div>
      <h1>Test Page</h1>
      <p>Current language: {params.lang}</p>
      <p>This is a simplified page to isolate the 'client-only' error.</p>
      <Link href={`/${params.lang}/tool`}>Go to Tool Page</Link>
    </div>
  );
}
