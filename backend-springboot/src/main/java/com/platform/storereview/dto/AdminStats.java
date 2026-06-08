package com.platform.storereview.dto;

public class AdminStats {
    private long totalUsers;
    private long totalStores;
    private long totalRatings;

    public AdminStats() {}

    public AdminStats(long totalUsers, long totalStores, long totalRatings) {
        this.totalUsers = totalUsers;
        this.totalStores = totalStores;
        this.totalRatings = totalRatings;
    }

    // Getters and Setters
    public long getTotalUsers() {
        return totalUsers;
    }

    public void setTotalUsers(long totalUsers) {
        this.totalUsers = totalUsers;
    }

    public long getTotalStores() {
        return totalStores;
    }

    public void setTotalStores(long totalStores) {
        this.totalStores = totalStores;
    }

    public long getTotalRatings() {
        return totalRatings;
    }

    public void setTotalRatings(long totalRatings) {
        this.totalRatings = totalRatings;
    }
}
