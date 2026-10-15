package com.example.eda_pubsub.rabbitmq;

import com.example.eda_pubsub.config.RabbitMQConfig;
import com.example.eda_pubsub.event.UserRegisteredEvent;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Service;

@Service
public class RabbitMQAuditConsumer {

    @RabbitListener(queues = RabbitMQConfig.AUDIT_QUEUE)
    public void handleAuditLogging(UserRegisteredEvent event) {
        System.out.println("[RABBITMQ AUDIT SERVICE] Logging: New user signed up at "
                + event.getRegisteredAt());
    }
}
