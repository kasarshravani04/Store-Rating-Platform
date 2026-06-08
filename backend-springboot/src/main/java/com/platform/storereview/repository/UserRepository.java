package com.platform.storereview.repository;

import com.platform.storereview.model.User;
import com.platform.storereview.model.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    List<User> findByRole(UserRole role);

    @Query("SELECT u FROM User u WHERE " +
           "(:name IS NULL OR LOWER(u.name) LIKE LOWER(CONCAT('%', :name, '%'))) AND " +
           "(:email IS NULL OR LOWER(u.email) LIKE LOWER(CONCAT('%', :email, '%'))) AND " +
           "(:address IS NULL OR LOWER(u.address) LIKE LOWER(CONCAT('%', :address, '%'))) AND " +
           "(:role IS NULL OR u.role = :role)")
    List<User> findFilteredUsers(
            @Param("name") String name,
            @Param("email") String email,
            @Param("address") String address,
            @Param("role") UserRole role
    );
}
