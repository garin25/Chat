package com.example.demo.config;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;
import java.util.function.Function;

@Component
public class JwtUtil {

    // 🚨 Usa una clave generada y segura de 256 bits (la que resolvió el error de advertencia)
    private static final String SECRET_BASE64 = "TuClaveSecretaMuyLargaYSeguraDeMasDe32CaracteresBase64";
    private static final long EXPIRATION_TIME = 1000 * 60 * 60 * 10; // 10 horas
    private final Key signingKey;

    public JwtUtil() {
        // Decodificar la clave Base64 en una Key segura
        byte[] keyBytes = Decoders.BASE64.decode(SECRET_BASE64);
        this.signingKey = Keys.hmacShaKeyFor(keyBytes);
    }

    // -------------------------------------------------------------------
    // METODO 1: Extraer el nombre de usuario (email) del token
    // -------------------------------------------------------------------
    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    // Método de ayuda genérico para extraer cualquier claim
    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    // Obtiene todos los claims (cuerpo) del token
    private Claims extractAllClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(signingKey) // Usa la clave secreta para verificar la firma
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    // -------------------------------------------------------------------
    // METODO 2: Validar el token
    // -------------------------------------------------------------------
    public Boolean validateToken(String token, UserDetails userDetails) {
        final String username = extractUsername(token);
        // 1. El username del token debe coincidir con el del UserDetails
        // 2. El token no debe estar expirado
        return (username.equals(userDetails.getUsername()) && !isTokenExpired(token));
    }

    private Boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    private Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    // -------------------------------------------------------------------
    // Método para generar el token (lo que ya tenías)
    // -------------------------------------------------------------------
    public String generateToken(String username) {
        return Jwts.builder()
                .setSubject(username)
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + EXPIRATION_TIME))
                .signWith(signingKey, SignatureAlgorithm.HS256)
                .compact();
    }
}