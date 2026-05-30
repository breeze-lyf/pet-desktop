import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { readJson, writeJson } from "../lib/storage";

export function usePersistentState<T>(
  key: string,
  fallback: T
): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => readJson(key, fallback));

  useEffect(() => {
    writeJson(key, value);
  }, [key, value]);

  return [value, setValue];
}
