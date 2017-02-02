mongoose-mock
=============

# Note that the landdb fork has deviated quite some way from the original.

## Usage

At the top of your test file do:

```JavaScript
mongooseMock = require('@landtech/mongoose-mock');
```

From this point on, `require('mongoose')` will return `mongooseMock`, that is within *all* sub modules (and even across npm-link boundaries).   

`mongooseMock` provides `stubs` with `sinon` for all(ish) of the methods you code might need to call.  You can provide custom return values for each of them, or leave them with the defaults (which are `null` in most cases).   

Lets look a full example of usage in a testing file:   

```JavaScript
var mongooseMock = require('mongoose-mock'),
    proxyquire = require('proxyquire'),
    expect = require('chai').expect,
    sinon = require('sinon');

var ThingToTest = proxyquire('../thing-to-test', {
  /* see proxyquire docs for info on over-riding other modules here */
});

var SomeModel = mongooseMock.model('SomeModel');
var AnotherModel = mongooseMock.model('AnotherModel');

describe('ThingToTest', function () {
  var sandbox;

  beforeEach(() =>{
    sandbox = sinon.sandbox.create();
    SomeModel.useSandbox(sandbox);
    AnotherModel.useSandbox(sandbox);
  });

  describe('doAThing', function () {

    it('really does a thing', (done) => {
      SomeModel.findOne.yields(null, new SomeModel({whatever: 'trevor'}));
      ThingToTest.doAThing("please", result => {
        expect(SomeModel.findOne.callCount).to.eql(1);
        expect(SomeModel.update.getCall(0).args[1]).to.eql({madness: 'this-way'});
        expect(AnotherModel.find.callCount).to.eql(0);
      });
    });

  });
});
```

Note how we set a new `sandbox` before each test - you can read about sandboxes in `sinon`'s documentation.  Note that in order to make it work here we had to do some slightly hacky stuff - but all you need to know is that you call `useSandbox`.

## Developing

If you run into problems using this module, it's likely that your trying to use a feature that doesn't exist yet. Hopefully it will be easy to add the feature.

I reconmmend using `npm link` during development.



