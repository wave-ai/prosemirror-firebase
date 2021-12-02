import {Selection}from'prosemirror-state';import {Node}from'prosemirror-model';import {Step}from'prosemirror-transform';import {collab,receiveTransaction,sendableSteps}from'prosemirror-collab';/*! *****************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */

var __assign = function() {
    __assign = Object.assign || function __assign(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};

function __awaiter(thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
}

function __generator(thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
}/**
 * This is an incomplete TypeScript translation of the forked module.
 * Instead of doing declarations, I chose to translate this to
 * better keep track of the peer dependencies and clearly indicate
 * what is needed.
 *
 * This isn't a well-written module, but in this state it is functional.
 */
var _a = require('prosemirror-compress'), compressStepsLossy = _a.compressStepsLossy, compressStateJSON = _a.compressStateJSON, uncompressStateJSON = _a.uncompressStateJSON, compressSelectionJSON = _a.compressSelectionJSON, uncompressSelectionJSON = _a.uncompressSelectionJSON, compressStepJSON = _a.compressStepJSON, uncompressStepJSON = _a.uncompressStepJSON;
var TIMESTAMP = { '.sv': 'timestamp' };
var FirebaseEditor = /** @class */ (function () {
    function FirebaseEditor(_a) {
        var firebaseRef = _a.firebaseRef, stateConfig = _a.stateConfig, constructView = _a.view, _b = _a.clientID, selfClientID = _b === void 0 ? firebaseRef.push().key : _b, _c = _a.progress, progress = _c === void 0 ? function () { } : _c;
        progress(0 / 2);
        // eslint-disable-next-line
        var this_ = this;
        var checkpointRef = this.checkpointRef = firebaseRef.child('checkpoint');
        var changesRef = this.changesRef = firebaseRef.child('changes');
        var selectionsRef = this.selectionsRef = firebaseRef.child('selections');
        var selfSelectionRef = this.selfSelectionRef = selectionsRef.child(selfClientID);
        selfSelectionRef.onDisconnect().remove();
        var selections = this.selections = {};
        var selfChanges = {};
        var selection;
        var constructEditor = checkpointRef.once('value').then(function (snapshot) {
            progress(1 / 2);
            // eslint-disable-next-line prefer-const
            var _a = snapshot.val() || {}, d = _a.d, _b = _a.k, latestKey = _b === void 0 ? -1 : _b;
            latestKey = Number(latestKey);
            stateConfig.doc = d && Node.fromJSON(stateConfig.schema, uncompressStateJSON({ d: d }).doc);
            stateConfig.plugins = (stateConfig.plugins || [])
                .concat(collab({ clientID: selfClientID }));
            function compressedStepJSONToStep(compressedStepJSON) {
                return Step.fromJSON(stateConfig.schema, uncompressStepJSON(compressedStepJSON));
            }
            function updateCollab(_a, newState) {
                var docChanged = _a.docChanged, mapping = _a.mapping;
                if (docChanged) {
                    for (var clientID in selections) {
                        if ({}.hasOwnProperty.call(selections, clientID)) {
                            selections[clientID] = selections[clientID].map(newState.doc, mapping);
                        }
                    }
                }
                var sendable = sendableSteps(newState);
                if (sendable) {
                    var steps_1 = sendable.steps, clientID_1 = sendable.clientID;
                    changesRef.child(latestKey + 1).transaction(
                    // eslint-disable-next-line consistent-return
                    function (existingBatchedSteps) {
                        if (!existingBatchedSteps) {
                            selfChanges[latestKey + 1] = steps_1;
                            return {
                                s: compressStepsLossy(steps_1).map(function (step) { return compressStepJSON(step.toJSON()); }),
                                c: clientID_1,
                                t: TIMESTAMP,
                            };
                        }
                    }, function (error, committed, dataSnapshot) {
                        var key = (dataSnapshot || {}).key;
                        if (error || !key) {
                            console.error('updateCollab', error, sendable, key);
                        }
                        else if (committed && Number(key) % 100 === 0 && Number(key) > 0) {
                            // eslint-disable-next-line @typescript-eslint/no-shadow
                            var d_1 = compressStateJSON(newState.toJSON()).d;
                            checkpointRef.set({ d: d_1, k: key, t: TIMESTAMP });
                        }
                    }, false);
                }
                var selectionChanged = !newState.selection.eq(selection);
                if (selectionChanged) {
                    selection = newState.selection;
                    selfSelectionRef.set(compressSelectionJSON(selection.toJSON()));
                }
            }
            return changesRef.startAt(null, String(latestKey + 1)).once('value').then(
            // eslint-disable-next-line @typescript-eslint/no-shadow
            function (snapshot) {
                progress(2 / 2);
                var view = this_.view = constructView({ stateConfig: stateConfig, updateCollab: updateCollab, selections: selections });
                // This should not be here, it is probably a compatibility
                // assignment.
                var editor = view.editor || view;
                var changes = snapshot.val();
                if (changes) {
                    var steps = [];
                    var stepClientIDs = [];
                    var placeholderClientId = "_oldClient".concat(Math.random());
                    var keys = Object.keys(changes).map(Number);
                    latestKey = Math.max.apply(Math, keys);
                    for (var _i = 0, keys_1 = keys; _i < keys_1.length; _i++) {
                        var key = keys_1[_i];
                        var compressedStepsJSON = changes[key].s;
                        steps.push.apply(steps, compressedStepsJSON.map(compressedStepJSONToStep));
                        stepClientIDs.push.apply(stepClientIDs, new Array(compressedStepsJSON.length).fill(placeholderClientId));
                    }
                    editor.dispatch(receiveTransaction(editor.state, steps, stepClientIDs));
                }
                // This is shadowed.
                // eslint-disable-next-line @typescript-eslint/no-shadow
                function updateClientSelection(snapshot) {
                    var clientID = snapshot.key;
                    if (clientID !== selfClientID) {
                        var compressedSelection = snapshot.val();
                        if (compressedSelection) {
                            try {
                                selections[clientID] = Selection.fromJSON(editor.state.doc, uncompressSelectionJSON(compressedSelection));
                            }
                            catch (error) {
                                console.warn('updateClientSelection', error);
                            }
                        }
                        else {
                            delete selections[clientID];
                        }
                        editor.dispatch(editor.state.tr);
                    }
                }
                selectionsRef.on('child_added', updateClientSelection);
                selectionsRef.on('child_changed', updateClientSelection);
                selectionsRef.on('child_removed', updateClientSelection);
                changesRef.startAt(null, String(latestKey + 1)).on('child_added', 
                // eslint-disable-next-line @typescript-eslint/no-shadow
                function (snapshot) {
                    latestKey = Number(snapshot.key);
                    var _a = snapshot.val(), compressedStepsJSON = _a.s, clientID = _a.c;
                    var steps = (clientID === selfClientID
                        ? selfChanges[latestKey]
                        : compressedStepsJSON.map(compressedStepJSONToStep));
                    var stepClientIDs = new Array(steps.length).fill(clientID);
                    editor.dispatch(receiveTransaction(editor.state, steps, stepClientIDs));
                    delete selfChanges[latestKey];
                });
                // This could once again be a compatibility detail.
                // I will not proceed to fix this as it may break
                // some things.
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                return __assign({ destroy: this_.destroy.bind(this_) }, this_);
            });
        });
        Object.defineProperties(this, {
            then: { value: constructEditor.then.bind(constructEditor) },
            catch: { value: constructEditor.catch.bind(constructEditor) },
        });
    }
    FirebaseEditor.prototype.destroy = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                this.catch(function (_) { return _; }).then(function () {
                    _this.changesRef.off();
                    _this.selectionsRef.off();
                    _this.selfSelectionRef.off();
                    _this.selfSelectionRef.remove();
                    _this.view.destroy();
                });
                return [2 /*return*/];
            });
        });
    };
    // eslint-disable-next-line class-methods-use-this
    FirebaseEditor.prototype.catch = function () {
        throw new Error('Method not implemented.');
    };
    return FirebaseEditor;
}());export{FirebaseEditor};//# sourceMappingURL=index.js.map
