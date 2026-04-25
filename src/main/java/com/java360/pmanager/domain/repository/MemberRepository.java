package com.java360.pmanager.domain.repository;

import com.java360.pmanager.domain.entity.Member;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MemberRepository extends JpaRepository<Member, String> {

    Optional<Member> findByIdAndDeleted(String id, boolean deleted);
    Optional<Member> findByEmailAndDeleted(String email, boolean deleted);

    default List<Member> findAllNotDeleted(){
        return findAll()
                .stream().filter(m-> !m.getDeleted())
                .toList();
    }


}
