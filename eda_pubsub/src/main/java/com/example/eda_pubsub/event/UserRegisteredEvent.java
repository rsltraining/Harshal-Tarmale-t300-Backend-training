package com.example.eda_pubsub.event;

import java.io.Serializable;
import java.time.LocalDateTime;

public class UserRegisteredEvent implements Serializable {
    private static final long serialVersionUID = 1L;

    private String name;
    private String email;
    private LocalDateTime registeredAt;

    public UserRegisteredEvent() {
    }

    public UserRegisteredEvent(String name, String email) {
        this.name = name;
        this.email = email;
        this.registeredAt = LocalDateTime.now();
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public LocalDateTime getRegisteredAt() {
        return registeredAt;
    }

    public void setRegisteredAt(LocalDateTime registeredAt) {
        this.registeredAt = registeredAt;
    }

    @Override
    public String toString() {
        return "UserRegisteredEvent{" +
                "name='" + name + '\'' +
                ", email='" + email + '\'' +
                ", registeredAt=" + registeredAt +
                '}';
    }
}
