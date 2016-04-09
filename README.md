# mongo-why
Tells you why mongo fails to validate your document.

## Use case

```
$ mongo
> load('why.js')
true
> why('collectionName', {...The object that failed to insert...})
-------------------------
Unmatched validator rules
-------------------------
[
  ...
]
```


## Unit test

```
$ mongo test.js
MongoDB shell version: 3.2.4
connecting to: test
# If there is no assertion errors, the test passes.
```
