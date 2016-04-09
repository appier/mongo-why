const COLLECTION = '__WHY_COLLECTION__'

function isMatched(validator, doc) {
  db.runCommand({collMod: COLLECTION, validator})
  result = db.getCollection(COLLECTION).insert(doc)

  return result.nInserted === 1
}

function traverseValidator(topValidator, newDoc){
  var queue = [{validator: topValidator, keyPath: []}]
  var hasError = false

  while(queue.length) {
    var {validator, keyPath, isLeaf} = queue.shift()
    var wrappedValidator = validator

    if(keyPath.length) {
      wrappedValidator = {}
      wrappedValidator[keyPath.join('.')] = validator
    }

    // Skip if the validator works
    //
    if(isMatched(wrappedValidator, newDoc)) continue;

    // Print error and skip if validator cannot be expanded anymore
    //
    if(isLeaf || typeof validator !== 'object') {
      print('Not matching:')
      print(JSON.stringify(wrappedValidator, null, '  '))
      hasError = true
      continue;
    }

    // Traverse further down the validator
    //
    Object.keys(validator).forEach(key => {
      if(key === '$and' || key === '$or') {
        // validator[key] is an array of sub-validators
        validator[key].forEach(v => {
          queue.push({validator: v, keyPath})
        })
      }else if(!key.startsWith('$')){ // key is a nested column name
        queue.push({
          validator: validator[key],
          keyPath: keyPath.concat(key)
        })
      }else{ // {[key]: validator[key]} is something like {$type: 'bbb'}
        var subValidator = {}
        subValidator[key] = validator[key]
        queue.push({
          validator: subValidator,
          keyPath: keyPath,
          isLeaf: true,
        })
      }
    })
  }

  if(!hasError) {
    print('No validation error is encountered.')
  }
}

function why(collectionName, doc){

  var collectionInfos = db.getCollectionInfos().filter(({name}) => name === collectionName)

  if(!collectionInfos.length) {
    print(collectionName, 'does not exist.')
    return
  }

  if(!collectionInfos[0].options.validator) {
    print(collectionName, 'does not hava validator.')
    return
  }

  db.createCollection(COLLECTION)
  traverseValidator(collectionInfos[0].options.validator, doc)
  db.getCollection(COLLECTION).drop()
}
