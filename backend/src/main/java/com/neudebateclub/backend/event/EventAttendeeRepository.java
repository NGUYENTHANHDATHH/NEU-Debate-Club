package com.neudebateclub.backend.event;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface EventAttendeeRepository extends JpaRepository<EventAttendee, UUID> {

    Optional<EventAttendee> findByEventIdAndEmail(UUID eventId, String email);

    List<EventAttendee> findByEventIdOrderByFullNameAsc(UUID eventId);

    /** Khoá dòng để hai máy quét cùng một mã không cùng check-in thành công. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<EventAttendee> findWithLockByIdAndEventId(UUID id, UUID eventId);
}
