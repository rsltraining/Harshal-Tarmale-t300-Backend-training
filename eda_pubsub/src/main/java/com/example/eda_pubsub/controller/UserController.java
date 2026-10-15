package com.example.eda_pubsub.controller;

import com.example.eda_pubsub.config.RabbitMQConfig;
import com.example.eda_pubsub.dto.ApiResponse;
import com.example.eda_pubsub.dto.RegisterRequest;
import com.example.eda_pubsub.event.UserRegisteredEvent;

import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class UserController {

    private final ApplicationEventPublisher inMemoryPublisher;

    // Optional RabbitTemplate (null if RabbitMQ not running)
    @Autowired(required = false)
    private RabbitTemplate rabbitTemplate;

    public UserController(ApplicationEventPublisher inMemoryPublisher) {
        this.inMemoryPublisher = inMemoryPublisher;
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse> registerUser(@RequestBody RegisterRequest request) {
        System.out.println("[USER CONTROLLER] Processing registration for: " + request.getName());

        UserRegisteredEvent event = new UserRegisteredEvent(request.getName(), request.getEmail());

        // 1. In-Memory Fanout via Spring Events
        inMemoryPublisher.publishEvent(event);

        // 2. Broker Fanout via RabbitMQ (if available)
        if (rabbitTemplate != null) {
            try {
                // In a fanout exchange, routing key is ignored (empty string "")
                rabbitTemplate.convertAndSend(RabbitMQConfig.FANOUT_EXCHANGE, "", event);
            } catch (Exception ex) {
                System.err.println("[USER CONTROLLER] Could not send to RabbitMQ: " +
                        ex.getMessage());
            }
        }

        // 3. Immediately return response to the caller
        return ResponseEntity.ok(new ApiResponse("User registered successfully!", true));
    }
}
