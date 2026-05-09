import CircuitBreaker from "opossum";
import { serverLogger } from "../logger";

export const createBreaker = (name: string, options = {
  timeout: 5000,
  errorThresholdPercentage: 50,
  resetTimeout: 30000,
}) => {
  const breaker = new CircuitBreaker(async (fn: any) => await fn(), options);
  
  breaker.on("open", () => serverLogger.warn(`${name} Circuit Breaker OPEN`));
  breaker.on("close", () => serverLogger.info(`${name} Circuit Breaker CLOSED`));
  
  return breaker;
};

export const supabaseBreaker = createBreaker("Supabase");
export const firebaseBreaker = createBreaker("Firebase");
