package com.Smart.Erp.Modules.Academic.Repo;

import com.Smart.Erp.Config.CommonReference;
import com.Smart.Erp.Modules.Academic.Entity.Department;
import com.Smart.Erp.Modules.Teacher.Entity.Teacher;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DepartmentRepo extends JpaRepository<Department,Long> {
    Department findByDepartmentHead(Teacher teacher);
}
