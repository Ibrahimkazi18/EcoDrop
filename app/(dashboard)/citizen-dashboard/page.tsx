"use client"

import TestApiKey from "@/components/testApi";
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
      <TestApiKey />
    </div>
  )
}

export default DashboardPage