class Autocomplete {

    constructor(options) {
        this.options = options;
    }

    static replace(text, position, replaceValue, removeTrailing = false, afterSpace = false) {
        let beginning = text.substring(0, position);
        let trailing = text.substring(position);

        let lastIndexOf = this.lastWhitespaceIndex(beginning);
        let start = beginning.substr(0, lastIndexOf + 1);
        let end = trailing;
        if (removeTrailing) {
            let indexOf = trailing.indexOf(' ');

            end = '';
            if (indexOf !== -1)
                end = trailing.substr(indexOf);
        }

        if (afterSpace && !end.startsWith(' '))
            end = ' ' + end;

        return {
            before: beginning.length - start.length,
            after: trailing.length - end.length,
            text: start + replaceValue + end,
        };
    }

    static lastWhitespaceIndex(beginning) {
        let lastSpaceIndex = beginning.lastIndexOf(' ');
        let lastLineBreakIndex = beginning.lastIndexOf('\n');
        return lastSpaceIndex > lastLineBreakIndex ? lastSpaceIndex : lastLineBreakIndex;
    }

    suggest(text, position) {
        let beginning = text.substring(0, position);
        // let trailing = text.substring(position);

        let lastWord = beginning;
        let lastIndexOf = Autocomplete.lastWhitespaceIndex(beginning);
        if (lastIndexOf !== -1) {
            lastWord = beginning.substr(lastIndexOf + 1);
        }

        let suggests = [], found = false;

        for (let option of this.options) {
            let step = option;
            let list = step.list;
            if (typeof list !== 'function') {
                const data = list;
                if (list instanceof Array) {
                    list = search => {
                        let filtered = [];

                        let filter = require('lodash/fp/filter');
                        if (search)
                            filtered = filter(o => o.startsWith(search))(data);
                        else if (search === '')
                            filtered = data;

                        return new Promise(resolve => {
                            resolve(filtered);
                        });
                    };
                } else {
                    list = search => {
                        let filtered = [];

                        let cloneDeep = require('lodash/fp/cloneDeep');
                        let keys = require('lodash/fp/keys');
                        let filter = require('lodash/fp/filter');
                        let start = '';
                        step = cloneDeep(option);
                        while (!(step.list instanceof Array)) {
                            let changed = false;
                            for (let key of keys(step.list)) {
                                if (search.startsWith(start + key)) {
                                    let next_step = step.list[key];
                                    if (typeof next_step === 'object') {
                                        if (next_step.hasOwnProperty('list')) {
                                            if (!next_step.hasOwnProperty('trigger') || typeof next_step.trigger !== 'string')
                                                next_step.trigger = step.list.__trigger__;
                                            if (!next_step.hasOwnProperty('color') || typeof next_step.color !== 'string')
                                                next_step.color = step.list.__color__;
                                            changed = true;
                                            step = next_step;
                                            start += key + step.trigger;
                                        }
                                    }
                                }
                            }
                            if (!changed)
                                if (typeof step === 'function')
                                    return new Promise(resolve => {
                                        filtered = step(search);
                                        resolve(filtered);
                                    });
                                else if (!(step.list instanceof Array))
                                    step.list = keys(step.list);
                        }
                        if (option !== step) {
                            step.trigger = option.trigger + start;
                            if (search.startsWith(start))
                                search = search.substr(start.length);
                        }
                        if (search)
                            filtered = filter(o => o !== '__trigger__' && o !== '__color__' && o.startsWith(search))(step.list);
                        else if (search === '')
                            filtered = filter(o => o !== '__trigger__' && o !== '__color__')(step.list);

                        return new Promise(resolve => {
                            resolve(filtered);
                        });
                    };
                }
            }

            let result = undefined;
            if (!step.pattern)
                result = lastWord.startsWith(step.trigger) ? lastWord.substr(step.trigger.length) : false;
            else {
                let pattern = new RegExp(step.pattern);
                pattern = new RegExp(step.trigger + pattern.source, pattern.flags);
                result = pattern.exec(lastWord);
            }

            if (result || result === '') {
                found = true;
                list(result).then(filtered => {
                    suggests.push(...filtered.map(d => {
                        return {t: step.trigger, c: step.color, d}
                    }));
                });
            }
        }

        return new Promise((resolve, reject) => {
            if (found)
                resolve(suggests);
            else
                reject(new Error('not found!'));
        });
    }
}

module.exports = Autocomplete;