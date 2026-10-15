package com.example.eda_pubsub.inmemory;

import com.example.eda_pubsub.event.UserRegisteredEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

@Component
public class AuditEventListener {

    @Async
    @EventListener
    public void onUserRegistered(UserRegisteredEvent event) {
        System.out.println("[IN-MEMORY AUDIT SERVICE] Logging: New user signed up at "
                + event.getRegisteredAt() + " [Thread: "
                + Thread.currentThread().getName() + "]");
    }
}
