package com.lab.config;

import com.lab.dao.UserDAO;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

import java.util.Optional;

/**
 * Spring Security Configuration with Role-Based Access Control:
 * - ADMIN: Full access, including creating/updating machines, priorities, and test types.
 * - STAFF: Daily operations (registering samples, viewing queue/machines, completing/holding samples).
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .authorizeHttpRequests(auth -> auth

                .requestMatchers("/", "/index.html", "/*.html", "/*.css", "/*.js", "/css/**", "/js/**", "/favicon.ico", "/static/**").permitAll()

                .requestMatchers("/api/auth/**").permitAll()

                .requestMatchers(HttpMethod.POST, "/api/machines").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/machines/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/machines/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.POST, "/api/priorities/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/priorities/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/priorities/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.POST, "/api/test-types/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/test-types/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/test-types/**").hasRole("ADMIN")
                .requestMatchers("/api/users/**").hasRole("ADMIN")

                .requestMatchers(HttpMethod.GET, "/api/priorities/**").hasAnyRole("ADMIN", "STAFF")
                .requestMatchers(HttpMethod.GET, "/api/test-types/**").hasAnyRole("ADMIN", "STAFF")
                .requestMatchers("/api/**").hasAnyRole("ADMIN", "STAFF")

                .anyRequest().authenticated()
            )
            .httpBasic(Customizer.withDefaults());

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public UserDetailsService userDetailsService(UserDAO userDAO, PasswordEncoder encoder) {

        try {
            userDAO.ensureDefaultAccounts(encoder);
        } catch (Exception e) {
            System.err.println("[SECURITY] Could not verify default accounts on startup: " + e.getMessage());
        }

        return username -> {

            try {
                Optional<com.lab.model.User> dbUser = userDAO.findByUsername(username);
                if (dbUser.isPresent()) {
                    com.lab.model.User u = dbUser.get();
                    String role = (u.getRole() != null) ? u.getRole().replace("ROLE_", "") : "STAFF";
                    if ("ADMIN".equalsIgnoreCase(role)) {
                        return User.builder()
                                .username(u.getUsername())
                                .password(u.getPasswordHash())
                                .roles("ADMIN", "STAFF")
                                .build();
                    } else {
                        return User.builder()
                                .username(u.getUsername())
                                .password(u.getPasswordHash())
                                .roles("STAFF")
                                .build();
                    }
                }
            } catch (Exception e) {
                System.err.println("Notice: Could not load user from DB, falling back to in-memory: " + e.getMessage());
            }

            if ("admin".equalsIgnoreCase(username)) {
                return User.builder()
                        .username("admin")
                        .password(encoder.encode("admin123"))
                        .roles("ADMIN", "STAFF")
                        .build();
            } else if ("staff".equalsIgnoreCase(username) || "staff1".equalsIgnoreCase(username)) {
                return User.builder()
                        .username(username)
                        .password(encoder.encode("staff123"))
                        .roles("STAFF")
                        .build();
            }

            throw new UsernameNotFoundException("User not found: " + username);
        };
    }
}
