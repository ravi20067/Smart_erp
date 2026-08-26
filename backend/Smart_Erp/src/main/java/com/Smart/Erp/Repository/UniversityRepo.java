package com.Smart.Erp.Repository;

import com.Smart.Erp.Entity.University;
import com.Smart.Erp.Entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UniversityRepo extends JpaRepository<University,Long> {
}
