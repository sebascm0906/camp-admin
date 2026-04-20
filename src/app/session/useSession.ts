import { useSessionContext } from "./sessionContext";

export function useSession() {
  return useSessionContext();
}
