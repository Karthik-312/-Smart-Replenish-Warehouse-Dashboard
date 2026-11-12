package com.stockpulse.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

import java.util.Arrays;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Value("${cors.allowed-origins:http://localhost:5173}")
    private String allowedOrigins;

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        config.enableSimpleBroker("/topic");
        config.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        String[] origins = Arrays.stream(allowedOrigins.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toArray(String[]::new);

        // SockJS at /ws — used by the dashboard (Vercel → Render cross-origin)
        var sockJs = registry.addEndpoint("/ws");
        if (origins.length > 0) {
            sockJs.setAllowedOrigins(origins);
        }
        sockJs.setAllowedOriginPatterns(
                "http://localhost:*",
                "http://127.0.0.1:*",
                "https://*.vercel.app"
        );
        sockJs.withSockJS();

        // Optional native STOMP (set VITE_WS_NATIVE=true, broker /stomp)
        var nativeStomp = registry.addEndpoint("/stomp");
        if (origins.length > 0) {
            nativeStomp.setAllowedOrigins(origins);
        }
        nativeStomp.setAllowedOriginPatterns(
                "http://localhost:*",
                "http://127.0.0.1:*",
                "https://*.vercel.app"
        );
    }
}
