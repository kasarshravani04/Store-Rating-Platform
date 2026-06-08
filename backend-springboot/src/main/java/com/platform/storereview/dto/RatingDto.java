package com.platform.storereview.dto;

import com.platform.storereview.model.Rating;

public class RatingDto {
    private Long id;
    private Integer rating;
    private String userName;
    private String storeName;

    public RatingDto() {}

    public RatingDto(Rating r) {
        this.id = r.getId();
        this.rating = r.getRating();
        this.userName = r.getUser().getName();
        this.storeName = r.getStore().getName();
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Integer getRating() {
        return rating;
    }

    public void setRating(Integer rating) {
        this.rating = rating;
    }

    public String getUserName() {
        return userName;
    }

    public void setUserName(String userName) {
        this.userName = userName;
    }

    public String getStoreName() {
        return storeName;
    }

    public void setStoreName(String storeName) {
        this.storeName = storeName;
    }
}
