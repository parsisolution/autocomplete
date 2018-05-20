const chai = require("chai");
// const {assert} = require('chai');  // Using Assert style
const {expect} = require('chai');  // Using Expect style
// const {should} = require('chai');  // Using Should style
// should();  // Modifies `Object.prototype`

const chaiAsPromised = require("chai-as-promised");

chai.use(chaiAsPromised);

let Autocomplete = require('../dist/Autocomplete');

describe('Auto-Complete', () => {
    describe('suggest', () => {
        let autocomplete = new Autocomplete([
            {
                trigger: '$',
                color: 'blue',
                list: {
                    __trigger__: ':',
                    __color__: '#ffa247',
                    'Sheet1': {
                        color: '#6db9fd',
                        list: {
                            'column1': false,
                            'column2': {
                                trigger: '.',
                                list: [
                                    'field1',
                                    'field2',
                                ]
                            },
                            'column3': true,
                            'column4': 2,
                        }
                    },
                    'Sheet2': {},
                    'Sheet3': true,
                    'Sheet4': {},
                    'Hello': {
                        trigger: '#',
                        list: [
                            'there',
                            'how R U',
                        ]
                    },
                }
            },
                {
                    trigger: '$#',
                    color: '#0f0',
                    list: [
                        'Hash1',
                        'Hash2',
                        'Hash3',
                    ]
                },
                {
                    // trigger can be a string or a regexp
                    // in this case this regexp should match Twitter-style @mentions
                    trigger: '@',
                    pattern: /([A-Za-z]+[_A-Za-z0-9]*)/i,
                    // The list() function gets called when the trigger matches
                    // it should return a list of elements to be suggested
                    list(match) {
                        // match is the regexp return, in this case it returns
                        // [0] the full match, [1] the first capture group => username
                        // Prepare the fake data
                        let data = [
                            'Ali',
                            'Alireza',
                            'Hassan',
                            'Hossein',
                            'Reza',
                        ];

                        let filtered = [];

                        let filter = require('lodash/fp/filter');
                        if (match && match.length > 1) {
                            filtered = filter(o => o.startsWith(match[1]))(data);
                        }
                        // let listData = data.map(function (element) {
                        //     return {
                        //         display: element.userName, // This gets displayed in the dropdown
                        //         item: element // This will get passed to onSelect
                        //     };
                        // });
                        let promise = new Promise((resolve, reject) => {
                            resolve(filtered);
                        });

                        return promise;
                    },
                    // Function that gets called when an item is selected
                    // it's return value gets added to the textarea
                    onSelect(item) {
                        return item.userName;
                    },
                    // mode can be append or replace
                    // here we want replace because the user has already typed
                    // part of the username
                    mode: 'replace'
                }
            ]
        );

        describe('beginning of text', () => {
            it('should not suggest anything', () => {
                let suggestion = autocomplete.suggest('@Ali', 0);

                return expect(suggestion).to.rejectedWith(Error);
            });

            it('should suggest Sheet 1 through 4 and Hello', () => {
                let suggestion = autocomplete.suggest('$Sheet', 1);
                let result = [
                    {"c": "blue", "d": "Sheet1", "t": "$",},
                    {"c": "blue", "d": "Sheet2", "t": "$",},
                    {"c": "blue", "d": "Sheet3", "t": "$",},
                    {"c": "blue", "d": "Sheet4", "t": "$",},
                    {"c": "blue", "d": "Hello", "t": "$",},
                ];

                return expect(suggestion).to.eventually.deep.equal(result);
            });

            it('should suggest $# trigger options', () => {
                let suggestion = autocomplete.suggest('$#', 2);
                let result = [
                    {"c": "#0f0", "d": "Hash1", "t": "$#",},
                    {"c": "#0f0", "d": "Hash2", "t": "$#",},
                    {"c": "#0f0", "d": "Hash3", "t": "$#",},
                ];

                return expect(suggestion).to.eventually.deep.equal(result);
            });

            it('should suggest Sheet 1 through 4', () => {
                let suggestion = autocomplete.suggest('$Sheet', 2);
                let result = [
                    {"c": "blue", "d": "Sheet1", "t": "$",},
                    {"c": "blue", "d": "Sheet2", "t": "$",},
                    {"c": "blue", "d": "Sheet3", "t": "$",},
                    {"c": "blue", "d": "Sheet4", "t": "$",},
                ];

                return expect(suggestion).to.eventually.deep.equal(result);
            });

            it('should suggest Column 1 through 4', () => {
                let suggestion = autocomplete.suggest('$Sheet1:co', 9);
                let result = [
                    {"c": "#6db9fd", "d": "column1", "t": "$Sheet1:",},
                    {"c": "#6db9fd", "d": "column2", "t": "$Sheet1:",},
                    {"c": "#6db9fd", "d": "column3", "t": "$Sheet1:",},
                    {"c": "#6db9fd", "d": "column4", "t": "$Sheet1:",},
                ];

                return expect(suggestion).to.eventually.deep.equal(result);
            });

            it('should suggest fields 1 and 2', () => {
                let suggestion = autocomplete.suggest('$Sheet1:column2.', 16);
                let result = [
                    {"c": undefined, "d": "field1", "t": "$Sheet1:column2.",},
                    {"c": undefined, "d": "field2", "t": "$Sheet1:column2.",},
                ];

                return expect(suggestion).to.eventually.deep.equal(result);
            });

            it('should suggest Ali and Alireza', () => {
                let suggestion = autocomplete.suggest('@Ali', 4);
                let result = [{"c": undefined, "d": "Ali", "t": "@",}, {"c": undefined, "d": "Alireza", "t": "@",},];

                return expect(suggestion).to.eventually.deep.equal(result);
            });
        });

        describe('middle of text', () => {
            it('should suggest Ali and Alireza', () => {
                let suggestion = autocomplete.suggest('Hello @Ali', 10);
                let result = [{"c": undefined, "d": "Ali", "t": "@",}, {"c": undefined, "d": "Alireza", "t": "@",},];

                return expect(suggestion).to.eventually.deep.equal(result);
            });

            it('should suggest Hassan and Hossein', () => {
                let suggestion = autocomplete.suggest('Hello @Hossein', 8);
                let result = [{"c": undefined, "d": "Hassan", "t": "@",}, {"c": undefined, "d": "Hossein", "t": "@",},];

                return expect(suggestion).to.eventually.deep.equal(result);
            });

            it('should suggest there and how R U', () => {
                let suggestion = autocomplete.suggest('@ $Hello#', 9);
                let result = [
                    {"c": "#ffa247", "d": "there", "t": "$Hello#",},
                    {"c": "#ffa247", "d": "how R U", "t": "$Hello#",},
                ];

                return expect(suggestion).to.eventually.deep.equal(result);
            });
        });
    });

    describe('replace', () => {
        it('should replace @A| with @Ali', () => {
            let replaced = Autocomplete.replace('Hello @A', 8, '@Ali', false, true);

            return expect(replaced).to.deep.equal({
                "after": -1,
                "before": 2,
                "text": "Hello @Ali "
            });
        });

        it('should replace @|R with @Ali which results @AliR', () => {
            let replaced = Autocomplete.replace('@R', 1, '@Ali');

            return expect(replaced).to.deep.equal({
                "after": 0,
                "before": 1,
                "text": "@AliR"
            });
        });

        it('should replace @|A with @Ali and remove trailing & insert space', () => {
            let replaced = Autocomplete.replace('@A', 1, '@Ali', true, true);

            return expect(replaced).to.deep.equal({
                "after": 0,
                "before": 1,
                "text": "@Ali "
            });
        });

        it('should replace @|A with @Ali and remove trailing', () => {
            let replaced = Autocomplete.replace('@A', 1, '@Ali', true);

            return expect(replaced).to.deep.equal({
                "after": 1,
                "before": 1,
                "text": "@Ali"
            });
        });
    });
});