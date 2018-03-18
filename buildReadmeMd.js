#!/usr/bin/env node

const jsdoc2md = require('jsdoc-to-markdown');
const fs = require('fs-extra');
const readme = './README.md';
const macroreplaces = {
    jsdoc: {
        from: '<!-- START jsdoc-md-embedded -->',
        to: '<!-- END jsdoc-md-embedded -->'
    }
};

(async () => {
    const jsdoc = await jsdoc2md.render({ files: 'src/teamcity.js', 'heading-depth': 3});
    const original = await fs.readFile(readme, 'utf8');
    const updated = original
        .replace(
            original.substring(
                original.indexOf(macroreplaces.jsdoc.from) + macroreplaces.jsdoc.from.length
                ,original.indexOf(macroreplaces.jsdoc.to)
            ), `\n${jsdoc}\n`
        );
    await fs.writeFile(readme, updated);
})();