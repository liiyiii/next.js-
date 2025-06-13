'use client';

import { StagewiseToolbar } from '@stagewise/toolbar-next';
import { ReactPlugin } from '@stagewise-plugins/react';

export default function StagewiseToolbarWrapper() {
  return (
    <StagewiseToolbar
      enabled={process.env.NODE_ENV === 'development'}
      config={{
        plugins: [ReactPlugin]
      }}
    />
  );
} 