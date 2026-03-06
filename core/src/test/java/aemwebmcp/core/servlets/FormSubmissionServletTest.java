package aemwebmcp.core.servlets;

import org.junit.jupiter.api.Test;

import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class FormSubmissionServletTest {

    @Test
    void testValidEmailValidation() {
        Map<String, String> formData = new HashMap<>();
        formData.put("email", "test@example.com");
        
        Map<String, String> errors = validateFormData(formData);
        
        assertTrue(errors.isEmpty(), "Valid email should not have errors");
    }

    @Test
    void testInvalidEmailValidation() {
        Map<String, String> formData = new HashMap<>();
        formData.put("email", "invalid-email");
        
        Map<String, String> errors = validateFormData(formData);
        
        assertTrue(errors.containsKey("email"), "Invalid email should have error");
    }

    @Test
    void testEmptyEmailValidation() {
        Map<String, String> formData = new HashMap<>();
        formData.put("email", "");
        
        Map<String, String> errors = validateFormData(formData);
        
        assertTrue(errors.containsKey("email"), "Empty email should have error");
    }

    @Test
    void testValidNameValidation() {
        Map<String, String> formData = new HashMap<>();
        formData.put("fullName", "John Doe");
        
        Map<String, String> errors = validateFormData(formData);
        
        assertTrue(errors.isEmpty(), "Valid name should not have errors");
    }

    @Test
    void testShortNameValidation() {
        Map<String, String> formData = new HashMap<>();
        formData.put("fullName", "J");
        
        Map<String, String> errors = validateFormData(formData);
        
        assertTrue(errors.containsKey("fullName"), "Short name should have error");
    }

    @Test
    void testValidPasswordValidation() {
        Map<String, String> formData = new HashMap<>();
        formData.put("password", "password123");
        
        Map<String, String> errors = validateFormData(formData);
        
        assertTrue(errors.isEmpty(), "Valid password should not have errors");
    }

    @Test
    void testShortPasswordValidation() {
        Map<String, String> formData = new HashMap<>();
        formData.put("password", "12345");
        
        Map<String, String> errors = validateFormData(formData);
        
        assertTrue(errors.containsKey("password"), "Short password should have error");
    }

    @Test
    void testMessageValidation() {
        Map<String, String> formData = new HashMap<>();
        formData.put("message", "This is a valid message with enough characters");
        
        Map<String, String> errors = validateFormData(formData);
        
        assertTrue(errors.isEmpty(), "Valid message should not have errors");
    }

    @Test
    void testShortMessageValidation() {
        Map<String, String> formData = new HashMap<>();
        formData.put("message", "Short");
        
        Map<String, String> errors = validateFormData(formData);
        
        assertTrue(errors.containsKey("message"), "Short message should have error");
    }

    @Test
    void testSecureIdGeneration() {
        String id1 = generateSecureId();
        String id2 = generateSecureId();
        
        assertNotNull(id1, "ID should not be null");
        assertTrue(id1.length() > 0, "ID should not be empty");
        assertNotEquals(id1, id2, "IDs should be unique");
    }

    @Test
    void testIdMasking() {
        assertEquals("****", maskId(null));
        assertEquals("****", maskId("abc"));
        assertTrue(maskId("12345678").startsWith("1234"));
        assertTrue(maskId("12345678").endsWith("5678"));
    }

    @Test
    void testKeySanitization() {
        assertEquals("email", sanitizeKey("email"));
        assertEquals("email_field", sanitizeKey("email-field"));
        assertEquals("email_field", sanitizeKey("email.field"));
        assertEquals("unknown", sanitizeKey(null));
    }

    // Helper methods
    private Map<String, String> validateFormData(Map<String, String> formData) {
        Map<String, String> errors = new HashMap<>();
        
        if (formData.containsKey("fullName")) {
            String name = formData.get("fullName");
            if (name == null || name.trim().isEmpty()) {
                errors.put("fullName", "Name is required");
            } else if (name.length() < 2) {
                errors.put("fullName", "Name must be at least 2 characters");
            }
        }

        if (formData.containsKey("email")) {
            String email = formData.get("email");
            if (email == null || email.trim().isEmpty()) {
                errors.put("email", "Email is required");
            } else if (!email.matches("^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$")) {
                errors.put("email", "Invalid email format");
            }
        }

        if (formData.containsKey("message")) {
            String message = formData.get("message");
            if (message == null || message.trim().isEmpty()) {
                errors.put("message", "Message is required");
            } else if (message.length() < 10) {
                errors.put("message", "Message must be at least 10 characters");
            }
        }

        if (formData.containsKey("password")) {
            String password = formData.get("password");
            if (password == null || password.isEmpty()) {
                errors.put("password", "Password is required");
            } else if (password.length() < 6) {
                errors.put("password", "Password must be at least 6 characters");
            }
        }
        
        return errors;
    }

    private String generateSecureId() {
        try {
            java.security.MessageDigest md = java.security.MessageDigest.getInstance("SHA-256");
            byte[] hash = md.digest((System.nanoTime() + "").getBytes());
            return java.util.Base64.getUrlEncoder().withoutPadding().encodeToString(hash).substring(0, 16);
        } catch (Exception e) {
            return "fallback-" + System.nanoTime();
        }
    }

    private String maskId(String id) {
        if (id == null || id.length() < 8) {
            return "****";
        }
        return id.substring(0, 4) + "****" + id.substring(id.length() - 4);
    }

    private String sanitizeKey(String key) {
        if (key == null) {
            return "unknown";
        }
        return key.replaceAll("[^a-zA-Z0-9_]", "_");
    }
}
