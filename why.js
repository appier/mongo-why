const COLLECTION = '__WHY_COLLECTION__'

function isMatched(validator, doc) {

  // Re-create collection everytime so that documents with _id don't conflict
  //
  db.createCollection(COLLECTION, {validator})
  result = db.getCollection(COLLECTION).insert(doc)
  db.getCollection(COLLECTION).drop()

  return result.nInserted === 1
}

function traverseValidator(topValidator, newDoc){
  var queue = [{validator: topValidator, keyPath: []}]
  var errors = []

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
      errors.push(wrappedValidator)
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

  return errors
}

function why(collectionName, doc, options={}){

  var collectionInfos = db.getCollectionInfos().filter(({name}) => name === collectionName)

  if(!collectionInfos.length) {
    throw new Error(collectionName + ' does not exist.');
  }

  if(!collectionInfos[0].options.validator) {
    throw new Error(collectionName + ' does not have a validator.');
  }

  var errors = traverseValidator(collectionInfos[0].options.validator, doc)

  if(!options.quiet) {
    if(errors.length) {
      print('-------------------------')
      print('Unmatched validator rules')
      print('-------------------------')
      print(JSON.stringify(errors, null, '  '))
    }else{
      print('The given document passes validation.')
    }
  }else{
    return errors
  }
}
