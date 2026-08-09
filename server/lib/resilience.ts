import CircuitBreaker from "opossum";
import { serverLogger } from "../logger";

export const createBreaker = (name: string, options = {
  timeout: 2000,
  errorThresholdPercentage: 50,
  resetTimeout: 30000,
}) => {
  const breaker = new CircuitBreaker(async (fn: any) => await fn(), options);
  
  breaker.on("open", () => serverLogger.info(`${name} Circuit Breaker OPEN`));
  breaker.on("close", () => serverLogger.info(`${name} Circuit Breaker CLOSED`));
  
  return breaker;
};

export const supabaseBreaker = createBreaker("Supabase", {
  timeout: 12000,
  errorThresholdPercentage: 50,
  resetTimeout: 10000,
});
export const firebaseBreaker = createBreaker("Firebase", {
  timeout: 12000,
  errorThresholdPercentage: 50,
  resetTimeout: 10000,
});
