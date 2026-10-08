// =============================================================================
// MongoDB Advanced Assignment
// =============================================================================

// =============================================================================
// Task 1: Schema Validation and Data Creation
// =============================================================================

// -----------------------------------------------------------------------------
// Step 1: Select a Fresh Database
// Use a fresh database named company_advanced. Do not reuse data from earlier exercises.
// -----------------------------------------------------------------------------
use company_advanced;

// Optional: clean up existing collection if resetting for practice
// db.employees.drop();

// -----------------------------------------------------------------------------
// Step 2: Create the Validated Collection
// Create an employees collection with $jsonSchema validation.
// The collection must require:
//   - name: string
//   - departmentId: integer
//   - experience: integer
//   - active: Boolean
// -----------------------------------------------------------------------------
db.createCollection("employees", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["name", "departmentId", "experience", "active"],
      properties: {
        name: {
          bsonType: "string",
          description: "must be a string and is required"
        },
        departmentId: {
          bsonType: "int",
          description: "must be an integer and is required"
        },
        experience: {
          bsonType: "int",
          description: "must be an integer and is required"
        },
        active: {
          bsonType: "bool",
          description: "must be a boolean and is required"
        }
      }
    }
  },
  validationLevel: "strict",
  validationAction: "error"
});

// -----------------------------------------------------------------------------
// Step 3: Insert the Starting Dataset
// Insert the three valid employee documents.
// -----------------------------------------------------------------------------
db.employees.insertMany([
  {
    _id: 1,
    name: "John",
    departmentId: 10,
    skills: ["Java", "MongoDB"],
    experience: 4,
    active: true,
    certifications: [
      { name: "MongoDB", status: "Expired", expiryYear: 2026 }
    ]
  },
  {
    _id: 2,
    name: "Alice",
    departmentId: 10,
    skills: ["Python", "MongoDB"],
    experience: 6,
    active: true,
    certifications: [
      { name: "MongoDB", status: "Active", expiryYear: 2028 }
    ]
  },
  {
    _id: 3,
    name: "David",
    departmentId: 20,
    skills: ["Communication"],
    experience: 3,
    active: false,
    certifications: [
      { name: "Communication", status: "Active", expiryYear: 2027 }
    ]
  }
]);

// -----------------------------------------------------------------------------
// Step 4: Test the Validation Rule
// Attempt to insert the invalid document below.
// It must be rejected because the field types do not match the validator.
// -----------------------------------------------------------------------------
try {
  db.employees.insertOne({
    _id: 99,
    name: 123,
    departmentId: "HR",
    experience: "one",
    active: "yes"
  });
} catch (err) {
  print("Invalid document was rejected as expected by schema validation:");
  print(err.message);
}

// -----------------------------------------------------------------------------
// Verification Commands:
// Verify that:
//   - Valid employee documents count: 3
//   - Invalid document was rejected by schema validation
// -----------------------------------------------------------------------------
print("Total valid employee documents (expected 3):", db.employees.countDocuments());
db.employees.find().pretty();

// =============================================================================
// Task 2: Advanced Array Queries and Updates
// =============================================================================

// -----------------------------------------------------------------------------
// 2.1 Find One Matching Array Object
// Use $elemMatch to find employees whose certifications contain the same object
// with name: "MongoDB" and status: "Active".
// -----------------------------------------------------------------------------
db.employees.find({
  certifications: {
    $elemMatch: {
      name: "MongoDB",
      status: "Active"
    }
  }
}).pretty();

// -----------------------------------------------------------------------------
// 2.2 Update One Matching Array Element
// Use the positional $ operator to change John's MongoDB certification status
// from Expired to Active.
// -----------------------------------------------------------------------------
db.employees.updateOne(
  {
    name: "John",
    "certifications.name": "MongoDB"
  },
  {
    $set: {
      "certifications.$.status": "Active"
    }
  }
);

// -----------------------------------------------------------------------------
// 2.3 Update Selected Array Elements
// Use arrayFilters to change the status to "Renewal Due" for certification
// elements whose expiryYear is less than 2027.
// -----------------------------------------------------------------------------
db.employees.updateMany(
  {},
  {
    $set: {
      "certifications.$[cert].status": "Renewal Due"
    }
  },
  {
    arrayFilters: [
      { "cert.expiryYear": { $lt: 2027 } }
    ]
  }
);

// -----------------------------------------------------------------------------
// Verification Commands for Task 2:
// Verify final required certification values:
//   Alice → MongoDB, Active
//   John  → MongoDB, Renewal Due
// -----------------------------------------------------------------------------
db.employees.find(
  { name: { $in: ["Alice", "John"] } },
  { name: 1, certifications: 1, _id: 0 }
).pretty();

// =============================================================================
// Task 3: Bulk Write Operations
// =============================================================================

