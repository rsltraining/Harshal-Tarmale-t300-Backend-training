package com.example.eda_pubsub.inmemory;

import com.example.eda_pubsub.event.UserRegisteredEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

@Component
public class EmailEventListener {

    @Async
    @EventListener
    public void onUserRegistered(UserRegisteredEvent event) {
        System.out.println("[IN-MEMORY EMAIL SERVICE] Sending Welcome Email to "
                + event.getName() + " (" + event.getEmail() + ") [Thread: "
                + Thread.currentThread().getName() + "]");
    }
}
