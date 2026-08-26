package com.Smart.Erp.Repository;

import com.Smart.Erp.Entity.Sequence;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface SequenceRepo extends JpaRepository<Sequence,String> {

}
