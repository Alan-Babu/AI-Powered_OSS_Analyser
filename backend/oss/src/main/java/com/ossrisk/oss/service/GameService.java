package com.ossrisk.oss.service;

import com.ossrisk.oss.model.Challenge;
import com.ossrisk.oss.model.User;
import com.ossrisk.oss.model.UserProgress;
import com.ossrisk.oss.repository.ChallengeRepository;
import com.ossrisk.oss.repository.UserProgressRepository;
import com.ossrisk.oss.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;


@Service
@RequiredArgsConstructor
public class GameService {
    private final ChallengeRepository challengeRepository;
    private final UserProgressRepository userProgressRepository;
    private final UserRepository userRepository;

    public List<Challenge> getChallenges(String difficulty, String category){
        if(difficulty != null) return challengeRepository.findByDifficulty(difficulty);
        if(category != null) return challengeRepository.findByCategory(category);
        return challengeRepository.findAll();
    }

    public Challenge getChallenge(Long id){
        return challengeRepository.findById(id)
                .orElseThrow(()->new RuntimeException("challenge not found"));
    }

    public List<Map<String,Object>> getLeaderboard(){
        return userProgressRepository.findAll().stream()
                .sorted(Comparator.comparingInt(UserProgress::getScore).reversed())
                .map(p-> {
                    Map<String, Object> entry = new HashMap<>();
                    entry.put("name", p.getUser().getUsername());
                    entry.put("score", p.getScore());
                    entry.put("level", p.getLevel());
                    entry.put("challengesCompleted", p.getChallengesCompleted());
                    entry.put("averageTime", p.getChallengesCompleted() == 0 ? 0 : p.getTotalTimeSpent() / p.getChallengesCompleted());
                    return entry;
                })
                .toList();
    }

    public UserProgress getOrCreateProgress(User user){
        return userProgressRepository.findByUser(user)
                .orElseGet(()->{
                    UserProgress progress = new UserProgress();
                    progress.setUser(user);
                    return userProgressRepository.save(progress);
                });
    }

    public void updateProgress(User user,UserProgress updated){
        UserProgress existing = getOrCreateProgress(user);
        existing.setScore(updated.getScore());
        existing.setLevel(updated.getLevel());
        existing.setLivesRemaining(updated.getLivesRemaining());
        existing.setUpdatedAt(updated.getUpdatedAt());
        userProgressRepository.save(existing);
    }

}
