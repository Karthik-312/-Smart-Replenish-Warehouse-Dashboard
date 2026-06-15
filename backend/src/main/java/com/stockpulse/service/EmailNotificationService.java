package com.stockpulse.service;

import com.stockpulse.model.InventoryItem;
import com.stockpulse.model.StockStatus;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailNotificationService {

    private static final Logger log = LoggerFactory.getLogger(EmailNotificationService.class);

    private final JavaMailSender mailSender;
    private final String recipient;
    private final boolean enabled;

    public EmailNotificationService(
            JavaMailSender mailSender,
            @Value("${stockpulse.alert.recipient:}") String recipient,
            @Value("${stockpulse.mail.enabled:false}") boolean enabled) {
        this.mailSender = mailSender;
        this.recipient = recipient;
        this.enabled = enabled;
    }

    public void sendLowStockAlert(InventoryItem item, StockStatus newStatus) {
        if (!enabled || recipient.isBlank()) {
            log.info("Email notifications disabled — skipping alert for {}", item.getSku());
            return;
        }

        try {
            String subject = newStatus == StockStatus.OUT_OF_STOCK
                    ? "[StockPulse] OUT OF STOCK: " + item.getName()
                    : "[StockPulse] LOW STOCK: " + item.getName();

            String body = String.format(
                    """
                    Stock Alert for %s (SKU: %s)
                    
                    Status: %s
                    Current Stock: %d
                    Min Threshold: %d
                    Category: %s
                    
                    Please take action to reorder this item.
                    
                    — StockPulse Inventory System
                    """,
                    item.getName(), item.getSku(),
                    newStatus == StockStatus.OUT_OF_STOCK ? "OUT OF STOCK" : "LOW STOCK",
                    item.getCurrentStock(), item.getMinThreshold(), item.getCategory());

            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(recipient);
            message.setSubject(subject);
            message.setText(body);
            message.setFrom("noreply@stockpulse.app");

            mailSender.send(message);
            log.info("Sent stock alert email for {} to {}", item.getSku(), recipient);
        } catch (Exception e) {
            log.warn("Failed to send stock alert email for {}: {}", item.getSku(), e.getMessage());
        }
    }
}
