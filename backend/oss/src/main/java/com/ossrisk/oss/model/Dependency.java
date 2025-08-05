package com.ossrisk.oss.model;

import jakarta.persistence.*;
import lombok.*;

import java.util.Objects;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Dependency {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;
    private String version;
    private boolean outdated;
    private boolean vulnerable;
    private String ecosystem;

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Dependency)) return false;
        Dependency that = (Dependency) o;
        return Objects.equals(name, that.name) &&
                Objects.equals(version, that.version) &&
                Objects.equals(ecosystem, that.ecosystem);
    }

    @Override
    public int hashCode() {
        return Objects.hash(name, version, ecosystem);
    }


}
