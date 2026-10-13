# System Architecture Write-up: Order Notification System

## 1. System Overview
For this assignment, I implemented an Event-Driven Architecture (EDA) using Java 17, Spring Boot 3, and Apache Kafka. The project models an e-commerce order placement workflow where downstream services (notifications and business analytics) need to react whenever a new order is placed.

Instead of having the order service make direct HTTP calls to each downstream service, the system uses Kafka as a central event broker following the Publish/Subscribe pattern.

---

## 2. End-to-End Event Flow

Here is how an order event moves through the system from initial submission to final processing:

```
[Client / API Caller]
        │
        ▼ (1) POST /api/orders
┌──────────────────────────────────────────────┐
│  OrderController (Producer)                  │
│  - Creates OrderPlacedEvent (UUID, timestamp)│
│  - Returns HTTP 202 Accepted immediately     │
└──────────────────────┬───────────────────────┘
                       │
                       ▼ (2) KafkaTemplate.send("order-events")
┌──────────────────────────────────────────────┐
│  Apache Kafka Broker                         │
│  - Topic: "order-events"                     │
│  - Retains immutable event log               │
└──────────────┬───────────────────────────────┘
               │
      Broadcast to Consumer Groups
               │
      ┌────────┴────────────────────────┐
      ▼ (Group: notification-group)     ▼ (Group: analytics-group)
┌───────────────────────────┐     ┌───────────────────────────────────┐
│ NotificationConsumer      │     │ AnalyticsConsumer (Idempotent)    │
│ - Sends simulated email   │     │ - Checks IdempotencyService       │
│   and SMS to customer     │     │ - Skips duplicates if already seen│
│                           │     │ - Updates sales & order metrics   │
└───────────────────────────┘     └───────────────────────────────────┘
```

### Step-by-Step Breakdown:

1. **Order Creation & Event Publication**:
   * A client makes a `POST` request to `/api/orders` with details like customer ID, email, items, and total price.
   * The `OrderController` receives the request, generates a unique order ID (`ORD-XXXX`), and wraps everything inside an immutable `OrderPlacedEvent`.
   * The event contains four core attributes: a generated UUID (`eventId`), the event type (`"OrderPlaced"`), an ISO timestamp, and the order payload.
   * `OrderProducer` sends this event to Kafka on the `order-events` topic, using the `orderId` as the record key to keep events for the same order in the same partition.
   * The controller immediately returns an HTTP `202 Accepted` response with the `eventId` and `orderId`. It does not wait for notifications to be sent or analytics to finish.

2. **Broker Distribution**:
   * Kafka commits the event to disk across partitions.
   * Because we use Kafka's Consumer Groups mechanism, each consumer group gets an independent pointer (offset) to read messages from the topic.
   * `notification-service-group` and `analytics-service-group` each receive their own copy of the event independently.

3. **Consumer Reactions**:
   * **Notification Consumer**: Reads the event and simulates sending an order confirmation email and SMS to the buyer. It does its job and logs the result.
   * **Analytics Consumer**: Reads the same event and passes the `eventId` to `IdempotencyService`.
     * If the event ID has never been seen before, it records the order revenue and increments total order counts.
     * If the event ID was already processed (simulating a duplicate message redelivery), it logs a warning and skips the update so metrics don't get double-counted.

---

## 3. Why This Is Decoupled Compared to Direct Request/Response

If this were built using traditional synchronous HTTP calls, the order service would look something like this:
```java
// Synchronous / tightly coupled approach:
notificationClient.sendEmail(order);
analyticsClient.recordMetric(order);
return ResponseEntity.ok();
```

While that works for tiny scripts, it creates severe coupling in production. Here is why the event-driven approach is far superior:

### A. Temporal Decoupling (Time Independence)
In a request/response setup, all services must be alive and responding at the exact millisecond the customer clicks "Place Order". If the analytics service is undergoing a restart or having a brief outage, the order call either fails completely or hangs until a timeout occurs.
With Kafka in between, the producer writes the event and moves on. Even if the analytics service is temporarily offline, the message sits safely in Kafka until the consumer comes back online and catches up.

### B. Spatial / Architectural Decoupling
The order producer doesn't know where the notification service lives, what port it runs on, or even that an analytics service exists at all. It only knows about the broker and the schema of `OrderPlacedEvent`. Downstream teams can change their infrastructure, URLs, or internal database without breaking the producer.

### C. Zero Impact on User Latency
Sending emails, querying third-party SMS providers, or aggregating analytics take measurable time. If the producer had to wait for all downstream HTTP calls in sequence, checkout latency would quickly climb to several seconds. In this EDA design, the producer publishes to Kafka in a few milliseconds and returns `202 Accepted` immediately, keeping checkout snappy.

### D. Extensibility (Adding New Features)
If business requirements change tomorrow and we need to add an `InventoryService` or `FraudDetectionService`, we don't need to touch or redeploy the `OrderService`. We simply create a new consumer, assign it a new consumer group name, and point it at the `order-events` topic. The producer is completely untouched.

---

## 4. How Idempotency Was Handled

In distributed messaging, systems generally offer **at-least-once delivery**. A network blip, consumer crash during commit, or producer retry can cause the same message to be delivered more than once.

To demonstrate idempotency in `AnalyticsConsumer`:
1. Every event has a unique `eventId` (UUID) created at birth.
2. An `IdempotencyService` maintains a thread-safe set of already-processed event IDs.
3. When the consumer receives a message, it performs an atomic `processIfAbsent(eventId)` check.
4. If it returns `false`, the consumer logs:
   `IDEMPOTENCY GUARD TRIGGERED! Event ID has ALREADY been processed.`
   and skips adding the revenue again.

This ensures that running the consumer once or ten times with the same event produces the exact same financial and analytical outcome.