// -----------------------------------------------------------------------------
// Complete all three operations in one bulkWrite() call:
//   1. Increase John's experience by 1.
//   2. Set Alice's active value to false.
//   3. Insert Emma.
// -----------------------------------------------------------------------------
db.employees.bulkWrite([
  {
    updateOne: {
      filter: { name: "John" },
      update: { $inc: { experience: 1 } }
    }
  },
  {
    updateOne: {
      filter: { name: "Alice" },
      update: { $set: { active: false } }
    }
  },
  {
    insertOne: {
      document: {
        _id: 4,
        name: "Emma",
        departmentId: 20,
        skills: ["Excel"],
        experience: 2,
        active: true,
        certifications: [
          { name: "Excel", status: "Active", expiryYear: 2026 }
        ]
      }
    }
  }
]);

// -----------------------------------------------------------------------------
// Verification Commands for Task 3:
// Verify final state:
//   - John.experience = 5
//   - Alice.active = false
//   - Employee document count = 4
// -----------------------------------------------------------------------------
print("Total employee documents (expected 4):", db.employees.countDocuments());
db.employees.find(
  { name: { $in: ["John", "Alice", "Emma"] } },
  { name: 1, experience: 1, active: 1 }
).pretty();

// =============================================================================
// Task 4: Advanced Aggregation
// =============================================================================

// -----------------------------------------------------------------------------
// Step 1: Create the Departments Collection
// Insert the starting departments documents.
// -----------------------------------------------------------------------------
// Optional: db.departments.drop();
db.departments.insertMany([
  { _id: 10, name: "Engineering" },
  { _id: 20, name: "HR" }
]);

// -----------------------------------------------------------------------------
// 4.1 Join Employees with Departments
// Pipeline using $lookup and $unwind:
//   - Join employees.departmentId with departments._id
//   - Return employee name and departmentName only
//   - Sort by employee name in ascending order
// -----------------------------------------------------------------------------
db.employees.aggregate([
  {
    $lookup: {
      from: "departments",
      localField: "departmentId",
      foreignField: "_id",
      as: "department"
    }
  },
  {
    $unwind: "$department"
  },
  {
    $project: {
      _id: 0,
      name: 1,
      departmentName: "$department.name"
    }
  },
  {
    $sort: { name: 1 }
  }
]);

// -----------------------------------------------------------------------------
// 4.2 Count Employees for Each Skill
//   - $unwind on skills
//   - Group by skill and count employees
//   - Sort by count descending; for equal counts, sort skill name ascending
// -----------------------------------------------------------------------------
db.employees.aggregate([
  {
    $unwind: "$skills"
  },
  {
    $group: {
      _id: "$skills",
      count: { $sum: 1 }
    }
  },
  {
    $project: {
      _id: 0,
      skill: "$_id",
      count: 1
    }
  },
  {
    $sort: {
      count: -1,
      skill: 1
    }
  }
]);

// -----------------------------------------------------------------------------
// 4.3 Return Active Employees and a Count
// Use $facet to return both active employee names and the total active count.
// Sort names ascending.
// -----------------------------------------------------------------------------
db.employees.aggregate([
  {
    $match: { active: true }
  },
  {
    $facet: {
      activeEmployees: [
        { $sort: { name: 1 } },
        { $project: { _id: 0, name: 1 } }
      ],
      totalActiveCount: [
        { $count: "count" }
      ]
    }
  }
]);

// =============================================================================
// Task 5: Indexing and Performance Analysis
// =============================================================================

// -----------------------------------------------------------------------------
// 5.1 Create and Verify a Compound Index
// Create an ascending compound index on departmentId followed by name.
// Verify it using getIndexes().
// Required index name: departmentId_1_name_1
// -----------------------------------------------------------------------------
db.employees.createIndex(
  { departmentId: 1, name: 1 },
  { name: "departmentId_1_name_1" }
);

// Verify index creation:
db.employees.getIndexes();

// -----------------------------------------------------------------------------
// 5.2 Read explain("executionStats")
// Run explain("executionStats") for this query:
//   - Filter: { departmentId: 10 }
//   - Sort: { name: 1 }
// -----------------------------------------------------------------------------
db.employees
  .find({ departmentId: 10 })
  .sort({ name: 1 })
  .explain("executionStats");

// -----------------------------------------------------------------------------
// 5.3 Create a TTL Index
// Create a sessions collection, insert the document below, and create a TTL
// index on expiresAt with expireAfterSeconds: 0.
// Required TTL index name: expiresAt_1
// Note: TTL cleanup runs in the background and may not happen immediately.
// -----------------------------------------------------------------------------
// Optional: db.sessions.drop();

db.sessions.insertOne({
  _id: 1,
  userName: "John",
  expiresAt: new Date(Date.now() + 600000)
});

db.sessions.createIndex(
  { expiresAt: 1 },
  { expireAfterSeconds: 0, name: "expiresAt_1" }
);

// Verify the TTL index creation:
db.sessions.getIndexes();




