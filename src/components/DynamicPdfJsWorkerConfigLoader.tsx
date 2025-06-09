// src/components/DynamicPdfJsWorkerConfigLoader.tsx
'use client';

import dynamic from 'next/dynamic';

const PdfJsWorkerConfigWithNoSSR = dynamic(
  () => import('@/components/PdfJsWorkerConfig'),
  { ssr: false }
);

export default function DynamicPdfJsWorkerConfigLoader() {
  return <PdfJsWorkerConfigWithNoSSR />;
}
