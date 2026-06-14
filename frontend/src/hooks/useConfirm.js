import { useState, useCallback } from "react";

export default function useConfirm() {
  const [state, setState] = useState(null);

  const confirm = useCallback((msg, danger = false) => {
    return new Promise((resolve) => {
      setState({ msg, danger, resolve });
    });
  }, []);

  const close = useCallback(() => setState(null), []);

  return { state, confirm, close };
}
