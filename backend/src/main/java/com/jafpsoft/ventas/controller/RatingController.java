package com.jafpsoft.ventas.controller;

import com.jafpsoft.ventas.dto.rating.RatingRequest;
import com.jafpsoft.ventas.dto.rating.RatingResponse;
import com.jafpsoft.ventas.security.JwtTokenProvider;
import com.jafpsoft.ventas.service.RatingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class RatingController {

    private final RatingService ratingService;
    private final JwtTokenProvider jwtTokenProvider;

    @PostMapping("/ratings")
    public ResponseEntity<RatingResponse> submit(@Valid @RequestBody RatingRequest req,
                                                  @RequestHeader("Authorization") String auth) {
        Long userId = jwtTokenProvider.getUserIdFromToken(auth.replace("Bearer ", ""));
        return ResponseEntity.ok(ratingService.submit(userId, req));
    }

    @GetMapping("/ratings/mine")
    public ResponseEntity<RatingResponse> getMine(@RequestHeader("Authorization") String auth) {
        Long userId = jwtTokenProvider.getUserIdFromToken(auth.replace("Bearer ", ""));
        RatingResponse r = ratingService.getMine(userId);
        return r != null ? ResponseEntity.ok(r) : ResponseEntity.noContent().build();
    }

    @GetMapping("/admin/ratings")
    public ResponseEntity<List<RatingResponse>> getAll() {
        return ResponseEntity.ok(ratingService.getAll());
    }

    @GetMapping("/admin/ratings/summary")
    public ResponseEntity<RatingResponse.Summary> getSummary() {
        return ResponseEntity.ok(ratingService.getSummary());
    }
}
