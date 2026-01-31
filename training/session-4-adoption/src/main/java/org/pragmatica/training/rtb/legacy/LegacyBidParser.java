package org.pragmatica.training.rtb.legacy;

import java.math.BigDecimal;

/// Simulates a legacy bid parser that uses exceptions.
/// This is the kind of code you'll find in existing codebases.
public final class LegacyBidParser {

    /// Parse a bid from JSON string.
    /// @throws BidParseException if parsing fails
    public LegacyBid parse(String json) throws BidParseException {
        if (json == null || json.isBlank()) {
            throw new BidParseException("JSON cannot be null or empty");
        }

        // Simplified parsing - in real code this would use Jackson/Gson
        try {
            if (!json.contains("dspId") || !json.contains("amount")) {
                throw new BidParseException("Missing required fields");
            }

            String dspId = extractField(json, "dspId");
            BigDecimal amount = new BigDecimal(extractField(json, "amount"));
            String markup = extractField(json, "markup");

            return new LegacyBid(dspId, amount, markup);
        } catch (NumberFormatException e) {
            throw new BidParseException("Invalid amount format: " + e.getMessage());
        }
    }

    private String extractField(String json, String field) {
        // Simplified extraction - real code would parse properly
        int start = json.indexOf("\"" + field + "\":\"");
        if (start < 0) {
            start = json.indexOf("\"" + field + "\":");
            if (start < 0) return "";
            start = json.indexOf(":", start) + 1;
            int end = json.indexOf(",", start);
            if (end < 0) end = json.indexOf("}", start);
            return json.substring(start, end).trim();
        }
        start = json.indexOf(":\"", start) + 2;
        int end = json.indexOf("\"", start);
        return json.substring(start, end);
    }

    /// Legacy bid representation.
    public record LegacyBid(String dspId, BigDecimal amount, String markup) {}

    /// Legacy exception for parse failures.
    public static class BidParseException extends Exception {
        public BidParseException(String message) {
            super(message);
        }
    }
}
