package com.platform.storereview.repository;

import com.platform.storereview.model.Store;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StoreRepository extends JpaRepository<Store, Long> {

    Optional<Store> findByOwnerId(Long ownerId);

    boolean existsByName(String name);

    boolean existsByOwnerId(Long ownerId);

    @Query("SELECT s FROM Store s WHERE " +
           "(:name IS NULL OR LOWER(s.name) LIKE LOWER(CONCAT('%', :name, '%'))) AND " +
           "(:address IS NULL OR LOWER(s.address) LIKE LOWER(CONCAT('%', :address, '%')))")
    List<Store> findFilteredStores(
            @Param("name") String name,
            @Param("address") String address
    );
}
