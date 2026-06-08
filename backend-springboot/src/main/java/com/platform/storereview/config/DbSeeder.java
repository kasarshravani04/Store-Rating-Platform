package com.platform.storereview.config;

import com.platform.storereview.model.Rating;
import com.platform.storereview.model.Store;
import com.platform.storereview.model.User;
import com.platform.storereview.model.UserRole;
import com.platform.storereview.repository.RatingRepository;
import com.platform.storereview.repository.StoreRepository;
import com.platform.storereview.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DbSeeder implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private StoreRepository storeRepository;

    @Autowired
    private RatingRepository ratingRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        if (userRepository.count() > 0) {
            return; // Seed already executed
        }

        // 1. Create Default Administrative Account
        User admin = new User(
                "Super Administrator Team",
                "admin@mail.com",
                passwordEncoder.encode("AdminPass123!"),
                "Secure System Administration Office, Terminal Headquarters",
                UserRole.ADMIN
        );
        userRepository.save(admin);

        // 2. Create Default Store Owner Accounts
        User owner1 = new User(
                "Alex Alexander Mercer Sr",
                "owner@mail.com",
                passwordEncoder.encode("OwnerPass123!"),
                "Mercer Square Suite A, Manhattan District",
                UserRole.OWNER
        );
        userRepository.save(owner1);

        User owner2 = new User(
                "William Blake Patterson",
                "william@mail.com",
                passwordEncoder.encode("OwnerPass123!"),
                "East Side Boulevard 41, Central City",
                UserRole.OWNER
        );
        userRepository.save(owner2);

        // 3. Create Normal Consumer Client Accounts
        User user1 = new User(
                "Christopher Nolan Miller Jr",
                "user@mail.com",
                passwordEncoder.encode("UserPass123!"),
                "Pacific Oceanic Avenue 200, California",
                UserRole.USER
        );
        userRepository.save(user1);

        User user2 = new User(
                "Emily Taylor Watson",
                "emily@mail.com",
                passwordEncoder.encode("UserPass123!"),
                "Highlands Green Apartments, Seattle Area",
                UserRole.USER
        );
        userRepository.save(user2);

        // 4. Create Store Outlets mapped to Store Owners
        Store s1 = new Store(
                "Apex Coffee Roasters & Bakery",
                "contact@apexcoffee.com",
                "Corner of Broadway & 5th Avenue, Ground level, New York NY",
                owner1
        );
        storeRepository.save(s1);

        Store s2 = new Store(
                "Summit Gear Apparel Ltd",
                "info@summitgear.com",
                "Pioneer Shopping Plaza, Block 4C, Cascade Avenue, Seattle WA",
                owner2
        );
        storeRepository.save(s2);

        // 5. Submit Preset Ratings
        Rating r1 = new Rating(5, user1, s1);
        ratingRepository.save(r1);

        Rating r2 = new Rating(4, user2, s1);
        ratingRepository.save(r2);

        Rating r3 = new Rating(3, user1, s2);
        ratingRepository.save(r3);
    }
}
