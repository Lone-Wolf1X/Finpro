package com.fintech.finpro.repository;

import com.fintech.finpro.entity.UserLimitRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserLimitRequestRepository extends JpaRepository<UserLimitRequest, Long> {

    List<UserLimitRequest> findByRequesterIdOrderByCreatedAtDesc(Long requesterId);

    List<UserLimitRequest> findByStatusOrderByCreatedAtDesc(String status);
}
