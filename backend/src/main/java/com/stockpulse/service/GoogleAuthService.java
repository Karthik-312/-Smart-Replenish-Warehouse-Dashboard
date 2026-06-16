package com.stockpulse.service;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.stockpulse.model.Role;
import com.stockpulse.repository.UserRoleRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class GoogleAuthService {

    private static final Logger log = LoggerFactory.getLogger(GoogleAuthService.class);
    private static final String TOKEN_INFO_URL = "https://oauth2.googleapis.com/tokeninfo?id_token=";

    private final String googleClientId;
    private final UserRoleRepository userRoleRepository;
    private final RestTemplate restTemplate = new RestTemplate();

    private final Map<String, SessionInfo> activeSessions = new ConcurrentHashMap<>();

    public GoogleAuthService(
            @Value("${stockpulse.google.client-id}") String googleClientId,
            UserRoleRepository userRoleRepository) {
        this.googleClientId = googleClientId;
        this.userRoleRepository = userRoleRepository;
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

            Role role = userRoleRepository.findByEmailIgnoreCase(email)
                    .map(ur -> ur.getRole())
                    .orElse(null);

            if (role == null) {
                return AuthResult.failure("This email is not authorized");
            }

            String sessionToken = UUID.randomUUID().toString();
            activeSessions.put(sessionToken, new SessionInfo(email, role));

            return AuthResult.success(sessionToken, email, tokenInfo.name, tokenInfo.picture, role);

        } catch (Exception e) {
            log.error("Google token verification failed", e);
            return AuthResult.failure("Failed to verify Google token");
        }
    }

    public String getEmailForToken(String bearerToken) {
        SessionInfo info = activeSessions.get(bearerToken);
        return info != null ? info.email() : null;
    }

    public Role getRoleForToken(String bearerToken) {
        SessionInfo info = activeSessions.get(bearerToken);
        return info != null ? info.role() : null;
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

    public record SessionInfo(String email, Role role) {}

    public record AuthResult(boolean success, String token, String email, String name,
                             String picture, Role role, String error) {
        static AuthResult success(String token, String email, String name, String picture, Role role) {
            return new AuthResult(true, token, email, name, picture, role, null);
        }

        static AuthResult failure(String error) {
            return new AuthResult(false, null, null, null, null, null, error);
        }
    }
}
