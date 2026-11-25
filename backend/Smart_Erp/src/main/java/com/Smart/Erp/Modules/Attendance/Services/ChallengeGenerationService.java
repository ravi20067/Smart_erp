package com.Smart.Erp.Modules.Attendance.Services;

import com.Smart.Erp.Modules.Attendance.Enum.LivenessChallenge;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.util.*;

@Service
public class ChallengeGenerationService {

    private final SecureRandom random = new SecureRandom();

    private static final List<LivenessChallenge> DYNAMIC_CHALLENGES = List.of(
            LivenessChallenge.BLINK_TWICE,
            LivenessChallenge.TURN_LEFT,
            LivenessChallenge.TURN_RIGHT,
            LivenessChallenge.LOOK_UP,
            LivenessChallenge.LOOK_DOWN
    );

    public List<LivenessChallenge> generateChallengeSequence() {
        List<LivenessChallenge> sequence = new ArrayList<>();
        // Challenge 1 is always LOOK_STRAIGHT to establish baseline orientation and capture enrollment comparison embedding
        sequence.add(LivenessChallenge.LOOK_STRAIGHT);

        List<LivenessChallenge> pool = new ArrayList<>(DYNAMIC_CHALLENGES);
        Collections.shuffle(pool, random);

        // Pick 2 additional distinct dynamic challenges
        sequence.add(pool.get(0));
        sequence.add(pool.get(1));

        return sequence;
    }

    public String serializeSequence(List<LivenessChallenge> sequence) {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < sequence.size(); i++) {
            if (i > 0) sb.append(",");
            sb.append(sequence.get(i).name());
        }
        return sb.toString();
    }

    public List<LivenessChallenge> deserializeSequence(String serialized) {
        if (serialized == null || serialized.isBlank()) {
            return Collections.emptyList();
        }
        String[] parts = serialized.split(",");
        List<LivenessChallenge> list = new ArrayList<>();
        for (String p : parts) {
            try {
                list.add(LivenessChallenge.valueOf(p.trim()));
            } catch (IllegalArgumentException ignored) {
            }
        }
        return list;
    }
}
