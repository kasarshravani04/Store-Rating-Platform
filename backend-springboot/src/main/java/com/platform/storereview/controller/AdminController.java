package com.platform.storereview.controller;

import com.platform.storereview.dto.AdminStats;
import com.platform.storereview.dto.StoreDto;
import com.platform.storereview.dto.UserDto;
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
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private StoreRepository storeRepository;

    @Autowired
    private RatingRepository ratingRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @GetMapping("/stats")
    public ResponseEntity<AdminStats> getDashboardStats() {
        long users = userRepository.count();
        long stores = storeRepository.count();
        long ratings = ratingRepository.count();
        return ResponseEntity.ok(new AdminStats(users, stores, ratings));
    }

    @GetMapping("/users")
    public ResponseEntity<List<UserDto>> getFilteredUsers(
            @RequestParam(value = "name", required = false) String name,
            @RequestParam(value = "email", required = false) String email,
            @RequestParam(value = "address", required = false) String address,
            @RequestParam(value = "role", required = false) String roleStr) {

        UserRole role = null;
        if (roleStr != null && !roleStr.trim().isEmpty()) {
            try {
                role = UserRole.valueOf(roleStr.trim().toUpperCase());
            } catch (IllegalArgumentException e) {
                // Ignore invalid role selection filter
            }
        }

        List<User> users = userRepository.findFilteredUsers(
                name != null && !name.trim().isEmpty() ? name.trim() : null,
                email != null && !email.trim().isEmpty() ? email.trim() : null,
                address != null && !address.trim().isEmpty() ? address.trim() : null,
                role
        );

        List<UserDto> response = new ArrayList<>();
        for (User u : users) {
            Double avgRating = null;
            if (u.getRole() == UserRole.OWNER) {
                Optional<Store> storeOpt = storeRepository.findByOwnerId(u.getId());
                if (storeOpt.isPresent()) {
                    avgRating = ratingRepository.getAverageRatingForStore(storeOpt.get().getId());
                    if (avgRating == null) avgRating = 0.0;
                }
            }
            response.add(new UserDto(u, avgRating));
        }

        return ResponseEntity.ok(response);
    }

    @PostMapping("/add-user")
    public ResponseEntity<?> addNewUserAccount(@RequestBody Map<String, String> body) {
        String name = body.get("name");
        String email = body.get("email");
        String password = body.get("password");
        String address = body.get("address");
        String roleStr = body.get("role");

        if (name == null || name.trim().length() < 2 || name.length() > 60) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "Name must be between 2 and 60 characters."));
        }
        if (email == null || !email.contains("@")) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "A valid email address is required."));
        }
        if (userRepository.existsByEmail(email.trim().toLowerCase())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "Email is already taken."));
        }

        // Validate password structure
        if (password == null || password.length() < 8 || password.length() > 16) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "Password must stand between 8 and 16 characters."));
        }
        if (!password.matches(".*[A-Z].*")) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "Password must contain at least one uppercase letter."));
        }
        if (!password.matches(".*[!@#$%^&*(),.?\":{}|<>].*")) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "Password must contain at least one special character."));
        }

        if (address == null || address.length() > 400) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "Address cannot exceed 400 characters."));
        }

        UserRole role = UserRole.USER;
        if (roleStr != null) {
            try {
                role = UserRole.valueOf(roleStr.trim().toUpperCase());
            } catch (Exception e) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "Invalid Account Level designated."));
            }
        }

        User u = new User(
                name.trim(),
                email.trim().toLowerCase(),
                passwordEncoder.encode(password),
                address,
                role
        );
        userRepository.save(u);

        return ResponseEntity.status(HttpStatus.CREATED).body(new UserDto(u, null));
    }

    @PostMapping("/add-store")
    public ResponseEntity<?> createStoreOutlet(@RequestBody Map<String, String> body) {
        String name = body.get("name");
        String email = body.get("email");
        String address = body.get("address");
        String ownerIdStr = body.get("ownerId");

        if (name == null || name.trim().length() < 3 || name.length() > 80) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "Store Name must be between 3 and 80 characters."));
        }
        if (email == null || !email.contains("@")) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "Store Email address is invalid."));
        }
        if (storeRepository.existsByName(name.trim())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "A store with this name already exists in our system."));
        }
        if (address == null || address.length() > 400) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "Address cannot exceed 400 characters."));
        }

        if (ownerIdStr == null || ownerIdStr.trim().isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "A valid Store Owner must be assigned."));
        }

        Long ownerId;
        try {
            ownerId = Long.parseLong(ownerIdStr.trim());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "Invalid user selection specified."));
        }

        Optional<User> ownerOpt = userRepository.findById(ownerId);
        if (ownerOpt.isEmpty() || ownerOpt.get().getRole() != UserRole.OWNER) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "Assigned account is not registered as a Store Owner."));
        }

        if (storeRepository.existsByOwnerId(ownerId)) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "This selected Owner is already assigned to a listed store."));
        }

        Store s = new Store(name.trim(), email.trim().toLowerCase(), address.trim(), ownerOpt.get());
        storeRepository.save(s);

        return ResponseEntity.status(HttpStatus.CREATED).body(new StoreDto(s, 0.0, null));
    }

    @GetMapping("/owners")
    public ResponseEntity<List<Map<String, Object>>> getAvailableOwners() {
        List<User> owners = userRepository.findByRole(UserRole.OWNER);
        List<Map<String, Object>> response = new ArrayList<>();
        for (User u : owners) {
            Map<String, Object> map = new java.util.HashMap<>();
            map.put("id", u.getId().toString());
            map.put("name", u.getName());
            response.add(map);
        }
        return ResponseEntity.ok(response);
    }
}
