package com.ossrisk.oss.interceptor;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

@Component
public class RateLimitInterceptor implements HandlerInterceptor {
    
    private final ConcurrentHashMap<String, AtomicInteger> requestCounts = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, Long> lastResetTime = new ConcurrentHashMap<>();
    private static final int MAX_REQUESTS_PER_MINUTE = 100;
    private static final long RESET_INTERVAL = 60000; // 1 minute in milliseconds
    
    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws IOException {
        String clientIp = getClientIpAddress(request);
        
        if (isRateLimitExceeded(clientIp)) {
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.getWriter().write("Rate limit exceeded. Please try again later.");
            return false;
        }
        
        incrementRequestCount(clientIp);
        return true;
    }
    
    private String getClientIpAddress(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
    
    private boolean isRateLimitExceeded(String clientIp) {
        long currentTime = System.currentTimeMillis();
        Long lastReset = lastResetTime.get(clientIp);
        
        if (lastReset == null || currentTime - lastReset > RESET_INTERVAL) {
            // Reset counter for this client
            requestCounts.put(clientIp, new AtomicInteger(0));
            lastResetTime.put(clientIp, currentTime);
            return false;
        }
        
        AtomicInteger count = requestCounts.get(clientIp);
        return count != null && count.get() >= MAX_REQUESTS_PER_MINUTE;
    }
    
    private void incrementRequestCount(String clientIp) {
        AtomicInteger count = requestCounts.get(clientIp);
        if (count != null) {
            count.incrementAndGet();
        }
    }
}
