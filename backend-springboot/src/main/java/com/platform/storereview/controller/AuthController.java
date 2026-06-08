package com.platform.storereview.controller;

import com.platform.storereview.dto.AuthRequest;
import com.platform.storereview.dto.AuthResponse;
import com.platform.storereview.dto.UpdatePasswordRequest;
import com.platform.storereview.dto.UserDto;
import com.platform.storereview.model.User;
import com.platform.storereview.model.UserRole;
import com.platform.storereview.repository.UserRepository;
import com.platform.storereview.security.JwtTokenUtil;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenUtil jwtTokenUtil;

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@Valid @RequestBody AuthRequest request) {
        if (request.getName() == null || request.getName().trim().length() < 2 || request.getName().length() > 60) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "Name must be between 2 and 60 characters."));
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "Email is already registered."));
        }

        // Validate password guidelines
        String password = request.getPassword();
        if (password.length() < 8 || password.length() > 16) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "Password must be between 8 and 16 characters."));
        }
        if (!password.matches(".*[A-Z].*")) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "Password must contain at least one uppercase letter."));
        }
        if (!password.matches(".*[!@#$%^&*(),.?\":{}|<>].*")) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "Password must contain at least one special character."));
        }

        String address = request.getAddress() != null ? request.getAddress() : "Address details pending.";
        if (address.length() > 400) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "Address length cannot exceed 400 characters."));
        }

        // Standard profiles registering via public sign-up are assigned UserRole.USER
        User newUser = new User(
                request.getName().trim(),
                request.getEmail().trim().toLowerCase(),
                passwordEncoder.encode(password),
                address,
                UserRole.USER
        );

        userRepository.save(newUser);
        
        String token = jwtTokenUtil.generateToken(newUser.getEmail(), newUser.getRole().name());
        return ResponseEntity.ok(new AuthResponse(token, new UserDto(newUser, null)));
    }

    @PostMapping("/login")
    public ResponseEntity<?> loginUser(@RequestBody AuthRequest request) {
        Optional<User> userOpt = userRepository.findByEmail(request.getEmail().trim().toLowerCase());
        if (userOpt.isEmpty() || !passwordEncoder.matches(request.getPassword(), userOpt.get().getPassword())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "The password you entered is incorrect."));
        }

        User user = userOpt.get();
        String token = jwtTokenUtil.generateToken(user.getEmail(), user.getRole().name());
        return ResponseEntity.ok(new AuthResponse(token, new UserDto(user, null)));
    }

    @PostMapping("/update-password")
    public ResponseEntity<?> updatePassword(
            @Valid @RequestBody UpdatePasswordRequest request,
            @AuthenticationPrincipal User activeUser) {

        if (activeUser == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Unauthorized context."));
        }

        if (!passwordEncoder.matches(request.getCurrentPassword(), activeUser.getPassword())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "The current password is incorrect."));
        }

        String newPwd = request.getNewPassword();
        if (newPwd.length() < 8 || newPwd.length() > 16) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "Password must be 8-16 characters."));
        }
        if (!newPwd.matches(".*[A-Z].*")) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "Password needs an uppercase character."));
        }
        if (!newPwd.matches(".*[!@#$%^&*(),.?\":{}|<>].*")) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "Password needs a special token character."));
        }

        activeUser.setPassword(passwordEncoder.encode(newPwd));
        userRepository.save(activeUser);

        return ResponseEntity.ok(Map.of("message", "Password successfully updated."));
    }
}
