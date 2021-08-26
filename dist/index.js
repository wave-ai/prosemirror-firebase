'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var ref = require('prosemirror-state');
var Selection = ref.Selection;
var ref$1 = require('prosemirror-model');
var Node = ref$1.Node;
var ref$2 = require('prosemirror-transform');
var Step = ref$2.Step;
var ref$3 = require('prosemirror-collab');
var collab = ref$3.collab;
var sendableSteps = ref$3.sendableSteps;
var receiveTransaction = ref$3.receiveTransaction;
var ref$4 = require('prosemirror-compress');
var compressStepsLossy = ref$4.compressStepsLossy;
var compressStateJSON = ref$4.compressStateJSON;
var uncompressStateJSON = ref$4.uncompressStateJSON;
var compressSelectionJSON = ref$4.compressSelectionJSON;
var uncompressSelectionJSON = ref$4.uncompressSelectionJSON;
var compressStepJSON = ref$4.compressStepJSON;
var uncompressStepJSON = ref$4.uncompressStepJSON;
var TIMESTAMP = { '.sv': 'timestamp' };

var FirebaseEditor = function FirebaseEditor(ref) {
  var firebaseRef = ref.firebaseRef;
  var stateConfig = ref.stateConfig;
  var constructView = ref.view;
  var selfClientID = ref.clientID; if ( selfClientID === void 0 ) selfClientID = firebaseRef.push().key;
  var progress = ref.progress; if ( progress === void 0 ) progress = function (_){ return _; };

  progress(0 / 2);
  var this_ = this;
  var checkpointRef = this.checkpointRef = firebaseRef.child('checkpoint');
  var changesRef = this.changesRef = firebaseRef.child('changes');
  var selectionsRef = this.selectionsRef = firebaseRef.child('selections');
  var selfSelectionRef = this.selfSelectionRef = selectionsRef.child(selfClientID);
  selfSelectionRef.onDisconnect().remove();
  var selections = this.selections = {};
  var selfChanges = {};
  var selection = undefined;

  var constructEditor = checkpointRef.once('value').then(
    function (snapshot) {
      progress(1 / 2);
      var ref = snapshot.val() || {};
      var d = ref.d;
      var latestKey = ref.k; if ( latestKey === void 0 ) latestKey = -1;
      latestKey = Number(latestKey);
      stateConfig.doc = d && Node.fromJSON(stateConfig.schema, uncompressStateJSON({ d: d }).doc);
      stateConfig.plugins = (stateConfig.plugins || []).concat(collab({ clientID: selfClientID }));

      function compressedStepJSONToStep(compressedStepJSON) {
        return Step.fromJSON(stateConfig.schema, uncompressStepJSON(compressedStepJSON)) }

      function updateCollab(ref, newState) {
        var docChanged = ref.docChanged;
        var mapping = ref.mapping;

        if (docChanged) {
          for (var clientID in selections) {
            selections[clientID] = selections[clientID].map(newState.doc, mapping);
          }
        }

        var sendable = sendableSteps(newState);
        if (sendable) {
          var steps = sendable.steps;
          var clientID$1 = sendable.clientID;
          changesRef.child(latestKey + 1).transaction(
            function (existingBatchedSteps) {
              if (!existingBatchedSteps) {
                selfChanges[latestKey + 1] = steps;
                return {
                  s: compressStepsLossy(steps).map(
                    function (step) {
                      return compressStepJSON(step.toJSON()) } ),
                  c: clientID$1,
                  t: TIMESTAMP,
                }
              }
            },
            function (error, committed, ref) {
              var key = ref.key;

              if (error) {
                console.error('updateCollab', error, sendable, key);
              } else if (committed && key % 100 === 0 && key > 0) {
                var ref$1 = compressStateJSON(newState.toJSON());
                var d = ref$1.d;
                checkpointRef.set({ d: d, k: key, t: TIMESTAMP });
              }
            },
            false );
        }

        var selectionChanged = !newState.selection.eq(selection);
        if (selectionChanged) {
          selection = newState.selection;
          selfSelectionRef.set(compressSelectionJSON(selection.toJSON()));
        }
      }

      return changesRef.startAt(null, String(latestKey + 1)).once('value').then(
        function (snapshot) {
          progress(2 / 2);
          var view = this_.view = constructView({ stateConfig: stateConfig, updateCollab: updateCollab, selections: selections });
          var editor = view.editor || view;

          var changes = snapshot.val();
          if (changes) {
            var steps = [];
            var stepClientIDs = [];
            var placeholderClientId = '_oldClient' + Math.random();
            var keys = Object.keys(changes);
            latestKey = Math.max.apply(Math, keys);
            for (var i = 0, list = keys; i < list.length; i += 1) {
              var key = list[i];

              var compressedStepsJSON = changes[key].s;
              steps.push.apply(steps, compressedStepsJSON.map(compressedStepJSONToStep));
              stepClientIDs.push.apply(stepClientIDs, new Array(compressedStepsJSON.length).fill(placeholderClientId));
            }
            editor.dispatch(receiveTransaction(editor.state, steps, stepClientIDs));
          }

          function updateClientSelection(snapshot) {
            var clientID = snapshot.key;
            if (clientID !== selfClientID) {
              var compressedSelection = snapshot.val();
              if (compressedSelection) {
                try {
                  selections[clientID] = Selection.fromJSON(editor.state.doc, uncompressSelectionJSON(compressedSelection));
                } catch (error) {
                  console.warn('updateClientSelection', error);
                }
              } else {
                delete selections[clientID];
              }
              editor.dispatch(editor.state.tr);
            }
          }
          selectionsRef.on('child_added', updateClientSelection);
          selectionsRef.on('child_changed', updateClientSelection);
          selectionsRef.on('child_removed', updateClientSelection);

          changesRef.startAt(null, String(latestKey + 1)).on(
            'child_added',
            function (snapshot) {
              latestKey = Number(snapshot.key);
              var ref = snapshot.val();
              var compressedStepsJSON = ref.s;
              var clientID = ref.c;
              var steps = (
                clientID === selfClientID ?
                  selfChanges[latestKey]
                :
                  compressedStepsJSON.map(compressedStepJSONToStep) );
              var stepClientIDs = new Array(steps.length).fill(clientID);
              editor.dispatch(receiveTransaction(editor.state, steps, stepClientIDs));
              delete selfChanges[latestKey];
            } );

          return Object.assign({
            destroy: this_.destroy.bind(this_),
          }, this_)
        } )
    } );

  Object.defineProperties(this, {
    then: { value: constructEditor.then.bind(constructEditor) },
    catch: { value: constructEditor.catch.bind(constructEditor) },
  });
};

FirebaseEditor.prototype.destroy = function destroy () {
    var this$1 = this;

  this.catch(function (_){ return _; }).then(function () {
    this$1.changesRef.off();
    this$1.selectionsRef.off();
    this$1.selfSelectionRef.off();
    this$1.selfSelectionRef.remove();
    this$1.view.destroy();
  });
};

exports.FirebaseEditor = FirebaseEditor;
