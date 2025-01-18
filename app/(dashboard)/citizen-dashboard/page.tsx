"use client"

import { useEffect, useState } from "react";

const DashboardPage = () => {

  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if(!isMounted) return null;

  return (
    <div>
      Hello
    </div>
  )
}

export default DashboardPage