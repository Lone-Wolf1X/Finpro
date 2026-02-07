package com.fintech.finpro.tenant;

import com.fintech.finpro.repository.TenantRepository;
import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.io.IOException;

/**
 * Filter to extract and set tenant context from request
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class TenantFilter implements Filter {

    private final TenantRepository tenantRepository;

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {

        HttpServletRequest httpRequest = (HttpServletRequest) request;

        try {
            // Extract tenant from X-Tenant-Key header
            String tenantKey = httpRequest.getHeader("X-Tenant-Key");

            if (tenantKey != null && !tenantKey.isEmpty()) {
                // In production, you would look up tenant ID from database using tenantKey
                // For now, we'll use a simple mapping
                Long tenantId = getTenantIdFromKey(tenantKey);
                TenantContext.setTenantId(tenantId);
                log.debug("Tenant context set: {}", tenantId);
            } else {
                // Extract from subdomain if header not present
                String serverName = httpRequest.getServerName();
                String subdomain = extractSubdomain(serverName);

                if (subdomain != null) {
                    Long tenantId = getTenantIdFromSubdomain(subdomain);
                    TenantContext.setTenantId(tenantId);
                    log.debug("Tenant context set from subdomain: {}", tenantId);
                }
            }

            chain.doFilter(request, response);
        } finally {
            TenantContext.clear();
        }
    }

    private Long getTenantIdFromKey(String tenantKey) {
        return tenantRepository.findByTenantKey(tenantKey)
                .map(com.fintech.finpro.entity.Tenant::getId)
                .orElse(1L); // Fallback to default for now
    }

    private Long getTenantIdFromSubdomain(String subdomain) {
        return tenantRepository.findBySubdomain(subdomain)
                .map(com.fintech.finpro.entity.Tenant::getId)
                .orElse(1L); // Fallback to default for now
    }

    private String extractSubdomain(String serverName) {
        // Extract subdomain from server name
        // Example: bsucorp.fintech.com -> bsucorp
        if (serverName != null && serverName.contains(".")) {
            String[] parts = serverName.split("\\.");
            if (parts.length > 2) {
                return parts[0];
            }
        }
        return null;
    }
}
