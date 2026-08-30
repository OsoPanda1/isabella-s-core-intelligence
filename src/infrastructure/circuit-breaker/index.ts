/**
 * Circuit Breaker — Resiliencia por dependencia
 *
 * Cada dependencia tiene su propio circuit breaker:
 * - Primary LLM
 * - Secondary LLM
 * - Vector store
 * - Graph store
 * - Voice provider
 * - Payment provider
 * - QPU provider
 * - Social connector
 */

// ============================================================================
// TYPES
// ============================================================================

export type CircuitState = "closed" | "open" | "half_open";

export interface CircuitBreakerConfig {
  failureThreshold: number;
  recoveryTimeoutMs: number;
  halfOpenMaxAttempts: number;
  monitorIntervalMs: number;
}

export interface CircuitBreakerStats {
  state: CircuitState;
  failures: number;
  successes: number;
  lastFailureAt?: string | undefined;
  lastSuccessAt?: string | undefined;
  openSince?: string | undefined;
  halfOpenAttempts: number;
}

// ============================================================================
// CIRCUIT BREAKER
// ============================================================================

export class CircuitBreaker {
  private state: CircuitState = "closed";
  private failures = 0;
  private successes = 0;
  private halfOpenAttempts = 0;
  private lastFailureAt: string | undefined;
  private lastSuccessAt: string | undefined;
  private openSince: string | undefined;

  constructor(
    private readonly name: string,
    private readonly config: CircuitBreakerConfig = {
      failureThreshold: 5,
      recoveryTimeoutMs: 30_000,
      halfOpenMaxAttempts: 3,
      monitorIntervalMs: 60_000,
    },
  ) {}

  /**
   * Execute a function through the circuit breaker.
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === "open") {
      if (this.shouldTryRecovery()) {
        this.state = "half_open";
        this.halfOpenAttempts = 0;
      } else {
        throw new CircuitOpenError(this.name, this.openSince!);
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  /**
   * Get current stats.
   */
  stats(): CircuitBreakerStats {
    return {
      state: this.state,
      failures: this.failures,
      successes: this.successes,
      lastFailureAt: this.lastFailureAt,
      lastSuccessAt: this.lastSuccessAt,
      openSince: this.openSince,
      halfOpenAttempts: this.halfOpenAttempts,
    };
  }

  /**
   * Reset the circuit breaker.
   */
  reset(): void {
    this.state = "closed";
    this.failures = 0;
    this.successes = 0;
    this.halfOpenAttempts = 0;
    this.openSince = undefined;
  }

  private onSuccess(): void {
    this.successes++;
    this.lastSuccessAt = new Date().toISOString();

    if (this.state === "half_open") {
      this.halfOpenAttempts++;
      if (this.halfOpenAttempts >= this.config.halfOpenMaxAttempts) {
        this.state = "closed";
        this.failures = 0;
      }
    }
  }

  private onFailure(): void {
    this.failures++;
    this.lastFailureAt = new Date().toISOString();

    if (this.state === "half_open") {
      this.state = "open";
      this.openSince = new Date().toISOString();
    } else if (this.failures >= this.config.failureThreshold) {
      this.state = "open";
      this.openSince = new Date().toISOString();
    }
  }

  private shouldTryRecovery(): boolean {
    if (!this.openSince) return false;
    const elapsed = Date.now() - new Date(this.openSince).getTime();
    return elapsed >= this.config.recoveryTimeoutMs;
  }
}

// ============================================================================
// CIRCUIT OPEN ERROR
// ============================================================================

export class CircuitOpenError extends Error {
  constructor(
    public readonly circuitName: string,
    public readonly openSince: string,
  ) {
    super(`Circuit breaker "${circuitName}" is open since ${openSince}`);
    this.name = "CircuitOpenError";
  }
}

// ============================================================================
// CIRCUIT BREAKER MANAGER
// ============================================================================

export class CircuitBreakerManager {
  private breakers = new Map<string, CircuitBreaker>();

  constructor(config?: Partial<CircuitBreakerConfig>) {
    const defaultConfig: CircuitBreakerConfig = {
      failureThreshold: 5,
      recoveryTimeoutMs: 30_000,
      halfOpenMaxAttempts: 3,
      monitorIntervalMs: 60_000,
      ...config,
    };

    // Create breakers for all known dependencies
    const dependencies = [
      "primary_llm",
      "secondary_llm",
      "vector_store",
      "graph_store",
      "voice_provider",
      "payment_provider",
      "qpu_provider",
      "social_connector",
    ];

    for (const dep of dependencies) {
      this.breakers.set(dep, new CircuitBreaker(dep, defaultConfig));
    }
  }

  get(name: string): CircuitBreaker {
    if (!this.breakers.has(name)) {
      this.breakers.set(name, new CircuitBreaker(name));
    }
    return this.breakers.get(name)!;
  }

  stats(): Record<string, CircuitBreakerStats> {
    const result: Record<string, CircuitBreakerStats> = {};
    for (const [name, breaker] of this.breakers) {
      result[name] = breaker.stats();
    }
    return result;
  }

  resetAll(): void {
    for (const breaker of this.breakers.values()) {
      breaker.reset();
    }
  }
}

export const circuitBreakerManager = new CircuitBreakerManager();
