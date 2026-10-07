// ============================================================
// MongoDB Basic Assignment
// File: mongodb-basic-assignment.js
// ============================================================

// ============================================================
// Task 1: Local Setup and Data Creation
// ============================================================

// Step 1: Verify MongoDB
// Start MongoDB and connect using: mongosh
// Verify the connection:
show dbs

// Step 2: Select the Database
use company

// Step 3: Insert the Dataset
db.employees.insertMany([
  {
    _id: "EMP001",
    name: "John",
    department: "Engineering",
    experience: 4,
    skills: ["Java", "SpringBoot"],
    active: true,
    address: { city: "Pune", country: "India" }
  },
  {
    _id: "EMP002",
    name: "Alice",
    department: "HR",
    experience: 3,
    skills: ["Recruitment", "Communication"],
    active: true,
    address: { city: "Mumbai", country: "India" }
  },
  {
    _id: "EMP003",
    name: "David",
    department: "Engineering",
    experience: 6,
    skills: ["Java", "MongoDB"],
    active: true,
    address: { city: "Bengaluru", country: "India" }
  },
  {
    _id: "EMP004",
    name: "Emma",
    department: "Finance",
    experience: 2,
    skills: ["Accounting", "Excel"],
    active: false,
    address: { city: "Pune", country: "India" }
  },
  {
    _id: "EMP005",
    name: "Robert",
    department: "Engineering",
    experience: 5,
    skills: ["Java", "Docker"],
    active: true,
    address: { city: "Delhi", country: "India" }
  }
])

// Verify: The company database exists
show dbs

// Verify: The employees collection exists
show collections

// Verify: The collection contains 5 documents
db.employees.countDocuments()

// ============================================================
// Task 2: Read and Query Operations
// ============================================================

// 2.1 Engineering Employees
// Retrieve employees whose department is Engineering.
// Return only: _id, name, experience. Sort by name ascending.
db.employees.find(
  { department: "Engineering" },
  { name: 1, experience: 1, _id: 1 }
).sort({ name: 1 })

// 2.2 Employees with 5 or More Years of Experience
// Retrieve employees whose experience >= 5.
// Return only: name, experience (exclude _id). Sort by experience descending.
db.employees.find(
  { experience: { $gte: 5 } },
  { _id: 0, name: 1, experience: 1 }
).sort({ experience: -1 })

// 2.3 Nested Document Query
// Retrieve employees whose address city is Pune.
// Return only name and city. Sort by name ascending.
db.employees.find(
  { "address.city": "Pune" },
  { _id: 0, name: 1, "address.city": 1 }
).sort({ name: 1 })

// 2.4 Array Query
// Using $in, retrieve employees whose skills contain either MongoDB or SpringBoot.
// Sort by name ascending.
db.employees.find(
  { skills: { $in: ["MongoDB", "SpringBoot", "Spring Boot"] } }
).sort({ name: 1 })

// 2.5 Sorting and Limiting
// Retrieve the top 2 employees with the highest experience.
// Return: name, experience.
db.employees.find(
  {},
  { _id: 0, name: 1, experience: 1 }
).sort({ experience: -1 }).limit(2)

// ============================================================
// Task 3: Update Operations
// ============================================================

// 3.1 $inc: Increase Alice's experience by 1
db.employees.updateOne(
  { name: "Alice" },
  { $inc: { experience: 1 } }
)

// Verify Alice's experience (expected: 4)
db.employees.find({ name: "Alice" }, { name: 1, experience: 1 })

// 3.2 $set: Change Emma's active value from false to true
db.employees.updateOne(
  { name: "Emma" },
  { $set: { active: true } }
)

// Verify Emma's active status (expected: true)
db.employees.find({ name: "Emma" }, { name: 1, active: 1 })

// 3.3 $addToSet: Add "MongoDB" to Robert's skills array
// First execution (adds "MongoDB")
db.employees.updateOne(
  { name: "Robert" },
  { $addToSet: { skills: "MongoDB" } }
)

// Verify Robert's skills (expected: ["Java", "Docker", "MongoDB"])
db.employees.find({ name: "Robert" }, { name: 1, skills: 1 })

// Second execution: verify $addToSet prevents duplicates
db.employees.updateOne(
  { name: "Robert" },
  { $addToSet: { skills: "MongoDB" } }
)

// Verify skills array is unchanged (no duplicate "MongoDB")
db.employees.find({ name: "Robert" }, { name: 1, skills: 1 })

// ============================================================
// Task 4: Delete Operation
// ============================================================

// Step 1: Insert temporary document
db.employees.insertOne({
  _id: "EMP999",
  name: "Temporary Employee",
  department: "Training",
  experience: 0
})

// Step 2: Delete only this document using deleteOne()
db.employees.deleteOne({ _id: "EMP999" })

// Step 3: Verify the document is deleted (expected: null)
db.employees.findOne({ _id: "EMP999" })

// Step 4: Verify the original 5 documents remain in the collection
db.employees.countDocuments()

// ============================================================
// Task 5: Indexing
// ============================================================

// 5.1 Check Existing Indexes
// Identify the automatically created index (_id_)
db.employees.getIndexes()

// 5.2 Create an Index
// Create an ascending index on department
db.employees.createIndex({ department: 1 })

// 5.3 Verify the Index
// Collection should contain: _id_ and department_1
db.employees.getIndexes()

// ============================================================
// Task 6: Aggregation
// ============================================================

// 6.1 Employees per Department
// Count employees in each department, sorted by department name
db.employees.aggregate([
  {
    $group: {
      _id: "$department",
      count: { $sum: 1 }
    }
  },
  {
    $sort: { _id: 1 }
  }
])

// 6.2 Average Experience per Department
// Calculate average employee experience for each department, sorted by department name
db.employees.aggregate([
  {
    $group: {
      _id: "$department",
      avgExperience: { $avg: "$experience" }
    }
  },
  {
    $sort: { _id: 1 }
  }
])

// 6.3 Top Engineering Employees
// Select Engineering employees, return only name & experience (exclude _id),
// sort by experience descending, limit to top 2
db.employees.aggregate([
  {
    $match: { department: "Engineering" }
  },
  {
    $sort: { experience: -1 }
  },
  {
    $limit: 2
  },
  {
    $project: {
      _id: 0,
      name: 1,
      experience: 1
    }
  }
])




