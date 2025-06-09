// src/components/DynamicFullScreenModalLoader.tsx
'use client';

import dynamic from 'next/dynamic';
// Ensure the path is correct and the props type is exported from the modal component
import type { FullScreenPreviewModalProps } from '@/components/FullScreenPreviewModal'; 

const FullScreenPreviewModalWithNoSSR = dynamic(
  () => import('@/components/FullScreenPreviewModal'),
  { 
    ssr: false,
    // Optional: Add a loading component if the modal itself has significant initial rendering
    // loading: () => <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[10000]"><p className="text-white">Loading Preview...</p></div>
  }
);

// The loader component accepts the same props as FullScreenPreviewModal
// and passes them down to the dynamically imported component.
export default function DynamicFullScreenModalLoader(props: FullScreenPreviewModalProps) {
  return <FullScreenPreviewModalWithNoSSR {...props} />;
}
