package com.Smart.Erp.Repository;

import com.Smart.Erp.Entity.Department;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DepartmentRepo extends JpaRepository<Department,Long> {
}
