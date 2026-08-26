package com.Smart.Erp.Repository;

import com.Smart.Erp.Entity.School;
import com.Smart.Erp.Entity.Section;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SchoolRepo extends JpaRepository<School,Long> {

}
