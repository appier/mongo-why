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

function why(validatorOrCollectionName, doc, options={}){

  var validator = validatorOrCollectionName;
  if(typeof validatorOrCollectionName === 'string') {
    var collectionInfos = db.getCollectionInfos().filter(({name}) => name === validatorOrCollectionName)

    if(!collectionInfos.length) {
      throw new Error(validatorOrCollectionName + ' does not exist.');
    }

    validator = collectionInfos[0].options.validator;
  }

  if(!validator || !Object.keys(validator).length) {
    throw new Error('The given validator / collection contains no validation rules.');
  }

  var errors = traverseValidator(validator, doc)

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
