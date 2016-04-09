load('why.js')

const SPEC = [{
  // empty validator
  //
  validator: {},
  doc: {ha: 1},
  expected: null // Triggers "don't have a validator" logic
}, {
  // Simple key-value
  //
  validator: {name: {$exists: true}},
  doc: {ha: 1},
  expected: [{name: {$exists: true}}],
}, {
  // Simple key-value
  //
  validator: {name: {$exists: true}},
  doc: {name: 123},
  expected: []
}, {
  // Nested key-value
  //
  validator: {properties: {name: {$exists: true}}},
  doc: {properties: {foo: 123}},
  expected: [{
    'properties.name': {$exists: true}
  }]
}, {
  // Multiple $ rules
  //
  validator: {value: {$type: 'number', $lt: 3}},
  doc: {value: 4},
  expected: [{
    value: {$lt: 3}
  }]
}, {
  // outmost $and
  //
  validator: {$and: [{value: {$type: 'number'}}, {value: {$lt: 3}}]},
  doc: {value: 4},
  expected: [{
    value: {$lt: 3}
  }]
}, {
  // outmost $or
  //
  validator: {$or: [{value: {$type: 'number'}}, {value: {$lt: 3}}]},
  doc: {value: 'not number'},
  expected: [{
    value: {$type: 'number'}
  }, {
    value: {$lt: 3}
  }]
}]

function assertEqual(obj1, obj2) {
  var str1 = JSON.stringify(obj1, null, '  ')
  var str2 = JSON.stringify(obj2, null, '  ')
  assert(str1 === str2, `\n=== Not Equal ===\n${str1}\n-----------------\n${str2}\n=================\n`)
}

// Setup test collection
const TEST_COLLECTION = '__TEST_COLLECTION__'

db.createCollection(TEST_COLLECTION)

SPEC.forEach(({validator, doc, expected}, idx) => {
  var setValidatorResult = db.runCommand({collMod: TEST_COLLECTION, validator})
  if(!setValidatorResult.ok) {
    print(`Error on testcase #${idx}:`, setValidatorResult.errmsg)
    return
  }

  var result = why(TEST_COLLECTION, doc, {quiet: true})
  assertEqual(result, expected)
})

db.getCollection(TEST_COLLECTION).drop()
