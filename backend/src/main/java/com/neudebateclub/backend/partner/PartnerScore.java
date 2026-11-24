package com.neudebateclub.backend.partner;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

/**
 * Điểm tiềm năng 0–100 của một nhà tài trợ, kèm từng thành phần để Ban Đối ngoại thấy vì sao.
 * Chỉ tính các lần tài trợ đã ký/đã thanh lý.
 */
public record PartnerScore(int total, int recency, int scale, int acceptance, int loyalty) {

    /** Chưa có phản hồi đồng ý/từ chối nào: cho điểm giữa để không phạt nhà tài trợ mới. */
    static final int NEUTRAL_ACCEPTANCE = 12;

    static PartnerScore of(LocalDate lastSigned, BigDecimal signedTotal, BigDecimal maxSignedTotal,
                           int signedCount, long agreed, long declined, LocalDate today) {
        int recency = 0;
        if (lastSigned != null) {
            long days = ChronoUnit.DAYS.between(lastSigned, today);
            recency = days <= 365 ? 30 : days <= 730 ? 20 : days <= 1095 ? 10 : 0;
        }
        int scale = maxSignedTotal.signum() > 0
                ? signedTotal.multiply(BigDecimal.valueOf(25)).divide(maxSignedTotal, 0, RoundingMode.HALF_UP).intValue()
                : 0;
        int acceptance = agreed + declined == 0
                ? NEUTRAL_ACCEPTANCE
                : (int) Math.round(25.0 * agreed / (agreed + declined));
        int loyalty = Math.min(20, 7 * signedCount);
        return new PartnerScore(recency + scale + acceptance + loyalty, recency, scale, acceptance, loyalty);
    }
}
