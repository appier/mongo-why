# mongo-why
Tells you why mongo fails to validate your document.

## Use case

Load `why.js` into mongo shell, then use `why(<name of collection>, <the document you want to insert>)`

```
$ mongo --shell path/to/why.js
MongoDB shell version: 3.2.4
type "help" for help
> why('users', {name: 123})
-------------------------
Unmatched validator rules
-------------------------
[
  {
    "name": {
      "$type": "string"
    }
  },
  {
    "password": {
      "$exists": true
    }
  }
]
```

Under the hood, it applies *parts of* the specified collection's validator to a temporary collection, and tries inserting the document into that temporary collection. Then it prints out the parts of the validator that cannot validate the document.

You may also specify a validator directly:

```
$ mongo --shell path/to/why.js
MongoDB shell version: 3.2.4
type "help" for help
> validator = {name: {$type: 'string'}, password: {$exists: true}}
> why(validator, {name: 123})
-------------------------
Unmatched validator rules
-------------------------
[
  {
    "name": {
      "$type": "string"
    }
  },
  {
    "password": {
      "$exists": true
    }
  }
]
```

### Options

The third argument for `why()` is for options.
The options hash and their default value are as follows:

```
why('CollectionName', documentToTest, {
  // when true, it returns unmached validator rules as arrays instead of printing
  // them out, so that you can customize the error output
  //
  quiet: false,
})
```

## Unit test

```
$ mongo test.js
MongoDB shell version: 3.2.4
connecting to: test
# If there is no assertion errors, the test passes.
```
