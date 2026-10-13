package com.example.eda.consumer;

import com.example.eda.model.OrderPlacedEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

/**
 * Consumer 1: NotificationConsumer
 * Subscribes to OrderPlaced events in its own consumer group ("notification-service-group").
 * Acts independently: Simulates dispatching email/SMS notifications to customers.
 */
@Component
public class NotificationConsumer {

    private static final Logger log = LoggerFactory.getLogger(NotificationConsumer.class);

    @KafkaListener(
        topics = "${app.kafka.topic.order-events}",
        groupId = "notification-service-group"
    )
    public void handleOrderPlaced(OrderPlacedEvent event) {
        log.info("══════════════════════════════════════════════════════════════════════");
        log.info("[NotificationConsumer] Received OrderPlaced Event");
        log.info("  ↳ Event ID : {}", event.eventId());
        log.info("  ↳ Order ID : {}", event.payload().orderId());
        log.info("  ↳ Customer : {} ({})", event.payload().customerId(), event.payload().customerEmail());
        log.info("  ↳ Action   : 📧 Sending confirmation email & SMS notification to '{}'...",
                event.payload().customerEmail());
        log.info("  ↳ Status   : ✅ Notification successfully dispatched for Order {}",
                event.payload().orderId());
        log.info("══════════════════════════════════════════════════════════════════════");
    }
}
