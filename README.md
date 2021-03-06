mongoose-mock
=============

**Note that the landtech fork has deviated quite some way from the original.**

## Usage

Require as:

```JavaScript
var mongooseMock = require('@landtech/mongoose-mock');
```

From the point at which this is required, any code that calls `require('mongoose')` will return `mongooseMock`. This even works across npm-link boundaries.   Note that in order to ensure this happens before any tests, put this statement in a `mocha-startup.js` file and then create a `mocha.opts` file with the following content:

```
--require test/mocha-startup.js
```

If you are just running a test on one file this is not necessary, but if you are running tests recursively (or whatever), then you need the `require` to be called first.  

`mongooseMock` provides `stubs` with `sinon` for all(ish) of the methods you code might need to call.  You can provide custom return values for each of them, or leave them with the defaults (which are `null` in most cases).   

Lets look at a full example of usage in a testing file:   

```JavaScript
var mongooseMock = require('mongoose-mock'),
    proxyquire = require('proxyquire'),
    expect = require('chai').expect,
    sinon = require('sinon');

// see proxyquire docs for why you might want this rather than just require
var ThingToTest = proxyquire('../thing-to-test', {});

// the mock models were loaded as children of the above module, and are now available...
var SomeModel = mongooseMock.model('SomeModel'); 
var AnotherModel = mongooseMock.model('AnotherModel');

describe('ThingToTest', function () {
  var sandbox;
  beforeEach(() =>{
    sandbox = sinon.sandbox.create();
    SomeModel.useSandbox(sandbox);
    AnotherModel.useSandbox(sandbox);
  });

  it('does a thing', (done) => {
    SomeModel.findOne.yields(null, new SomeModel({whatever: 'trevor'}));
    ThingToTest.doAThing("please", result => {
      expect(SomeModel.findOne.callCount).to.eql(1);
      expect(SomeModel.update.getCall(0).args[1]).to.eql({madness: 'this-way'});
      expect(AnotherModel.find.callCount).to.eql(0);
    });
  });
});
```
Note how we set a new `sandbox` before each test - you can read about sandboxes in `sinon`'s documentation.  Note that in order to make it work here we had to do some slightly hacky stuff - but all you need to know is that you call `useSandbox`. 



Note that if the code being tested is of the following form, i.e. the mongoose stuff ends in a `then` call (i.e. it looks like a Promise):

```JavaScript
  SomeModel.find({}).populate({}).sort({}).then(res => {
    // do something with res
  })
```

Then, in your test, you need the last non-`then` method (in this case `sort`) to return a thenable...

```JavaScript
  var SomeModel = mongooseMock.model('SomeModel');
  SomeModel.sort.returns(Promise.resolve("some results"));
```


## Developing

If you run into problems using this module, it's likely that you are trying to use a feature that doesn't exist yet. Hopefully it will be easy to add!

I recommend using `npm link` during development.



