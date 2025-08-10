package com.ossrisk.oss.configs;

import io.github.resilience4j.circuitbreaker.CircuitBreakerConfig;
import io.github.resilience4j.retry.RetryConfig;
import io.github.resilience4j.timelimiter.TimeLimiterConfig;
import io.github.resilience4j.circuitbreaker.CircuitBreaker;
import io.github.resilience4j.retry.Retry;
import io.github.resilience4j.timelimiter.TimeLimiter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;

@Configuration
public class ResilienceConfig {

    @Bean
    public CircuitBreakerConfig circuitBreakerConfig() {
        return CircuitBreakerConfig.custom()
                .failureRateThreshold(50) // 50% failure rate threshold
                .waitDurationInOpenState(Duration.ofSeconds(60)) // Wait 60 seconds before transitioning to half-open
                .slidingWindowSize(10) // Count failures over 10 calls
                .minimumNumberOfCalls(5) // Minimum calls before calculating failure rate
                .permittedNumberOfCallsInHalfOpenState(3) // Allow 3 calls in half-open state
                .recordExceptions(Exception.class) // Record all exceptions
                .build();
    }

    @Bean
    public RetryConfig retryConfig() {
        return RetryConfig.custom()
                .maxAttempts(3) // Maximum 3 retry attempts
                .waitDuration(Duration.ofMillis(100)) // Wait 100ms between retries
                .retryExceptions(Exception.class) // Retry on all exceptions
                .ignoreExceptions(IllegalArgumentException.class) // Don't retry on illegal arguments
                .build();
    }

    @Bean
    public TimeLimiterConfig timeLimiterConfig() {
        return TimeLimiterConfig.custom()
                .timeoutDuration(Duration.ofSeconds(30)) // 30 second timeout
                .cancelRunningFuture(true) // Cancel running futures on timeout
                .build();
    }

    @Bean
    public CircuitBreaker vulnerabilityCheckerCircuitBreaker() {
        CircuitBreakerConfig config = CircuitBreakerConfig.custom()
                .failureRateThreshold(40) // Lower threshold for vulnerability checking
                .waitDurationInOpenState(Duration.ofSeconds(120)) // Longer wait time
                .slidingWindowSize(20) // Larger window for more accurate failure rate
                .build();
        
        return CircuitBreaker.of("vulnerabilityChecker", config);
    }

    @Bean
    public CircuitBreaker aiMlServiceCircuitBreaker() {
        CircuitBreakerConfig config = CircuitBreakerConfig.custom()
                .failureRateThreshold(30) // Lower threshold for AI/ML services
                .waitDurationInOpenState(Duration.ofSeconds(180)) // Longer wait time for AI services
                .slidingWindowSize(15)
                .build();
        
        return CircuitBreaker.of("aiMlService", config);
    }

    @Bean
    public Retry dependencyAnalysisRetry() {
        RetryConfig config = RetryConfig.custom()
                .maxAttempts(5) // More retries for dependency analysis
                .waitDuration(Duration.ofSeconds(1)) // Longer wait between retries
                .retryExceptions(Exception.class)
                .build();
        
        return Retry.of("dependencyAnalysis", config);
    }
}
