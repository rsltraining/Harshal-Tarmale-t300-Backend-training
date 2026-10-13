package com.example.eda.producer;

import com.example.eda.model.OrderPlacedEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.SendResult;
import org.springframework.stereotype.Service;

import java.util.concurrent.CompletableFuture;

@Service
public class OrderProducer {

    private static final Logger log = LoggerFactory.getLogger(OrderProducer.class);

    private final KafkaTemplate<String, OrderPlacedEvent> kafkaTemplate;
    private final String topic;

    public OrderProducer(
            KafkaTemplate<String, OrderPlacedEvent> kafkaTemplate,
            @Value("${app.kafka.topic.order-events}") String topic) {
        this.kafkaTemplate = kafkaTemplate;
        this.topic = topic;
    }

    /**
     * Publishes an OrderPlacedEvent to the Kafka topic.
     * Uses orderId as the partition key to guarantee order ordering within a partition.
     */
    public CompletableFuture<SendResult<String, OrderPlacedEvent>> publishOrderPlaced(OrderPlacedEvent event) {
        String key = event.payload().orderId();

        log.info("[Producer] Publishing OrderPlaced event to topic '{}': eventId={}, orderId={}, totalAmount={}{}",
                topic, event.eventId(), key, event.payload().totalAmount(), event.payload().currency());

        CompletableFuture<SendResult<String, OrderPlacedEvent>> future = kafkaTemplate.send(topic, key, event);

        future.whenComplete((result, ex) -> {
            if (ex != null) {
                log.error("[Producer] Failed to publish eventId={}: {}", event.eventId(), ex.getMessage(), ex);
            } else {
                log.info("[Producer] Successfully published eventId={} to partition={} at offset={}",
                        event.eventId(),
                        result.getRecordMetadata().partition(),
                        result.getRecordMetadata().offset());
            }
        });

        return future;
    }
}
