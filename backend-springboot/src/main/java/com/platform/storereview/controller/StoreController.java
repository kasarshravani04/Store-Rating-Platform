package com.platform.storereview.controller;

import com.platform.storereview.dto.RatingDto;
import com.platform.storereview.dto.StoreDto;
import com.platform.storereview.model.Rating;
import com.platform.storereview.model.Store;
import com.platform.storereview.model.User;
import com.platform.storereview.model.UserRole;
import com.platform.storereview.repository.RatingRepository;
import com.platform.storereview.repository.StoreRepository;
import com.platform.storereview.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
public class StoreController {

    @Autowired
    private StoreRepository storeRepository;

    @Autowired
    private RatingRepository ratingRepository;

    @Autowired
    private UserRepository userRepository;

    @GetMapping("/api/stores")
    public ResponseEntity<?> getStoresFiltered(
            @RequestParam(value = "name", required = false) String name,
            @RequestParam(value = "address", required = false) String address,
            @AuthenticationPrincipal User activeUser) {

        List<Store> stores = storeRepository.findFilteredStores(
                name != null && !name.trim().isEmpty() ? name.trim() : null,
                address != null && !address.trim().isEmpty() ? address.trim() : null
        );

        List<StoreDto> dtoList = new ArrayList<>();
        for (Store s : stores) {
            Double avg = ratingRepository.getAverageRatingForStore(s.getId());
            if (avg == null) avg = 0.0;

            Integer userSubmittedRating = null;
            if (activeUser != null) {
                Optional<Rating> ratingOpt = ratingRepository.findByUserIdAndStoreId(activeUser.getId(), s.getId());
                if (ratingOpt.isPresent()) {
                    userSubmittedRating = ratingOpt.get().getRating();
                }
            }

            dtoList.add(new StoreDto(s, avg, userSubmittedRating));
        }

        return ResponseEntity.ok(dtoList);
    }

    @GetMapping("/api/owner/dashboard")
    public ResponseEntity<?> getOwnerDashboardStats(@AuthenticationPrincipal User activeUser) {
        if (activeUser == null || activeUser.getRole() != UserRole.OWNER) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Only Store Owners can access this dashboard portal."));
        }

        Optional<Store> storeOpt = storeRepository.findByOwnerId(activeUser.getId());
        if (storeOpt.isEmpty()) {
            return ResponseEntity.ok(Map.of(
                    "store", null,
                    "averageRating", 0.0,
                    "ratingsReceived", new ArrayList<>()
            ));
        }

        Store store = storeOpt.get();
        Double avg = ratingRepository.getAverageRatingForStore(store.getId());
        if (avg == null) avg = 0.0;

        List<Rating> ratings = ratingRepository.findByStoreId(store.getId());
        List<RatingDto> dtoList = new ArrayList<>();
        for (Rating r : ratings) {
            dtoList.add(new RatingDto(r));
        }

        Map<String, Object> result = new HashMap<>();
        result.put("store", store);
        result.put("averageRating", avg);
        result.put("ratingsReceived", dtoList);

        return ResponseEntity.ok(result);
    }

    @PostMapping("/api/ratings/submit")
    public ResponseEntity<?> submitStoreRating(
            @RequestBody Map<String, Object> payload,
            @AuthenticationPrincipal User activeUser) {

        if (activeUser == null || activeUser.getRole() != UserRole.USER) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Only normal Customer User accounts can submit reviews."));
        }

        Object storeIdObj = payload.get("storeId");
        Object ratingValObj = payload.get("rating");

        if (storeIdObj == null || ratingValObj == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "Missing required rating parameters."));
        }

        Long storeId;
        Integer ratingVal;

        try {
            storeId = Long.parseLong(storeIdObj.toString());
            ratingVal = Integer.parseInt(ratingValObj.toString());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "Invalid rating parameters format."));
        }

        if (ratingVal < 1 || ratingVal > 5) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "Rating value must stand between 1 and 5 stars."));
        }

        Optional<Store> storeOpt = storeRepository.findById(storeId);
        if (storeOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Target store outlet does not exist."));
        }

        Optional<Rating> existingRatingOpt = ratingRepository.findByUserIdAndStoreId(activeUser.getId(), storeId);
        Rating rating;
        if (existingRatingOpt.isPresent()) {
            rating = existingRatingOpt.get();
            rating.setRating(ratingVal);
        } else {
            rating = new Rating(ratingVal, activeUser, storeOpt.get());
        }

        ratingRepository.save(rating);

        return ResponseEntity.ok(Map.of("message", "Rating saved successfully."));
    }
}
