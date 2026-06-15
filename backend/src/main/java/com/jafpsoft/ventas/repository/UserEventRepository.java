package com.jafpsoft.ventas.repository;

import com.jafpsoft.ventas.model.UserEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Map;

public interface UserEventRepository extends JpaRepository<UserEvent, Long> {

    @Query("SELECT COUNT(DISTINCT e.userId) FROM UserEvent e WHERE e.createdAt >= :since")
    long countDistinctUsersSince(@Param("since") Instant since);

    @Query("""
            SELECT e.page AS page, COUNT(e) AS count
            FROM UserEvent e
            WHERE e.eventType = 'PAGE_VIEW' AND e.createdAt >= :since
            GROUP BY e.page
            ORDER BY COUNT(e) DESC
            LIMIT 10
            """)
    List<Map<String, Object>> findTopPagesSince(@Param("since") Instant since);

    @Query("""
            SELECT e.deviceType AS key, COUNT(e) AS count
            FROM UserEvent e
            WHERE e.createdAt >= :since
            GROUP BY e.deviceType
            """)
    List<Map<String, Object>> countByDeviceTypeSince(@Param("since") Instant since);

    @Query("""
            SELECT e.browser AS key, COUNT(e) AS count
            FROM UserEvent e
            WHERE e.createdAt >= :since
            GROUP BY e.browser
            """)
    List<Map<String, Object>> countByBrowserSince(@Param("since") Instant since);

    @Query("""
            SELECT e.os AS key, COUNT(e) AS count
            FROM UserEvent e
            WHERE e.createdAt >= :since
            GROUP BY e.os
            """)
    List<Map<String, Object>> countByOsSince(@Param("since") Instant since);

    @Query("""
            SELECT e.eventType AS key, COUNT(e) AS count
            FROM UserEvent e
            WHERE e.createdAt >= :since
            GROUP BY e.eventType
            """)
    List<Map<String, Object>> countByEventTypeSince(@Param("since") Instant since);

    @Query(value = """
            SELECT DATE(created_at AT TIME ZONE 'UTC') AS date, COUNT(DISTINCT user_id) AS count
            FROM user_events
            WHERE created_at >= :since
            GROUP BY DATE(created_at AT TIME ZONE 'UTC')
            ORDER BY date
            """, nativeQuery = true)
    List<Map<String, Object>> findDailyActiveUsersSince(@Param("since") Instant since);

    List<UserEvent> findTop200ByOrderByCreatedAtDesc();
}
