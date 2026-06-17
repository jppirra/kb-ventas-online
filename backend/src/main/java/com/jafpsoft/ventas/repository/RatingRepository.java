package com.jafpsoft.ventas.repository;

import com.jafpsoft.ventas.model.Rating;
import com.jafpsoft.ventas.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RatingRepository extends JpaRepository<Rating, Long> {
    Optional<Rating> findByUserId(Long userId);
    long countByScore(int score);
    void deleteByUser(User user);
}
