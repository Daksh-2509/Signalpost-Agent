"use client";

import { useEffect, useState } from "react";

function localTime() {
  const now = new Date();
  return [now.getHours(), now.getMinutes(), now.getSeconds()].map(part => String(part).padStart(2, "0")).join(":");
}

export function LiveTelemetry() {
  const [clock, setClock] = useState("--:--:--");
  const [ping, setPing] = useState<number | null>(null);

  useEffect(() => {
    setClock(localTime());
    const clockTimer = setInterval(() => setClock(localTime()), 1000);
    let pingTimer: ReturnType<typeof setTimeout>;
    function tickPing() {
      setPing(12 + Math.floor(Math.random() * 17));
      pingTimer = setTimeout(tickPing, 2000 + Math.floor(Math.random() * 1001));
    }
    tickPing();
    return () => { clearInterval(clockTimer); clearTimeout(pingTimer); };
  }, []);

  return <div className="telemetry mono console-footer" aria-live="off">
    <span>SYS.OP. [ONLINE] // ENCRYPTED</span>
    <span className="telemetry-clock" aria-label={`Local time: ${clock}`}>{clock}</span>
    <span className="telemetry-network" aria-label={`Simulated network latency: ${ping ?? "pending"} milliseconds`}>
      <span>PING: {ping ?? "--"}ms</span><span className="telemetry-demo">SIMULATED</span>
    </span>
  </div>;
}
