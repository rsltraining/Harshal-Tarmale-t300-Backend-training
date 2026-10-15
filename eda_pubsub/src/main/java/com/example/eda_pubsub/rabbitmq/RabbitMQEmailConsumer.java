package com.example.eda_pubsub.rabbitmq;

import com.example.eda_pubsub.config.RabbitMQConfig;
import com.example.eda_pubsub.event.UserRegisteredEvent;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Service;

@Service
public class RabbitMQEmailConsumer {

    @RabbitListener(queues = RabbitMQConfig.EMAIL_QUEUE)
    public void handleEmailNotification(UserRegisteredEvent event) {
        System.out.println("[RABBITMQ EMAIL SERVICE] Sending Welcome Email to "
                + event.getName() + " (" + event.getEmail() + ")");
    }
}
