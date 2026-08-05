package com.stockpulse.service;

import com.stockpulse.model.InventoryItem;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
public class StockUpdateBroadcaster {

    private final SimpMessagingTemplate messagingTemplate;

    public StockUpdateBroadcaster(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    public void broadcastUpdate(String eventType, InventoryItem item) {
        messagingTemplate.convertAndSend("/topic/inventory", Map.of(
                "event", eventType,
                "itemId", item.getId(),
                "itemName", item.getName(),
                "currentStock", item.getCurrentStock(),
                "status", item.getStatus().name()
        ));
    }

    public void broadcastDelete(Long itemId, String itemName) {
        messagingTemplate.convertAndSend("/topic/inventory", Map.of(
                "event", "DELETE",
                "itemId", itemId,
                "itemName", itemName
        ));
    }
}
