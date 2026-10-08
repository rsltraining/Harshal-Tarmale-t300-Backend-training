# MongoDB Advanced Concepts - Quiz Answers

### Q1. Why is schema validation useful?
- B. It rejects documents that do not follow required fields or data types.

### Q2. What does `$elemMatch` help verify?
- B. Multiple conditions match the same array object.


### Q3. What is the purpose of `arrayFilters`?
- C. To update selected array elements that match a condition.


### Q4. When is `bulkWrite()` useful?
- A. When several write operations should be sent together.


### Q5. Which stage joins documents from another collection?
- C. $lookup


### Q6. What does `IXSCAN` usually indicate in `explain()` output?
- B. MongoDB used an index.


### Q7. What happens when `abortTransaction()` is called?
- C. Uncommitted transaction changes are rolled back.


### Q8. What does write concern `w: "majority"` mean?
- B. A majority of voting data-bearing replica-set members acknowledge the write.


### Q9. What normally happens when a replica-set Primary fails?
- C. Eligible members hold an election for a new Primary.


### Q10. Which is the best direction for choosing a shard key?
- B. A high-cardinality field that distributes traffic and matches common queries.


### Q11. What do Change Streams allow an application to do?
- A. Listen for inserts, updates, replacements, and deletes.


### Q12. Which is a good production-security practice?
- C. Use TLS, restricted network access, and least-privilege credentials.

---

## Task 5: Indexing and Performance Analysis (explain stats)

- **Winning plan stage:** IXSCAN
- **nReturned:** 2
- **totalDocsExamined:** 2
- **totalKeysExamined:** 2

