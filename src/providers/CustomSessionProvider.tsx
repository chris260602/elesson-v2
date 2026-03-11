"use client";

import { useSession } from "next-auth/react";
import { useEffect } from "react";

export default function CustomSessionProvider({
  children,
}: {
  children: React.ReactNode;
}): React.ReactNode {
  const session = useSession();
  useEffect(() => {
    async function handleSessionUpdate() {
      await session.update({});
    }
    handleSessionUpdate();
  }, []);

  return <div>{children}</div>;
}
