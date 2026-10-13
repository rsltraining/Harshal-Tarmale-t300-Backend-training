package com.example.eda.consumer;

import com.example.eda.model.OrderPlacedEvent;
import com.example.eda.service.IdempotencyService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicReference;

/**
 * Consumer 2: AnalyticsConsumer (Idempotent)
 * Subscribes to OrderPlaced events in its own consumer group ("analytics-service-group").
 * 
 * Requirement 3.b: Guarantees idempotency. If an event with the same eventId is
 * received multiple times, it is safely ignored without duplicate state mutations
 * or double-counting revenue.
 */
@RestController
@RequestMapping("/api/analytics")
public class AnalyticsConsumer {

    private static final Logger log = LoggerFactory.getLogger(AnalyticsConsumer.class);

    private final IdempotencyService idempotencyService;

    // Analytics state counters
    private final AtomicInteger totalOrdersProcessed = new AtomicInteger(0);
    private final AtomicInteger duplicateEventsIgnored = new AtomicInteger(0);
    private final AtomicReference<BigDecimal> totalRevenue = new AtomicReference<>(BigDecimal.ZERO);

    public AnalyticsConsumer(IdempotencyService idempotencyService) {
        this.idempotencyService = idempotencyService;
    }

    @KafkaListener(
        topics = "${app.kafka.topic.order-events}",
        groupId = "analytics-service-group"
    )
    public void handleOrderPlaced(OrderPlacedEvent event) {
        String eventId = event.eventId();

        log.info("──────────────────────────────────────────────────────────────────────");
        log.info("[AnalyticsConsumer] Processing OrderPlaced Event: eventId={}", eventId);

        // Idempotency check: atomic check-and-insert
        boolean isFirstTime = idempotencyService.processIfAbsent(eventId);

        if (!isFirstTime) {
            duplicateEventsIgnored.incrementAndGet();
            log.warn("⚠️ [AnalyticsConsumer] IDEMPOTENCY GUARD TRIGGERED! " +
                    "Event ID '{}' has ALREADY been processed. Skipping to avoid duplicate analytics recording.",
                    eventId);
            log.info("──────────────────────────────────────────────────────────────────────");
            return;
        }

        // Process first-time event (Side-effects)
        int ordersCount = totalOrdersProcessed.incrementAndGet();
        BigDecimal updatedRevenue = totalRevenue.updateAndGet(current -> 
                current.add(event.payload().totalAmount()));

        log.info("📊 [AnalyticsConsumer] Successfully recorded order metrics:");
        log.info("  ↳ Order ID           : {}", event.payload().orderId());
        log.info("  ↳ Order Amount       : {} {}", event.payload().totalAmount(), event.payload().currency());
        log.info("  ↳ Total Orders Count : {}", ordersCount);
        log.info("  ↳ Total Revenue      : {}", updatedRevenue);
        log.info("──────────────────────────────────────────────────────────────────────");
    }

    /**
     * Endpoint to verify current analytics and idempotency state.
     */
    @GetMapping
    public Map<String, Object> getAnalyticsSummary() {
        return Map.of(
                "totalOrdersProcessed", totalOrdersProcessed.get(),
                "duplicateEventsIgnored", duplicateEventsIgnored.get(),
                "totalRevenue", totalRevenue.get(),
                "uniqueEventsTracked", idempotencyService.getProcessedCount()
        );
    }
}
