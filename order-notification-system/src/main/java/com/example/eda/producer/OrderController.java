package com.example.eda.producer;

import com.example.eda.model.CreateOrderRequest;
import com.example.eda.model.OrderPayload;
import com.example.eda.model.OrderPlacedEvent;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderProducer orderProducer;

    // Cache of recent events to enable easy re-publishing for idempotency testing
    private final Map<String, OrderPlacedEvent> recentEvents = new ConcurrentHashMap<>();

    public OrderController(OrderProducer orderProducer) {
        this.orderProducer = orderProducer;
    }

    /**
     * Requirement 2: Producer accepts "place order" input via REST endpoint
     * and publishes an OrderPlaced event to the broker.
     */
    @PostMapping
    public ResponseEntity<Map<String, Object>> placeOrder(@RequestBody CreateOrderRequest request) {
        String generatedOrderId = "ORD-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        OrderPayload payload = new OrderPayload(
                generatedOrderId,
                request.customerId(),
                request.customerEmail(),
                request.items(),
                request.totalAmount(),
                request.currency()
        );

        OrderPlacedEvent event = OrderPlacedEvent.create(payload);
        recentEvents.put(event.eventId(), event);

        orderProducer.publishOrderPlaced(event);

        return ResponseEntity.status(HttpStatus.ACCEPTED).body(Map.of(
                "status", "ACCEPTED",
                "message", "Order placement event dispatched asynchronously",
                "eventId", event.eventId(),
                "orderId", generatedOrderId,
                "timestamp", event.timestamp()
        ));
    }

    /**
     * Helper endpoint for Requirement 3.b:
     * Intentionally republishes the exact same event with the same eventId
     * to demonstrate and verify consumer idempotency.
     */
    @PostMapping("/simulate-duplicate/{eventId}")
    public ResponseEntity<Map<String, Object>> simulateDuplicate(@PathVariable String eventId) {
        OrderPlacedEvent event = recentEvents.get(eventId);
        if (event == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
                    "status", "ERROR",
                    "message", "Event ID not found in recent events cache"
            ));
        }

        orderProducer.publishOrderPlaced(event);

        return ResponseEntity.status(HttpStatus.ACCEPTED).body(Map.of(
                "status", "ACCEPTED",
                "message", "Duplicate event republished to test consumer idempotency",
                "eventId", event.eventId(),
                "orderId", event.payload().orderId()
        ));
    }

    /**
     * Direct raw event publishing (useful for manual tests or custom scripts).
     */
    @PostMapping("/publish-raw")
    public ResponseEntity<Map<String, Object>> publishRaw(@RequestBody OrderPlacedEvent rawEvent) {
        recentEvents.put(rawEvent.eventId(), rawEvent);
        orderProducer.publishOrderPlaced(rawEvent);

        return ResponseEntity.status(HttpStatus.ACCEPTED).body(Map.of(
                "status", "ACCEPTED",
                "message", "Raw event dispatched",
                "eventId", rawEvent.eventId()
        ));
    }
}
