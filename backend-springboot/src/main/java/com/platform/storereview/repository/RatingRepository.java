package com.platform.storereview.repository;

import com.platform.storereview.model.Rating;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RatingRepository extends JpaRepository<Rating, Long> {

    List<Rating> findByStoreId(Long storeId);

    Optional<Rating> findByUserIdAndStoreId(Long userId, Long storeId);

    @Query("SELECT AVG(r.rating) FROM Rating r WHERE r.store.id = :storeId")
    Double getAverageRatingForStore(@Param("storeId") Long storeId);

    long countByStoreId(Long storeId);
}
