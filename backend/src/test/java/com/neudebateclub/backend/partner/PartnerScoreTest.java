package com.neudebateclub.backend.partner;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.assertEquals;

class PartnerScoreTest {

    private static final LocalDate TODAY = LocalDate.parse("2026-11-25");

    @Test
    void topRecentLoyalSponsorGetsFullScore() {
        PartnerScore score = PartnerScore.of(TODAY.minusMonths(2), new BigDecimal("50000000"),
                new BigDecimal("50000000"), 3, 4, 0, TODAY);
        assertEquals(new PartnerScore(100, 30, 25, 25, 20), score);
    }

    @Test
    void newProspectGetsOnlyNeutralAcceptance() {
        PartnerScore score = PartnerScore.of(null, BigDecimal.ZERO, BigDecimal.ZERO, 0, 0, 0, TODAY);
        assertEquals(new PartnerScore(12, 0, 0, 12, 0), score);
    }

    @Test
    void olderSmallerSponsorWithMixedReplies() {
        // 18 tháng trước → 20; 10tr/40tr → 6.25 → 6; 1/3 đồng ý → 8; 1 lần → 7.
        PartnerScore score = PartnerScore.of(TODAY.minusMonths(18), new BigDecimal("10000000"),
                new BigDecimal("40000000"), 1, 1, 2, TODAY);
        assertEquals(new PartnerScore(41, 20, 6, 8, 7), score);
    }

    @Test
    void sponsorshipOlderThanThreeYearsGivesNoRecency() {
        assertEquals(0, PartnerScore.of(TODAY.minusYears(4), BigDecimal.ONE, BigDecimal.ONE, 1, 0, 0, TODAY).recency());
    }
}
