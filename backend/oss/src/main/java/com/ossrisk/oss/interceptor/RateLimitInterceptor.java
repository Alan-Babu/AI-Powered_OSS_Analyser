package com.ossrisk.oss.interceptor;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.Timer;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

@Component
public class RateLimitInterceptor implements HandlerInterceptor {
    
    private final ConcurrentHashMap<String, SlidingWindowCounter> requestCounts = new ConcurrentHashMap<>();
    private final MeterRegistry meterRegistry;
    
    // Rate limit configurations
    private static final int MAX_REQUESTS_PER_MINUTE = 100;
    private static final int MAX_REQUESTS_PER_HOUR = 1000;
    private static final int MAX_REQUESTS_PER_DAY = 10000;
    private static final int WINDOW_SIZE_MINUTES = 1;
    private static final int WINDOW_SIZE_HOURS = 1;
    private static final int WINDOW_SIZE_DAYS = 1;
    
    // Metrics
    private final Counter rateLimitExceededCounter;
    private final Counter totalRequestsCounter;
    private final Timer requestProcessingTimer;
    
    public RateLimitInterceptor(MeterRegistry meterRegistry) {
        this.meterRegistry = meterRegistry;
        this.rateLimitExceededCounter = Counter.builder("rate_limit_exceeded_total")
                .description("Total number of rate limit violations")
                .register(meterRegistry);
        this.totalRequestsCounter = Counter.builder("total_requests_total")
                .description("Total number of requests processed")
                .register(meterRegistry);
        this.requestProcessingTimer = Timer.builder("request_processing_duration")
                .description("Time taken to process requests")
                .register(meterRegistry);
    }
    
    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws IOException {
        Timer.Sample sample = Timer.start(meterRegistry);
        String clientIdentifier = getClientIdentifier(request);
        
        try {
            totalRequestsCounter.increment();
            
            if (isRateLimitExceeded(clientIdentifier)) {
                rateLimitExceededCounter.increment();
                response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
                response.setHeader("Retry-After", "60"); // Retry after 1 minute
                response.setContentType("application/json");
                response.getWriter().write("{\"error\":\"Rate limit exceeded\",\"retryAfter\":60}");
                return false;
            }
            
            incrementRequestCount(clientIdentifier);
            return true;
        } finally {
            sample.stop(requestProcessingTimer);
        }
    }
    
    private String getClientIdentifier(HttpServletRequest request) {
        // Try to get user ID from JWT token first
        String userId = extractUserIdFromToken(request);
        if (userId != null) {
            return "user:" + userId;
        }
        
        // Fallback to IP address
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return "ip:" + xForwardedFor.split(",")[0].trim();
        }
        return "ip:" + request.getRemoteAddr();
    }
    
    private String extractUserIdFromToken(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            // In a real implementation, you would decode the JWT token here
            // For now, return a hash of the token
            return authHeader.substring(7).hashCode() + "";
        }
        return null;
    }
    
    private boolean isRateLimitExceeded(String clientIdentifier) {
        SlidingWindowCounter counter = requestCounts.computeIfAbsent(clientIdentifier, 
            k -> new SlidingWindowCounter());
        
        return counter.isLimitExceeded();
    }
    
    private void incrementRequestCount(String clientIdentifier) {
        SlidingWindowCounter counter = requestCounts.get(clientIdentifier);
        if (counter != null) {
            counter.increment();
        }
    }
    
    // Sliding window counter implementation
    private static class SlidingWindowCounter {
        private final AtomicInteger minuteCount = new AtomicInteger(0);
        private final AtomicInteger hourCount = new AtomicInteger(0);
        private final AtomicInteger dayCount = new AtomicInteger(0);
        private final AtomicLong lastMinuteReset = new AtomicLong(System.currentTimeMillis());
        private final AtomicLong lastHourReset = new AtomicLong(System.currentTimeMillis());
        private final AtomicLong lastDayReset = new AtomicLong(System.currentTimeMillis());
        
        public boolean isLimitExceeded() {
            long currentTime = System.currentTimeMillis();
            
            // Reset counters if window has passed
            resetIfNeeded(currentTime);
            
            return minuteCount.get() >= MAX_REQUESTS_PER_MINUTE ||
                   hourCount.get() >= MAX_REQUESTS_PER_HOUR ||
                   dayCount.get() >= MAX_REQUESTS_PER_DAY;
        }
        
        public void increment() {
            long currentTime = System.currentTimeMillis();
            resetIfNeeded(currentTime);
            
            minuteCount.incrementAndGet();
            hourCount.incrementAndGet();
            dayCount.incrementAndGet();
        }
        
        private void resetIfNeeded(long currentTime) {
            // Reset minute counter
            if (currentTime - lastMinuteReset.get() >= WINDOW_SIZE_MINUTES * 60 * 1000) {
                minuteCount.set(0);
                lastMinuteReset.set(currentTime);
            }
            
            // Reset hour counter
            if (currentTime - lastHourReset.get() >= WINDOW_SIZE_HOURS * 60 * 60 * 1000) {
                hourCount.set(0);
                lastHourReset.set(currentTime);
            }
            
            // Reset day counter
            if (currentTime - lastDayReset.get() >= WINDOW_SIZE_DAYS * 24 * 60 * 60 * 1000) {
                dayCount.set(0);
                lastDayReset.set(currentTime);
            }
        }
    }
}
