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
  // Nested key-value (exact match)
  //
  validator: {properties: {name: {$type: 'string'}}},
  doc: {properties: {name: '123'}},
  expected: []
}, {
  // Nested key-value (exact match)
  //
  validator: {properties: {name: {$exists: true}}},
  doc: {properties: {foo: 123}},
  expected: [{
    'properties.name': {$exists: true}
  }]
}, {
  // Nested key-value (dot notation)
  //
  validator: {'properties.name': {$exists: true}},
  doc: {properties: {foo: 123}},
  expected: [{
    'properties.name': {$exists: true}
  }]
}, , {
  // Nested key-value (dot notation)
  //
  validator: {'properties.name': {$type: 'string'}},
  doc: {properties: {name: 'hi'}},
  expected: []
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
}, {
  // should work with documents with _id
  //
  validator: {value: {$type: 'number', $gt: 1, $lt: 4}},
  doc: {_id: 'foo', value: 6},
  expected: [{value: {$lt: 4}}],
}, {
  // should work with array
  //
  validator: {value: {$elemMatch: {$type: 'number'}}},
  doc: {value: [123]},
  expected: [],
}, {
  validator: {value: {$elemMatch: {$type: 'number'}}},
  doc: {value: ['123']},
  expected: [{value: {$elemMatch: {$type: 'number'}}}],
}, {
  validator: {
		"$or" : [
      {
        "value" : {
          "nested" : {
            "$type" : "string"
          },
        }
      },
			{
				"value" : {
					"$exists" : false
				}
			},
		]
  },
  doc: {
    value: { nested: 'foo'},
  },
  expected: [],
}]

function assertEqual(obj1, obj2, idx) {
  var str1 = JSON.stringify(obj1, null, '  ')
  var str2 = JSON.stringify(obj2, null, '  ')
  assert(str1 === str2, `\n=== #${idx} Failed ===\n${str1}\n-----------------\n${str2}\n=================\n`)
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
  assertEqual(result, expected, idx)
})

db.getCollection(TEST_COLLECTION).drop()
