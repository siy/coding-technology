package org.pragmatica.training.rtb;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.pragmatica.lang.Cause;
import org.pragmatica.lang.Result;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("BidAmountExercise.parseBidAmount")
class BidAmountExerciseTest {

    /// Extract cause from a failed Result, or fail the test if it's a success.
    private Cause extractCause(Result<?> result) {
        return result.fold(
            cause -> cause,
            _ -> fail("Expected failure but got success")
        );
    }

    @Nested
    @DisplayName("Valid inputs")
    class ValidInputs {

        @Test
        @DisplayName("parses valid integer amount")
        void parsesValidInteger() {
            Result<BidAmount> result = BidAmountExercise.parseBidAmount("100");

            assertTrue(result.isSuccess(), "Should succeed for valid integer");
            assertEquals(new BigDecimal("100"), result.unwrap().value());
        }

        @Test
        @DisplayName("parses valid decimal amount")
        void parsesValidDecimal() {
            Result<BidAmount> result = BidAmountExercise.parseBidAmount("99.99");

            assertTrue(result.isSuccess(), "Should succeed for valid decimal");
            assertEquals(new BigDecimal("99.99"), result.unwrap().value());
        }

        @Test
        @DisplayName("parses zero amount")
        void parsesZero() {
            Result<BidAmount> result = BidAmountExercise.parseBidAmount("0");

            assertTrue(result.isSuccess(), "Zero is a valid bid amount");
            assertEquals(BigDecimal.ZERO, result.unwrap().value());
        }

        @Test
        @DisplayName("parses maximum amount")
        void parsesMaximum() {
            Result<BidAmount> result = BidAmountExercise.parseBidAmount("10000");

            assertTrue(result.isSuccess(), "Maximum value should be accepted");
            assertEquals(new BigDecimal("10000"), result.unwrap().value());
        }

        @Test
        @DisplayName("trims whitespace")
        void trimsWhitespace() {
            Result<BidAmount> result = BidAmountExercise.parseBidAmount("  50  ");

            assertTrue(result.isSuccess(), "Should trim whitespace");
            assertEquals(new BigDecimal("50"), result.unwrap().value());
        }
    }

    @Nested
    @DisplayName("Empty input")
    class EmptyInput {

        @Test
        @DisplayName("rejects null input")
        void rejectsNull() {
            Result<BidAmount> result = BidAmountExercise.parseBidAmount(null);

            assertTrue(result.isFailure(), "Should fail for null");
            assertInstanceOf(BidError.EmptyInput.class, extractCause(result));
        }

        @Test
        @DisplayName("rejects empty string")
        void rejectsEmpty() {
            Result<BidAmount> result = BidAmountExercise.parseBidAmount("");

            assertTrue(result.isFailure(), "Should fail for empty string");
            assertInstanceOf(BidError.EmptyInput.class, extractCause(result));
        }

        @Test
        @DisplayName("rejects blank string")
        void rejectsBlank() {
            Result<BidAmount> result = BidAmountExercise.parseBidAmount("   ");

            assertTrue(result.isFailure(), "Should fail for blank string");
            assertInstanceOf(BidError.EmptyInput.class, extractCause(result));
        }
    }

    @Nested
    @DisplayName("Invalid format")
    class InvalidFormat {

        @Test
        @DisplayName("rejects alphabetic input")
        void rejectsAlphabetic() {
            Result<BidAmount> result = BidAmountExercise.parseBidAmount("abc");

            assertTrue(result.isFailure(), "Should fail for non-numeric");
            Cause cause = extractCause(result);
            assertInstanceOf(BidError.InvalidFormat.class, cause);
            assertEquals("abc", ((BidError.InvalidFormat) cause).input());
        }

        @Test
        @DisplayName("rejects mixed input")
        void rejectsMixed() {
            Result<BidAmount> result = BidAmountExercise.parseBidAmount("12.34abc");

            assertTrue(result.isFailure(), "Should fail for mixed input");
            assertInstanceOf(BidError.InvalidFormat.class, extractCause(result));
        }

        @Test
        @DisplayName("rejects special characters")
        void rejectsSpecialChars() {
            Result<BidAmount> result = BidAmountExercise.parseBidAmount("$100");

            assertTrue(result.isFailure(), "Should fail for currency symbol");
            assertInstanceOf(BidError.InvalidFormat.class, extractCause(result));
        }
    }

    @Nested
    @DisplayName("Business rule violations")
    class BusinessRules {

        @Test
        @DisplayName("rejects negative amount")
        void rejectsNegative() {
            Result<BidAmount> result = BidAmountExercise.parseBidAmount("-5");

            assertTrue(result.isFailure(), "Should fail for negative");
            assertInstanceOf(BidError.NegativeAmount.class, extractCause(result));
        }

        @Test
        @DisplayName("rejects amount exceeding maximum")
        void rejectsExceedsMaximum() {
            Result<BidAmount> result = BidAmountExercise.parseBidAmount("10001");

            assertTrue(result.isFailure(), "Should fail for exceeding max");
            assertInstanceOf(BidError.ExceedsMaximum.class, extractCause(result));
        }

        @Test
        @DisplayName("rejects large amount")
        void rejectsLargeAmount() {
            Result<BidAmount> result = BidAmountExercise.parseBidAmount("999999");

            assertTrue(result.isFailure(), "Should fail for very large amount");
            assertInstanceOf(BidError.ExceedsMaximum.class, extractCause(result));
        }
    }
}
