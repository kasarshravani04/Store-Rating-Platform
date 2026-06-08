package com.platform.storereview.dto;

import com.platform.storereview.model.Store;

public class StoreDto {
    private Long id;
    private String name;
    private String email;
    private String address;
    private Double rating;
    private Integer userSubmittedRating;

    public StoreDto() {}

    public StoreDto(Store store, Double rating, Integer userSubmittedRating) {
        this.id = store.getId();
        this.name = store.getName();
        this.email = store.getEmail();
        this.address = store.getAddress();
        this.rating = rating != null ? rating : 0.0;
        this.userSubmittedRating = userSubmittedRating;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public Double getRating() {
        return rating;
    }

    public void setRating(Double rating) {
        this.rating = rating;
    }

    public Integer getUserSubmittedRating() {
        return userSubmittedRating;
    }

    public void setUserSubmittedRating(Integer userSubmittedRating) {
        this.userSubmittedRating = userSubmittedRating;
    }
}
