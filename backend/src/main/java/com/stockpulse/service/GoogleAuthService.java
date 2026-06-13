package com.stockpulse.service;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Arrays;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Service
public class GoogleAuthService {

    private static final Logger log = LoggerFactory.getLogger(GoogleAuthService.class);
    private static final String TOKEN_INFO_URL = "https://oauth2.googleapis.com/tokeninfo?id_token=";

    private final String googleClientId;
    private final Set<String> allowedEmails;
    private final RestTemplate restTemplate = new RestTemplate();

    // token -> email mapping for active sessions
    private final Map<String, String> activeSessions = new ConcurrentHashMap<>();

    public GoogleAuthService(
            @Value("${stockpulse.google.client-id}") String googleClientId,
            @Value("${stockpulse.admin.emails}") String adminEmails) {
        this.googleClientId = googleClientId;
        this.allowedEmails = Arrays.stream(adminEmails.split(","))
                .map(String::trim)
                .map(String::toLowerCase)
                .collect(Collectors.toSet());
        log.info("Authorized admin emails: {}", this.allowedEmails);
    }

    public AuthResult verifyGoogleToken(String idToken) {
        try {
            GoogleTokenInfo tokenInfo = restTemplate.getForObject(
                    TOKEN_INFO_URL + idToken, GoogleTokenInfo.class);

            if (tokenInfo == null || tokenInfo.email == null) {
                return AuthResult.failure("Invalid Google token");
            }

            if (!googleClientId.equals(tokenInfo.aud)) {
                return AuthResult.failure("Token was not issued for this application");
            }

            if (!"true".equals(tokenInfo.emailVerified)) {
                return AuthResult.failure("Email not verified with Google");
            }

            String email = tokenInfo.email.toLowerCase();
            if (!allowedEmails.contains(email)) {
                return AuthResult.failure("This email is not authorized as admin");
            }

            String sessionToken = UUID.randomUUID().toString();
            activeSessions.put(sessionToken, email);

            return AuthResult.success(sessionToken, email, tokenInfo.name, tokenInfo.picture);

        } catch (Exception e) {
            log.error("Google token verification failed", e);
            return AuthResult.failure("Failed to verify Google token");
        }
    }

    public String getEmailForToken(String bearerToken) {
        return activeSessions.get(bearerToken);
    }

    public void invalidateToken(String bearerToken) {
        activeSessions.remove(bearerToken);
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    static class GoogleTokenInfo {
        public String aud;
        public String email;
        @JsonProperty("email_verified")
        public String emailVerified;
        public String name;
        public String picture;
        public String sub;
    }

    public record AuthResult(boolean success, String token, String email, String name,
                             String picture, String error) {
        static AuthResult success(String token, String email, String name, String picture) {
            return new AuthResult(true, token, email, name, picture, null);
        }

        static AuthResult failure(String error) {
            return new AuthResult(false, null, null, null, null, error);
        }
    }
}
