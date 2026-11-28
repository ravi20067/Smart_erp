package com.Smart.Erp.Modules.AI.Service;

import com.Smart.Erp.Modules.AI.Config.AiQueryProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Simple in-memory per-user sliding-window rate limiter for AI queries.
 */
@Component
@RequiredArgsConstructor
public class AiQueryRateLimiter {

    private final AiQueryProperties properties;
    private final Map<Long, Deque<Long>> requestTimestamps = new ConcurrentHashMap<>();

    public boolean allowRequest(Long userId) {
        if (userId == null) {
            return false;
        }
        int limit = Math.max(1, properties.getRateLimitPerMinute());
        long now = System.currentTimeMillis();
        long cutoff = now - 60_000L;

        Deque<Long> timestamps = requestTimestamps.computeIfAbsent(userId, ignored -> new ArrayDeque<>());
        synchronized (timestamps) {
            while (!timestamps.isEmpty() && timestamps.peekFirst() < cutoff) {
                timestamps.pollFirst();
            }
            if (timestamps.size() >= limit) {
                return false;
            }
            timestamps.addLast(now);
            return true;
        }
    }
}
