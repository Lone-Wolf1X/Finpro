package com.fintech.finpro.controller;

import com.fintech.finpro.entity.Tenant;

import com.fintech.finpro.service.TenantService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
// Ensure only SUPERADMIN can access these endpoints
// @PreAuthorize("hasRole('SUPERADMIN')") // Uncomment when method security is
// enabled
public class TenantController {

    private final TenantService tenantService;

    @GetMapping("/tenants")
    public ResponseEntity<List<Tenant>> getAllTenants() {
        return ResponseEntity.ok(tenantService.getAllTenants());
    }

    @PostMapping("/tenants")
    public ResponseEntity<Tenant> createTenant(@RequestBody Map<String, String> request) {
        Tenant tenant = tenantService.createTenant(
                request.get("companyName"),
                request.get("subdomain"),
                request.get("adminEmail"),
                request.get("adminPassword"),
                request.get("plan"));
        return ResponseEntity.ok(tenant);
    }

    @PostMapping("/tenants/{tenantId}/features")
    public ResponseEntity<?> toggleFeature(
            @PathVariable Long tenantId,
            @RequestBody Map<String, Object> request) {

        Long featureId = Long.valueOf(request.get("featureId").toString());
        boolean isEnabled = Boolean.parseBoolean(request.get("isEnabled").toString());

        tenantService.updateFeatureStatus(tenantId, featureId, isEnabled);
        return ResponseEntity.ok(Map.of("message", "Feature updated successfully"));
    }
}
