import { useState, useCallback } from "react";

export default function useToast() {
  const [toasts, setToasts] = useState([]);

  const add = useCallback((text, err = false) => {
    const id = Date.now() + Math.random();
    setToasts((p) => [...p, { id, text, err }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 3000);
  }, []);

  return { toasts, add };
}
