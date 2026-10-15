package com.example.eda_pubsub.config;

import org.springframework.amqp.core.*;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    public static final String FANOUT_EXCHANGE = "user.fanout.exchange";
    public static final String EMAIL_QUEUE = "user.email.queue";
    public static final String AUDIT_QUEUE = "user.audit.queue";

    // 1. Declare the Fanout Exchange
    @Bean
    public FanoutExchange fanoutExchange() {
        return new FanoutExchange(FANOUT_EXCHANGE, true, false);
    }

    // 2. Declare Queue for Email Service
    @Bean
    public Queue emailQueue() {
        return new Queue(EMAIL_QUEUE, true); // durable = true
    }

    // 3. Declare Queue for Audit Service
    @Bean
    public Queue auditQueue() {
        return new Queue(AUDIT_QUEUE, true); // durable = true
    }

    // 4. Bind Email Queue to the Fanout Exchange
    @Bean
    public Binding emailBinding(Queue emailQueue, FanoutExchange fanoutExchange) {
        return BindingBuilder.bind(emailQueue).to(fanoutExchange);
    }

    // 5. Bind Audit Queue to the Fanout Exchange
    @Bean
    public Binding auditBinding(Queue auditQueue, FanoutExchange fanoutExchange) {
        return BindingBuilder.bind(auditQueue).to(fanoutExchange);
    }

    // 6. JSON Message Converter for automatic serialization of event objects
    @SuppressWarnings("removal")
    @Bean
    public MessageConverter jacksonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }
}
