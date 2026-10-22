import React from 'react';
import NexusPlatformBadge from '@/components/admin/NexusPlatformBadge';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <NexusPlatformBadge />
    </>
  );
}
