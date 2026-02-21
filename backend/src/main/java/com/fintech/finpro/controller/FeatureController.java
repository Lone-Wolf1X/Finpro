package com.fintech.finpro.controller;

import com.fintech.finpro.entity.Feature;
import com.fintech.finpro.repository.FeatureRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin/features")
@RequiredArgsConstructor
public class FeatureController {

    private final FeatureRepository featureRepository;

    @GetMapping
    public ResponseEntity<List<Feature>> getAllFeatures() {
        return ResponseEntity.ok(featureRepository.findAll());
    }
}
