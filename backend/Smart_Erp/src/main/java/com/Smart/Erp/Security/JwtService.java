package com.Smart.Erp.Security;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import java.util.Date;
import io.jsonwebtoken.Claims;
import java.security.Key;
import java.util.function.Function;

@Service
public class JwtService {

    // 🔥 Must be at least 32 characters for HS256
    private static final String SECRET =
            "mysecretkeymysecretkeymysecretkey123456";

    private static final long EXPIRATION_TIME = 86400000; // 24 hours

    private Key getSigningKey() {
        return Keys.hmacShaKeyFor(SECRET.getBytes());
    }

    // ==============================
    // Generate Token
    // ==============================
    public String generateToken(UserDetails userDetails) {

        String role = userDetails.getAuthorities()
                .stream()
                .findFirst()
                .map(GrantedAuthority::getAuthority)
                .orElse("ROLE_USER");

        return Jwts.builder()
                .setSubject(userDetails.getUsername())
                .claim("role", role)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + EXPIRATION_TIME))
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }
    // ==============================
    // Extract Username
    // ==============================
    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }
    // ==============================
    // Extract Expiration
    // ==============================
    public Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }
    // ==============================
    // Extract RoleRepo
    // ==============================
    public String extractRole(String token) {
        return extractAllClaims(token).get("role", String.class);
    }
    // ==============================
    // Generic Claim Extractor
    // ==============================
    public <T> T extractClaim(String token, Function<Claims, T> resolver) {
        final Claims claims = extractAllClaims(token);
        return resolver.apply(claims);
    }
    // ==============================
    // Parse All Claims
    // ==============================
    private Claims extractAllClaims(String token) {

        return Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    // ==============================
    // Check Expiration
    // ==============================
    private boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    // ==============================
    // Validate Token
    // ==============================
    public boolean isTokenValid(String token, UserDetails userDetails) {

        final String username = extractUsername(token);

        return (username.equals(userDetails.getUsername())
                && !isTokenExpired(token));
    }
}

