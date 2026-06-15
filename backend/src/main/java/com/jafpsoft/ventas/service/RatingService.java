package com.jafpsoft.ventas.service;

import com.jafpsoft.ventas.dto.rating.RatingRequest;
import com.jafpsoft.ventas.dto.rating.RatingResponse;
import com.jafpsoft.ventas.model.Rating;
import com.jafpsoft.ventas.model.User;
import com.jafpsoft.ventas.repository.RatingRepository;
import com.jafpsoft.ventas.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RatingService {

    private final RatingRepository ratingRepository;
    private final UserRepository userRepository;

    @Transactional
    public RatingResponse submit(Long userId, RatingRequest req) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado."));
        Rating r = ratingRepository.findByUserId(userId)
                .map(existing -> { existing.setScore(req.getScore()); existing.setComment(req.getComment()); return existing; })
                .orElse(Rating.builder().user(user).score(req.getScore()).comment(req.getComment()).build());
        return toDto(ratingRepository.save(r));
    }

    @Transactional(readOnly = true)
    public RatingResponse getMine(Long userId) {
        return ratingRepository.findByUserId(userId).map(this::toDto).orElse(null);
    }

    @Transactional(readOnly = true)
    public List<RatingResponse> getAll() {
        return ratingRepository.findAll().stream().map(this::toDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public RatingResponse.Summary getSummary() {
        List<Rating> all = ratingRepository.findAll();
        long total = all.size();
        double average = total == 0 ? 0 : all.stream().mapToInt(Rating::getScore).average().orElse(0);
        Map<Integer, Long> distribution = Map.of(
            1, ratingRepository.countByScore(1),
            2, ratingRepository.countByScore(2),
            3, ratingRepository.countByScore(3),
            4, ratingRepository.countByScore(4),
            5, ratingRepository.countByScore(5)
        );
        return RatingResponse.Summary.builder().total(total).average(average).distribution(distribution).build();
    }

    private RatingResponse toDto(Rating r) {
        return RatingResponse.builder()
                .id(r.getId()).userName(r.getUser().getName()).userEmail(r.getUser().getEmail())
                .score(r.getScore()).comment(r.getComment()).createdAt(r.getCreatedAt())
                .build();
    }
}
