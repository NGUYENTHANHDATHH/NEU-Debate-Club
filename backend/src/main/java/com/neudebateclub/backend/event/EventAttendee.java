package com.neudebateclub.backend.event;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

/** Một người đăng ký tham gia sự kiện bằng tài khoản Google. {@code id} là nội dung mã QR của họ. */
@Entity
@Table(name = "event_attendees")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EventAttendee {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_id", nullable = false)
    private Event event;

    @Column(name = "full_name", nullable = false)
    private String fullName;

    /** Luôn lưu chữ thường: UNIQUE (event_id, email) của bảng phân biệt hoa thường. */
    @Column(nullable = false)
    private String email;

    @Column(name = "checked_in_at")
    private Instant checkedInAt;

    @Column(name = "checked_out_at")
    private Instant checkedOutAt;
}
