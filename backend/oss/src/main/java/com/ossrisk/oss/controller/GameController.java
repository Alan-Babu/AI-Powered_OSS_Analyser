package com.ossrisk.oss.controller;

import com.ossrisk.oss.model.Challenge;
import com.ossrisk.oss.model.User;
import com.ossrisk.oss.model.UserProgress;
import com.ossrisk.oss.repository.UserProgressRepository;
import com.ossrisk.oss.repository.UserRepository;
import com.ossrisk.oss.service.GameService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class GameController {
    private final GameService gameService;
    private final UserRepository userRepository;

    @GetMapping("/challenges")
    public ResponseEntity<List<Challenge>> getChallenges(
            @RequestParam(required = false) String difficulty,
            @RequestParam(required = false) String category
    ){
        return ResponseEntity.ok(gameService.getChallenges(difficulty,category));
    }

    @GetMapping("/leaderboard")
    public ResponseEntity<?> getLeaderboard(){
        return ResponseEntity.ok(gameService.getLeaderboard());
    }

    @GetMapping("/user/progress/me")
    public ResponseEntity<UserProgress> getMyProgress(Authentication auth){
        User user = userRepository.findByUsername(auth.getName()).orElseThrow();
        return ResponseEntity.ok(gameService.getOrCreateProgress(user));
    }

    @PutMapping("/user/progress/{userId}")
    public ResponseEntity<?> updateProgress(
            @PathVariable Long userId,
            @RequestBody UserProgress req,
            Authentication auth){
        User user = userRepository.findById(userId).orElseThrow();
        if(!auth.getName().equals(user.getUsername()))
            return ResponseEntity.status(403).body("forbidden");
        gameService.updateProgress(user,req);
        return ResponseEntity.ok().build();
    }
}
