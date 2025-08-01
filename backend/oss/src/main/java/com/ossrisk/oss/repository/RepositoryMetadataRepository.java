package com.ossrisk.oss.repository;

import com.ossrisk.oss.model.RepositoryMetadata;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RepositoryMetadataRepository extends JpaRepository<RepositoryMetadata,Long> {
    List<RepositoryMetadata> findByOwner(String owner);


}
