import { useState, useCallback, useEffect } from "react";

export default function usePrompt() {
  const [state, setState] = useState(null);

  const prompt = useCallback((msg, def = "") => {
    return new Promise((resolve) => {
      setState({ msg, def: String(def), resolve });
    });
  }, []);

  const close = useCallback(() => setState(null), []);

  return { state, prompt, close };
}
