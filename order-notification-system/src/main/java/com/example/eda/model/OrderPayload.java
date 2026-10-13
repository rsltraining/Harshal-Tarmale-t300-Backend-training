package com.example.eda.model;

import java.math.BigDecimal;
import java.util.List;

public record OrderPayload(
    String orderId,
    String customerId,
    String customerEmail,
    List<OrderItem> items,
    BigDecimal totalAmount,
    String currency
) {}
