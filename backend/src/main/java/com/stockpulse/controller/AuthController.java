package com.stockpulse.controller;

import com.stockpulse.model.Role;
import com.stockpulse.model.UserRole;
import com.stockpulse.repository.UserRoleRepository;
import com.stockpulse.service.GoogleAuthService;
import com.stockpulse.service.GoogleAuthService.AuthResult;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final GoogleAuthService googleAuthService;
    private final UserRoleRepository userRoleRepository;

    public AuthController(GoogleAuthService googleAuthService, UserRoleRepository userRoleRepository) {
        this.googleAuthService = googleAuthService;
        this.userRoleRepository = userRoleRepository;
    }

    @PostMapping("/google")
    public ResponseEntity<?> googleLogin(@RequestBody Map<String, String> body) {
        String idToken = body.get("idToken");
        if (idToken == null || idToken.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Missing idToken"));
        }

        AuthResult result = googleAuthService.verifyGoogleToken(idToken);

        if (!result.success()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", result.error()));
        }

        return ResponseEntity.ok(Map.of(
                "token", result.token(),
                "email", result.email(),
                "name", result.name() != null ? result.name() : "",
                "picture", result.picture() != null ? result.picture() : "",
                "role", result.role().name()
        ));
    }

    @PostMapping("/logout")
    public ResponseEntity<Map<String, String>> logout(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            googleAuthService.invalidateToken(authHeader.substring(7));
        }
        return ResponseEntity.ok(Map.of("message", "Logged out successfully"));
    }

    @GetMapping("/users")
    public List<UserRole> getAllUsers() {
        return userRoleRepository.findAll();
    }

    @PutMapping("/users/{email}/role")
    public ResponseEntity<?> updateUserRole(@PathVariable String email, @RequestBody Map<String, String> body) {
        String roleStr = body.get("role");
        if (roleStr == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Missing role field"));
        }

        Role role;
        try {
            role = Role.valueOf(roleStr.toUpperCase());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid role: " + roleStr));
        }

        UserRole userRole = userRoleRepository.findByEmailIgnoreCase(email)
                .orElse(new UserRole(email.toLowerCase(), role));
        userRole.setRole(role);
        userRoleRepository.save(userRole);

        return ResponseEntity.ok(userRole);
    }
}
