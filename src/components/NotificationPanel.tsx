import React, { useState, useEffect } from "react";
import { Terminal, Shield, RefreshCw, Layers, CheckCircle } from "lucide-react";

interface DevLog {
  logs: string[];
}

export default function NotificationPanel() {
  const [logs, setLogs] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch log events from the backend server
  const fetchDevLogs = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch("/api/dev-logs");
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      }
    } catch (e) {
      console.error("Failed to retrieve system OTP logs from backend", e);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDevLogs();
    // Poll the dev log tracker every 4 seconds to catch new OTP events immediately
    const poll = setInterval(fetchDevLogs, 4000);
    return () => clearInterval(poll);
  }, []);

  return (
    <div
      className="fixed bottom-4 right-4 z-50 flex flex-col items-end"
      id="dev-notification-panel"
    >
      {/* Floating Action Button */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) fetchDevLogs();
        }}
        className="flex items-center justify-center w-10 h-10 bg-gradient-to-tr from-zinc-950 to-zinc-900 hover:from-zinc-900 hover:to-zinc-800 border border-zinc-800 rounded-full text-cyan-400 shadow-[0_0_20px_rgba(0,0,0,0.8)] transition-all duration-300 transform hover:scale-105 active:scale-95"
        title="Diagnostic Console"
      >
        <Terminal className="w-4 h-4 animate-pulse text-zinc-450 hover:text-cyan-400" />
      </button>

      {/* Accordion Content Box */}
      {isOpen && (
        <div className="mt-3 w-96 max-w-[calc(100vw-2rem)] bg-slate-950/95 border border-zinc-800/90 rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.9)] backdrop-blur-2xl">
          {/* Header */}
          <div className="bg-slate-900 border-b border-zinc-800 p-3.5 flex justify-between items-center">
            <div className="flex items-center gap-2 text-zinc-300">
              <Shield className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-mono font-bold tracking-tight uppercase">
                Server Security Console
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={fetchDevLogs}
                disabled={isRefreshing}
                className="p-1 hover:bg-slate-800 rounded text-zinc-400 hover:text-white transition-colors disabled:opacity-50"
                title="Force refresh backend logs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>

          {/* Log List View */}
          <div className="p-3 bg-zinc-950 max-h-[220px] overflow-y-auto space-y-2 select-text font-mono text-[11px]">
            {logs.length === 0 ? (
              <div className="text-zinc-600 text-center py-6 text-xs italic">
                No telemetry activity logged. Try triggering an SMS/Email OTP at checkout to see system outputs here!
              </div>
            ) : (
              logs.map((log, idx) => {
                const isOtp = log.includes("OTP SENT");
                return (
                  <div
                    key={idx}
                    className={`p-2 rounded-lg border leading-relaxed select-text ${
                      isOtp
                        ? "bg-cyan-950/20 border-cyan-900/40 text-cyan-300"
                        : "bg-stone-900/40 border-stone-850/40 text-zinc-400"
                    }`}
                  >
                    <div className="text-[9px] text-zinc-500 mb-1 opacity-70">
                      System Action Event • {log.substring(1, 25) || ""}
                    </div>
                    <div className="font-semibold whitespace-pre-wrap">
                      {log.substring(log.indexOf("]") + 1).trim()}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Guide */}
          <div className="p-3 bg-slate-900 border-t border-zinc-800 flex items-center gap-1.5 text-[10px] text-zinc-400 leading-snug">
            <CheckCircle className="w-3.5 h-3.5 text-lime-400 flex-shrink-0" />
            <span>
              Real-time monitoring. For security validation tests, copy generated tokens here to verify OTP in checkout wizard.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
