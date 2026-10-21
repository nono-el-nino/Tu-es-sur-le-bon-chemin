import { useCallback, useState } from "react";

export function useToast() {
  const [msg, setMsg] = useState<{ text: string; key: number } | null>(null);
  const show = useCallback((text: string) => setMsg({ text, key: Date.now() }), []);
  const node = msg ? (
    <div key={msg.key} className="toast" role="status" onAnimationEnd={() => setMsg(null)}>
      {msg.text}
    </div>
  ) : null;
  return { show, node };
}
