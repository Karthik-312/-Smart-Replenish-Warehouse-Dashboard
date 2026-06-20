package com.stockpulse.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.HashMap;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

@RestController
@RequestMapping("/api/barcode-lookup")
@Tag(name = "Barcode Lookup", description = "Look up product info from external barcode databases")
public class BarcodeLookupController {

    private static final Logger log = LoggerFactory.getLogger(BarcodeLookupController.class);
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(4))
            .followRedirects(HttpClient.Redirect.NORMAL)
            .build();
    private final ObjectMapper mapper = new ObjectMapper();

    @GetMapping("/{barcode}")
    @Operation(summary = "Look up a product by barcode from external databases")
    public ResponseEntity<?> lookup(@PathVariable String barcode) {
        log.info("Looking up barcode: {}", barcode);

        // 1. Try Open Food Facts
        var result = tryOpenFacts("world.openfoodfacts.org", barcode);
        if (result != null) return ResponseEntity.ok(result);

        // 2. Try Open Products Facts (household, cleaning, etc.)
        result = tryOpenFacts("world.openproductsfacts.org", barcode);
        if (result != null) return ResponseEntity.ok(result);

        // 3. Try Open Beauty Facts
        result = tryOpenFacts("world.openbeautyfacts.org", barcode);
        if (result != null) return ResponseEntity.ok(result);

        // 4. Try UPC ItemDB
        result = tryUpcItemDb(barcode);
        if (result != null) return ResponseEntity.ok(result);

        // 5. Try DuckDuckGo Instant Answer (reliable, doesn't block bots)
        result = tryDuckDuckGo(barcode);
        if (result != null) return ResponseEntity.ok(result);

        // 6. Try scraping eandata.com
        result = tryEanData(barcode);
        if (result != null) return ResponseEntity.ok(result);

        log.info("Barcode {} not found in any database", barcode);
        return ResponseEntity.ok(Map.of("found", false, "barcode", barcode));
    }

    private Map<String, Object> tryOpenFacts(String domain, String barcode) {
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://" + domain + "/api/v0/product/" + barcode + ".json"))
                    .header("User-Agent", "StockPulse/1.0 (inventory-app)")
                    .timeout(Duration.ofSeconds(4))
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() != 200) return null;

            JsonNode root = mapper.readTree(response.body());
            if (root.path("status").asInt() != 1) return null;

            JsonNode product = root.path("product");
            String name = getFirst(product, "product_name", "product_name_en");
            if (name.isEmpty()) return null;

            String brand = product.path("brands").asText("");
            String category = extractCategoryFromFacts(product);
            String imageUrl = getFirst(product, "image_front_small_url", "image_front_url", "image_url");
            String fullName = brand.isEmpty() ? name : brand + " " + name;

            log.info("Found '{}' on {}", fullName, domain);
            return buildResult(fullName, brand, category, barcode, imageUrl, domain);
        } catch (Exception e) {
            log.debug("{} failed: {}", domain, e.getMessage());
            return null;
        }
    }

    private Map<String, Object> tryUpcItemDb(String barcode) {
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.upcitemdb.com/prod/trial/lookup?upc=" + barcode))
                    .header("User-Agent", "StockPulse/1.0")
                    .timeout(Duration.ofSeconds(4))
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() != 200) return null;

            JsonNode root = mapper.readTree(response.body());
            JsonNode items = root.path("items");
            if (!items.isArray() || items.isEmpty()) return null;

            JsonNode item = items.get(0);
            String name = item.path("title").asText("");
            if (name.isEmpty()) return null;

            String brand = item.path("brand").asText("");
            String category = item.path("category").asText("General");
            String imageUrl = "";
            JsonNode images = item.path("images");
            if (images.isArray() && !images.isEmpty()) {
                imageUrl = images.get(0).asText("");
            }

            log.info("Found '{}' on UPC ItemDB", name);
            return buildResult(name, brand, category, barcode, imageUrl, "upcitemdb.com");
        } catch (Exception e) {
            log.debug("UPC ItemDB failed: {}", e.getMessage());
            return null;
        }
    }

    /**
     * Uses DuckDuckGo Instant Answer API — free, no rate limits, doesn't block server requests.
     */
    private Map<String, Object> tryDuckDuckGo(String barcode) {
        try {
            String url = "https://api.duckduckgo.com/?q=" + barcode + "+barcode&format=json&no_html=1";
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .header("User-Agent", "StockPulse/1.0")
                    .timeout(Duration.ofSeconds(4))
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() != 200) return null;

            JsonNode root = mapper.readTree(response.body());

            // Check Abstract (main result)
            String abstractText = root.path("Abstract").asText("");
            String heading = root.path("Heading").asText("");

            if (!heading.isEmpty() && heading.length() > 3) {
                String category = guessCategory(abstractText + " " + heading);
                log.info("Found '{}' via DuckDuckGo", heading);
                return buildResult(heading, "", category, barcode, root.path("Image").asText(""), "duckduckgo");
            }

            // Check Related Topics
            JsonNode relatedTopics = root.path("RelatedTopics");
            if (relatedTopics.isArray() && !relatedTopics.isEmpty()) {
                JsonNode first = relatedTopics.get(0);
                String text = first.path("Text").asText("");
                if (!text.isEmpty() && text.length() > 5) {
                    String name = text.length() > 80 ? text.substring(0, 80) : text;
                    String category = guessCategory(text);
                    log.info("Found '{}' via DuckDuckGo related", name);
                    return buildResult(name, "", category, barcode, first.path("Icon").path("URL").asText(""), "duckduckgo");
                }
            }

            return null;
        } catch (Exception e) {
            log.debug("DuckDuckGo failed: {}", e.getMessage());
            return null;
        }
    }

    /**
     * Tries eandata.com which is a free barcode database with good international coverage.
     */
    private Map<String, Object> tryEanData(String barcode) {
        try {
            String url = "https://eandata.com/feed/?v=3&keycode=FREE&mode=json&find=" + barcode;
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .header("User-Agent", "StockPulse/1.0")
                    .timeout(Duration.ofSeconds(4))
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() != 200) return null;

            JsonNode root = mapper.readTree(response.body());
            JsonNode product = root.path("product");
            if (product.isMissingNode()) return null;

            String name = getFirst(product, "name", "description");
            if (name.isEmpty()) return null;

            String brand = product.path("company").asText("");
            String category = product.path("categoryName").asText("General");
            String imageUrl = product.path("image").asText("");

            log.info("Found '{}' on eandata.com", name);
            return buildResult(name, brand, category, barcode, imageUrl, "eandata.com");
        } catch (Exception e) {
            log.debug("EanData failed: {}", e.getMessage());
            return null;
        }
    }

    private String guessCategory(String text) {
        String lower = text.toLowerCase();
        if (lower.contains("detergent") || lower.contains("cleaning") || lower.contains("wash") || lower.contains("soap")) {
            return "Household";
        } else if (lower.contains("food") || lower.contains("chocolate") || lower.contains("snack") || lower.contains("biscuit") || lower.contains("beverage") || lower.contains("drink")) {
            return "Food & Beverages";
        } else if (lower.contains("shampoo") || lower.contains("cosmetic") || lower.contains("beauty") || lower.contains("cream")) {
            return "Personal Care";
        } else if (lower.contains("electronic") || lower.contains("phone") || lower.contains("cable") || lower.contains("charger")) {
            return "Electronics";
        } else if (lower.contains("medicine") || lower.contains("tablet") || lower.contains("health")) {
            return "Health";
        }
        return "General";
    }

    private Map<String, Object> buildResult(String name, String brand, String category, String barcode, String imageUrl, String source) {
        Map<String, Object> result = new HashMap<>();
        result.put("found", true);
        result.put("name", name);
        result.put("brand", brand != null ? brand : "");
        result.put("category", (category != null && !category.isEmpty()) ? category : "General");
        result.put("barcode", barcode);
        result.put("imageUrl", imageUrl != null ? imageUrl : "");
        result.put("source", source);
        return result;
    }

    private String getFirst(JsonNode node, String... fields) {
        for (String field : fields) {
            String val = node.path(field).asText("");
            if (!val.isEmpty()) return val;
        }
        return "";
    }

    private String extractCategoryFromFacts(JsonNode product) {
        JsonNode tags = product.path("categories_tags");
        if (tags.isArray() && !tags.isEmpty()) {
            String last = tags.get(tags.size() - 1).asText("");
            String cleaned = last.replaceFirst("^en:", "").replace("-", " ");
            if (!cleaned.isEmpty()) {
                return cleaned.substring(0, 1).toUpperCase() + cleaned.substring(1);
            }
        }
        String catString = product.path("categories").asText("");
        if (!catString.isEmpty()) {
            String[] parts = catString.split(",");
            return parts[parts.length - 1].trim();
        }
        return "";
    }
}
